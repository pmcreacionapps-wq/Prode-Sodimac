import { prisma } from "@/lib/prisma";
import type { MatchPhase, MatchStatus } from "@prisma/client";

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
// FIFA World Cup 2026 league ID in API-Football
const WC_2026_LEAGUE_ID = 1; // Will be confirmed closer to tournament
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

/**
 * Map API-Football round string to our MatchPhase enum.
 */
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

/**
 * Map API-Football status to our MatchStatus enum.
 */
function mapStatus(short: string): MatchStatus {
  switch (short) {
    case "NS": // Not Started
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
        const predictionsLocked = new Date() >= kickoffAt || status !== "SCHEDULED";

        // Determine winner
        let winnerId: string | null = null;
        if (
          status === "FINISHED" &&
          fixture.goals.home !== null &&
          fixture.goals.away !== null
        ) {
          if (fixture.goals.home > fixture.goals.away) winnerId = homeTeamId;
          else if (fixture.goals.away > fixture.goals.home) winnerId = awayTeamId;
          // null = draw
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
          `Fixture ${fixture.fixture.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  } catch (err) {
    errors.push(`API fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { synced, errors };
}

/**
 * Sync live and recently finished matches only (for frequent cron).
 */
export async function syncLiveMatches(): Promise<{
  updated: number;
  errors: string[];
}> {
  let updated = 0;
  const errors: string[] = [];

  try {
    // Get matches happening today
    const today = new Date().toISOString().split("T")[0];
    const fixtures = await apiFetch<APIFixture[]>(
      `/fixtures?league=${WC_2026_LEAGUE_ID}&season=${WC_2026_SEASON}&date=${today}`
    );

    for (const fixture of fixtures) {
      try {
        const status = mapStatus(fixture.fixture.status.short);

        // Find match in our DB
        const match = await prisma.match.findUnique({
          where: { apiId: fixture.fixture.id },
          include: { homeTeam: true, awayTeam: true },
        });

        if (!match) continue;

        const wasFinished = match.status !== "FINISHED" && status === "FINISHED";

        await prisma.match.update({
          where: { id: match.id },
          data: {
            status,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            predictionsLocked:
              status !== "SCHEDULED" || new Date() >= match.kickoffAt,
          },
        });

        // If just finished, score predictions
        if (wasFinished && fixture.goals.home !== null && fixture.goals.away !== null) {
          const { scoreMatchPredictions } = await import("@/services/scoring");
          await scoreMatchPredictions(match.id);

          // Notify users their match result is in
          await prisma.notification.createMany({
            data: (
              await prisma.prediction.findMany({
                where: { matchId: match.id },
                select: { userId: true },
              })
            ).map(({ userId }) => ({
              userId,
              type: "SCORE_UPDATED" as const,
              title: "Results updated! ⚽",
              body: `${match.homeTeam.name} ${fixture.goals.home} - ${fixture.goals.away} ${match.awayTeam.name}`,
            })),
          });
        }

        updated++;
      } catch (err) {
        errors.push(
          `Fixture ${fixture.fixture.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  } catch (err) {
    errors.push(`API fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { updated, errors };
}

/**
 * Lock predictions for matches starting in the next 5 minutes.
 * Called by cron every minute during match days.
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
