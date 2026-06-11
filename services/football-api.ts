import { prisma } from "@/lib/prisma";
import type { MatchPhase, MatchStatus } from "@/types";

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const WC_2026_LEAGUE_ID = 1;
const WC_2026_SEASON = 2026;

async function apiFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_FOOTBALL_BASE}${endpoint}`, {
    headers: {
      "x-apisports-key": process.env.FOOTBALL_API_KEY!,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.response as T;
}

function mapRoundToPhase(round: string): MatchPhase {
  const r = round.toLowerCase();
  if (r.includes("group")) return "GROUP";
  if (r.includes("round of 32")) return "ROUND_OF_32";
  if (r.includes("round of 16")) return "ROUND_OF_16";
  if (r.includes("quarter")) return "QUARTER_FINAL";
  if (r.includes("semi")) return "SEMI_FINAL";
  if (r.includes("third")) return "THIRD_PLACE";
  if (r.includes("final")) return "FINAL";
  return "GROUP";
}

function mapStatus(short: string): MatchStatus {
  switch (short) {
    case "NS":
      return "SCHEDULED";
    case "1H":
    case "2H":
    case "HT":
    case "ET":
    case "BT":
    case "P":
    case "LIVE":
      return "LIVE";
    case "FT":
    case "AET":
    case "PEN":
      return "FINISHED";
    case "PST":
      return "POSTPONED";
    case "CANC":
    case "ABD":
    case "INT":
    case "AWD":
    case "WO":
      return "CANCELLED";
    default:
      return "SCHEDULED";
  }
}

interface APITeam {
  id: number;
  name: string;
  logo: string;
}

interface APIFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue: { name: string | null; city: string | null } | null;
  };
  league: {
    round: string;
    group?: string;
  };
  teams: {
    home: APITeam;
    away: APITeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

/**
 * Normalize team name for fuzzy matching.
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if two team names are a match (handles common API name variations).
 */
function teamsMatch(apiName: string, dbName: string): boolean {
  const api = normalizeTeamName(apiName);
  const db = normalizeTeamName(dbName);

  if (api === db) return true;

  const aliases: Record<string, string[]> = {
    "korea republic": ["south korea"],
    "south korea": ["korea republic"],
    "republic of ireland": ["ireland"],
    "dr congo": ["rd congo", "democratic republic of congo", "congo dr"],
    "rd congo": ["dr congo", "democratic republic of congo"],
    "ivory coast": ["cote d ivoire", "cote divoire"],
    "cote d ivoire": ["ivory coast"],
    "bosnia herzegovina": ["bosnia and herzegovina", "bosnia herzegovina"],
    "bosnia and herzegovina": ["bosnia herzegovina"],
    "cape verde": ["cabo verde"],
    "cabo verde": ["cape verde"],
    "turkiye": ["turkey"],
    "turkey": ["turkiye"],
    "curacao": ["curaçao"],
    "czechia": ["czech republic"],
    "czech republic": ["czechia"],
  };

  const apiAliases = aliases[api] ?? [];
  if (apiAliases.includes(db)) return true;

  const dbAliases = aliases[db] ?? [];
  if (dbAliases.includes(api)) return true;

  if (api.includes(db) || db.includes(api)) return true;

  return false;
}

/**
 * Find our DB match by comparing kickoff time (±90 min window) and team names.
 */
async function findMatchInDB(fixture: APIFixture) {
  const apiKickoff = new Date(fixture.fixture.date);
  const windowStart = new Date(apiKickoff.getTime() - 90 * 60 * 1000);
  const windowEnd = new Date(apiKickoff.getTime() + 90 * 60 * 1000);

  const candidates = await prisma.match.findMany({
    where: {
      kickoffAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  for (const match of candidates) {
    const homeMatch = teamsMatch(fixture.teams.home.name, match.homeTeam.name);
    const awayMatch = teamsMatch(fixture.teams.away.name, match.awayTeam.name);
    if (homeMatch && awayMatch) return match;
  }

  return null;
}

/**
 * Sync live and recently finished matches only (for frequent cron).
 * Matches by kickoff time + team names instead of api_id.
 */
export async function syncLiveMatches(): Promise<{
  updated: number;
  errors: string[];
}> {
  let updated = 0;
  const errors: string[] = [];

  try {
    const today = new Date().toISOString().split("T")[0];
    const fixtures = await apiFetch<APIFixture[]>(
      `/fixtures?league=${WC_2026_LEAGUE_ID}&season=${WC_2026_SEASON}&date=${today}`
    );

    for (const fixture of fixtures) {
      try {
        const status = mapStatus(fixture.fixture.status.short);
        const match = await findMatchInDB(fixture);

        if (!match) {
          errors.push(
            `No DB match found for: ${fixture.teams.home.name} vs ${fixture.teams.away.name} at ${fixture.fixture.date}`
          );
          continue;
        }

        const wasFinished = match.status !== "FINISHED" && status === "FINISHED";

        await prisma.match.update({
          where: { id: match.id },
          data: {
            status,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            predictionsLocked:
              status !== "SCHEDULED" || new Date() >= match.kickoffAt,
            // Store apiId if not set yet
            ...(match.apiId == null ? { apiId: fixture.fixture.id } : {}),
          },
        });

        if (wasFinished && fixture.goals.home !== null && fixture.goals.away !== null) {
          const { scoreMatchPredictions } = await import("@/services/scoring");
          await scoreMatchPredictions(match.id);

          await prisma.notification.createMany({
            data: (
              await prisma.prediction.findMany({
                where: { matchId: match.id },
                select: { userId: true },
              })
            ).map(({ userId }) => ({
              userId,
              type: "SCORE_UPDATED" as const,
              title: "¡Resultado actualizado! ⚽",
              body: `${match.homeTeam.name} ${fixture.goals.home} - ${fixture.goals.away} ${match.awayTeam.name}`,
            })),
          });
        }

        updated++;
      } catch (err) {
        errors.push(
          `Fixture ${fixture.fixture.id}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  } catch (err) {
    errors.push(
      `API fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return { updated, errors };
}

/**
 * Upsert a team from API data.
 */
async function upsertTeam(apiTeam: APITeam): Promise<string> {
  const team = await prisma.team.upsert({
    where: { apiId: apiTeam.id },
    create: {
      name: apiTeam.name,
      shortName: apiTeam.name.slice(0, 3).toUpperCase(),
      flagUrl: apiTeam.logo,
      apiId: apiTeam.id,
    },
    update: {
      name: apiTeam.name,
      flagUrl: apiTeam.logo,
    },
  });
  return team.id;
}

/**
 * Sync all fixtures from API-Football for the 2026 World Cup.
 */
export async function syncAllFixtures(): Promise<{
  synced: number;
  errors: string[];
}> {
  let synced = 0;
  const errors: string[] = [];

  try {
    const fixtures = await apiFetch<APIFixture[]>(
      `/fixtures?league=${WC_2026_LEAGUE_ID}&season=${WC_2026_SEASON}`
    );

    for (const fixture of fixtures) {
      try {
        const homeTeamId = await upsertTeam(fixture.teams.home);
        const awayTeamId = await upsertTeam(fixture.teams.away);

        const phase = mapRoundToPhase(fixture.league.round);
        const status = mapStatus(fixture.fixture.status.short);
        const kickoffAt = new Date(fixture.fixture.date);
        const predictionsLocked =
          new Date() >= kickoffAt || status !== "SCHEDULED";

        let winnerId: string | null = null;
        if (
          status === "FINISHED" &&
          fixture.goals.home !== null &&
          fixture.goals.away !== null
        ) {
          if (fixture.goals.home > fixture.goals.away) winnerId = homeTeamId;
          else if (fixture.goals.away > fixture.goals.home) winnerId = awayTeamId;
        }

        await prisma.match.upsert({
          where: { apiId: fixture.fixture.id },
          create: {
            apiId: fixture.fixture.id,
            homeTeamId,
            awayTeamId,
            kickoffAt,
            venue: fixture.fixture.venue?.name ?? null,
            city: fixture.fixture.venue?.city ?? null,
            phase,
            groupName: fixture.league.group ?? null,
            roundName: fixture.league.round,
            status,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            winnerId,
            predictionsLocked,
          },
          update: {
            kickoffAt,
            venue: fixture.fixture.venue?.name ?? null,
            city: fixture.fixture.venue?.city ?? null,
            status,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            winnerId,
            predictionsLocked,
          },
        });

        synced++;
      } catch (err) {
        errors.push(
          `Fixture ${fixture.fixture.id}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  } catch (err) {
    errors.push(
      `API fetch failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return { synced, errors };
}

/**
 * Lock predictions for matches starting in the next 5 minutes.
 */
export async function lockUpcomingMatches(): Promise<void> {
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  await prisma.match.updateMany({
    where: {
      predictionsLocked: false,
      kickoffAt: { lte: fiveMinutesFromNow },
    },
    data: { predictionsLocked: true },
  });
}

