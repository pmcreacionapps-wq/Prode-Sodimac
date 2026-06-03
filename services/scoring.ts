import { prisma } from "@/lib/prisma";

interface ScoringConfig {
  pointsExactScore: number;
  pointsCorrectWinner: number;
  pointsSemifinalist: number;
}

/**
 * Calculate points for a single prediction.
 * Returns { points, isExact, isCorrectWinner }
 */
export function calculatePredictionPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  config: ScoringConfig
): { points: number; isExactScore: boolean; isCorrectWinner: boolean } {
  const isExactScore =
    predictedHome === actualHome && predictedAway === actualAway;

  if (isExactScore) {
    return {
      points: config.pointsExactScore,
      isExactScore: true,
      isCorrectWinner: true,
    };
  }

  const actualWinner =
    actualHome > actualAway ? "home" : actualAway > actualHome ? "away" : "draw";
  const predictedWinner =
    predictedHome > predictedAway
      ? "home"
      : predictedAway > predictedHome
      ? "away"
      : "draw";

  const isCorrectWinner = actualWinner === predictedWinner;

  return {
    points: isCorrectWinner ? config.pointsCorrectWinner : 0,
    isExactScore: false,
    isCorrectWinner,
  };
}

/**
 * Score all predictions for a finished match.
 * Idempotent — can be called multiple times safely.
 */
export async function scoreMatchPredictions(matchId: string): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
  });

  if (
    match.homeScore === null ||
    match.awayScore === null ||
    match.status !== "FINISHED"
  ) {
    console.warn(`Match ${matchId} is not finished yet, skipping scoring.`);
    return;
  }

  const settings = await prisma.adminSettings.findUnique({
    where: { id: "singleton" },
  });

  const config: ScoringConfig = {
    pointsExactScore: settings?.pointsExactScore ?? 3,
    pointsCorrectWinner: settings?.pointsCorrectWinner ?? 1,
    pointsSemifinalist: settings?.pointsSemifinalist ?? 2,
  };

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });

  // Process in batches
  await Promise.all(
    predictions.map(async (pred) => {
      const { points, isExactScore, isCorrectWinner } =
        calculatePredictionPoints(
          pred.predictedHomeScore,
          pred.predictedAwayScore,
          match.homeScore!,
          match.awayScore!,
          config
        );

      await prisma.prediction.update({
        where: { id: pred.id },
        data: { pointsEarned: points, isExactScore, isCorrectWinner },
      });
    })
  );

  // Recalculate total points for all users who predicted this match
  const userIds = [...new Set(predictions.map((p) => p.userId))];

  await Promise.all(
    userIds.map(async (userId) => {
      await recalculateUserTotals(userId);
      await recalculateWeeklyScore(userId, predictions[0]?.weekNumber ?? 1);
      await updateUserStreak(userId);
      await checkAndAwardBadges(userId);
    })
  );

  // Snapshot ranking history after each match
  await snapshotRankingHistory(matchId);
}

/**
 * Recalculate a user's total points from scratch.
 */
export async function recalculateUserTotals(userId: string): Promise<void> {
  const agg = await prisma.prediction.aggregate({
    where: { userId, pointsEarned: { not: null } },
    _sum: { pointsEarned: true },
    _count: { isExactScore: true },
  });

  const exactCount = await prisma.prediction.count({
    where: { userId, isExactScore: true },
  });

  const winnerCount = await prisma.prediction.count({
    where: { userId, isCorrectWinner: true },
  });

  // Add semifinalist bonus points
  const semiBonusAgg = await prisma.semifinalistPick.aggregate({
    where: { userId },
    _sum: { bonusPoints: true },
  });

  const totalPoints =
    (agg._sum.pointsEarned ?? 0) + (semiBonusAgg._sum.bonusPoints ?? 0);

  await prisma.user.update({
    where: { id: userId },
    data: {
      totalPoints,
      exactScores: exactCount,
      correctWinner: winnerCount,
    },
  });
}

/**
 * Recalculate weekly score for a user.
 */
export async function recalculateWeeklyScore(
  userId: string,
  weekNumber: number
): Promise<void> {
  const agg = await prisma.prediction.aggregate({
    where: { userId, weekNumber, pointsEarned: { not: null } },
    _sum: { pointsEarned: true },
  });

  const exactCount = await prisma.prediction.count({
    where: { userId, weekNumber, isExactScore: true },
  });

  await prisma.weeklyScore.upsert({
    where: { userId_weekNumber: { userId, weekNumber } },
    create: {
      userId,
      weekNumber,
      points: agg._sum.pointsEarned ?? 0,
      exactScores: exactCount,
    },
    update: {
      points: agg._sum.pointsEarned ?? 0,
      exactScores: exactCount,
    },
  });
}

/**
 * Update streak for a user after their latest prediction is scored.
 */
export async function updateUserStreak(userId: string): Promise<void> {
  // Get recent scored predictions in chronological order
  const recentPredictions = await prisma.prediction.findMany({
    where: { userId, pointsEarned: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  let streak = 0;
  for (const pred of recentPredictions) {
    if ((pred.pointsEarned ?? 0) > 0) {
      streak++;
    } else {
      break;
    }
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  await prisma.user.update({
    where: { id: userId },
    data: {
      streak,
      maxStreak: Math.max(streak, user.maxStreak),
    },
  });
}

/**
 * Award badges based on user's current stats.
 */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const existingBadgeIds = (
    await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    })
  ).map((b) => b.badgeId);

  const allBadges = await prisma.badge.findMany();

  for (const badge of allBadges) {
    if (existingBadgeIds.includes(badge.id)) continue;

    let earned = false;

    switch (badge.name) {
      case "first_blood":
        earned = user.exactScores >= 1;
        break;
      case "sharp_shooter":
        earned = user.exactScores >= 5;
        break;
      case "hot_streak":
        earned = user.streak >= 5;
        break;
      case "legendary_streak":
        earned = user.maxStreak >= 10;
        break;
      case "century_club":
        earned = user.totalPoints >= 100;
        break;
      case "top_predictor":
        earned = user.totalPoints >= 50 && user.exactScores >= 10;
        break;
    }

    if (earned) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: "BADGE_EARNED",
          title: "New badge earned! 🏅",
          body: `You earned the "${badge.name}" badge: ${badge.description}`,
        },
      });
    }
  }
}

/**
 * Snapshot ranking after a match is scored.
 */
async function snapshotRankingHistory(matchId: string): Promise<void> {
  const users = await prisma.user.findMany({
    where: { isBlocked: false },
    orderBy: [{ totalPoints: "desc" }, { exactScores: "desc" }],
    select: { id: true, totalPoints: true },
  });

  await Promise.all(
    users.map((user, idx) =>
      prisma.rankingHistory.create({
        data: {
          userId: user.id,
          afterMatchId: matchId,
          rank: idx + 1,
          totalPoints: user.totalPoints,
        },
      })
    )
  );

  // Notify users who moved into top 3
  const top3 = users.slice(0, 3);
  for (const topUser of top3) {
    await prisma.notification.create({
      data: {
        userId: topUser.id,
        type: "RANK_CHANGE",
        title: "You're in the Top 3! 🏆",
        body: "Keep it up — you're among the top predictors!",
      },
    });
  }
}

/**
 * Recalculate ALL predictions from scratch (admin function).
 */
export async function recalculateAllScores(): Promise<void> {
  const finishedMatches = await prisma.match.findMany({
    where: { status: "FINISHED" },
    orderBy: { kickoffAt: "asc" },
  });

  // Reset all points
  await prisma.prediction.updateMany({
    data: { pointsEarned: null, isExactScore: null, isCorrectWinner: null },
  });
  await prisma.user.updateMany({
    data: { totalPoints: 0, exactScores: 0, correctWinner: 0, streak: 0 },
  });
  await prisma.weeklyScore.deleteMany();

  for (const match of finishedMatches) {
    await scoreMatchPredictions(match.id);
  }
}
