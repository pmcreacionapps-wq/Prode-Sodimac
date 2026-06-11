import { prisma } from "@/lib/prisma";

const WC26_API = "https://worldcup26.ir/get/games";

interface WC26Game {
  id: string;
  home_team_name_en: string;
  away_team_name_en: string;
  home_score: string;
  away_score: string;
  finished: string;
  time_elapsed: string;
  type: string;
}

function mapStatus(game: WC26Game): "SCHEDULED" | "LIVE" | "FINISHED" {
  if (game.finished === "TRUE") return "FINISHED";
  if (game.time_elapsed === "notstarted") return "SCHEDULED";
  return "LIVE";
}

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function teamsMatch(apiName: string, dbName: string): boolean {
  const api = normalizeTeamName(apiName);
  const db = normalizeTeamName(dbName);

  if (api === db) return true;

  const aliases: Record<string, string[]> = {
    "korea republic": ["south korea"],
    "south korea": ["korea republic"],
    "dr congo": ["rd congo", "democratic republic of the congo", "democratic republic of congo"],
    "rd congo": ["dr congo", "democratic republic of the congo"],
    "democratic republic of the congo": ["rd congo", "dr congo"],
    "ivory coast": ["cote d ivoire"],
    "cote d ivoire": ["ivory coast"],
    "bosnia and herzegovina": ["bosnia herzegovina"],
    "bosnia herzegovina": ["bosnia and herzegovina"],
    "cape verde": ["cabo verde"],
    "cabo verde": ["cape verde"],
    "turkiye": ["turkey"],
    "turkey": ["turkiye"],
    "curacao": ["curaçao", "curacoa"],
    "curaçao": ["curacao"],
    "czechia": ["czech republic"],
    "czech republic": ["czechia"],
    "sweden": ["suecia"],
    "suecia": ["sweden"],
  };

  const apiAliases = aliases[api] ?? [];
  if (apiAliases.includes(db)) return true;

  const dbAliases = aliases[db] ?? [];
  if (dbAliases.includes(api)) return true;

  if (api.includes(db) || db.includes(api)) return true;

  return false;
}

async function findMatchInDB(game: WC26Game) {
  const matches = await prisma.match.findMany({
    where: { status: { in: ["SCHEDULED", "LIVE"] } },
    include: { homeTeam: true, awayTeam: true },
  });

  for (const match of matches) {
    const homeMatch = teamsMatch(game.home_team_name_en, match.homeTeam.name);
    const awayMatch = teamsMatch(game.away_team_name_en, match.awayTeam.name);
    if (homeMatch && awayMatch) return match;
  }

  return null;
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
    const res = await fetch(WC26_API, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`worldcup26.ir error: ${res.status}`);

    const data = await res.json();
    const games: WC26Game[] = data.games ?? [];

    // Only process games that are live or finished
    const activeGames = games.filter(
      (g) => g.finished === "TRUE" || g.time_elapsed !== "notstarted"
    );

    for (const game of activeGames) {
      try {
        const status = mapStatus(game);
        const match = await findMatchInDB(game);

        if (!match) {
          errors.push(`No DB match found for: ${game.home_team_name_en} vs ${game.away_team_name_en}`);
          continue;
        }

        const homeScore = parseInt(game.home_score) || 0;
        const awayScore = parseInt(game.away_score) || 0;
        const wasFinished = match.status !== "FINISHED" && status === "FINISHED";

        await prisma.match.update({
          where: { id: match.id },
          data: {
            status,
            homeScore,
            awayScore,
            predictionsLocked: status !== "SCHEDULED" || new Date() >= match.kickoffAt,
          },
        });

        if (wasFinished) {
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
              body: `${match.homeTeam.name} ${homeScore} - ${awayScore} ${match.awayTeam.name}`,
            })),
          });
        }

        updated++;
      } catch (err) {
        errors.push(
          `Game ${game.id}: ${err instanceof Error ? err.message : String(err)}`
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

/**
 * Sync all fixtures (admin action - kept for compatibility).
 */
export async function syncAllFixtures(): Promise<{
  synced: number;
  errors: string[];
}> {
  const result = await syncLiveMatches();
  return { synced: result.updated, errors: result.errors };
}
