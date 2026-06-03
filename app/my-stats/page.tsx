import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { StatsOverview } from "@/components/stats/stats-overview";
import { AccuracyChart } from "@/components/stats/accuracy-chart";
import { BadgesGrid } from "@/components/stats/badges-grid";
import { PredictionHistory } from "@/components/stats/prediction-history";
import { SemifinalistStatus } from "@/components/stats/semifinalist-status";

export const dynamic = "force-dynamic";

export default async function MyStatsPage() {
  const user = await requireAuth();

  const [
    totalPredictions,
    scoredPredictions,
    weeklyHistory,
    rankHistory,
    badges,
    semiPicks,
    globalRank,
  ] = await Promise.all([
    prisma.prediction.count({ where: { userId: user.id } }),
    prisma.prediction.findMany({
      where: { userId: user.id, pointsEarned: { not: null } },
      include: { match: { include: { homeTeam: true, awayTeam: true } } },
      orderBy: { match: { kickoffAt: "desc" } },
      take: 20,
    }),
    prisma.weeklyScore.findMany({
      where: { userId: user.id },
      orderBy: { weekNumber: "asc" },
    }),
    prisma.rankingHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 30,
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.semifinalistPick.findMany({
      where: { userId: user.id },
      include: { team: true },
    }),
    // Calculate global rank
    prisma.user
      .findMany({
        where: { isBlocked: false },
        orderBy: [{ totalPoints: "desc" }, { exactScores: "desc" }],
        select: { id: true },
      })
      .then((users) => users.findIndex((u) => u.id === user.id) + 1),
  ]);

  const accuracy =
    scoredPredictions.length > 0
      ? Math.round(
          (scoredPredictions.filter((p) => (p.pointsEarned ?? 0) > 0).length /
            scoredPredictions.length) *
            100
        )
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My performance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hey{" "}
          <span className="font-medium text-foreground">@{user.nickname}</span>
          , here are your stats.
        </p>
      </div>

      {/* Overview cards */}
      <StatsOverview
        totalPoints={user.totalPoints}
        exactScores={user.exactScores}
        correctWinner={user.correctWinner}
        streak={user.streak}
        maxStreak={user.maxStreak}
        accuracy={accuracy}
        globalRank={globalRank}
        totalPredictions={totalPredictions}
      />

      {/* Semifinalist picks status */}
      {semiPicks.length > 0 && <SemifinalistStatus picks={semiPicks} />}

      {/* Weekly chart */}
      {weeklyHistory.length > 0 && (
        <AccuracyChart weeklyHistory={weeklyHistory} rankHistory={rankHistory} />
      )}

      {/* Badges */}
      <BadgesGrid badges={badges} />

      {/* Recent predictions */}
      <PredictionHistory predictions={scoredPredictions} />
    </div>
  );
}
