"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { syncAllFixtures, syncLiveMatches } from "@/services/football-api";
import { recalculateAllScores } from "@/services/scoring";
import type { ActionResponse } from "@/types";

/**
 * Force sync all fixtures from the football API.
 */
export async function adminSyncFixturesAction(): Promise<
  ActionResponse<{ synced: number }>
> {
  await requireAdmin();
  const result = await syncAllFixtures();

  if (result.errors.length > 0) {
    console.error("Sync errors:", result.errors);
  }

  revalidatePath("/fixture");
  revalidatePath("/admin");

  return { success: true, data: { synced: result.synced } };
}

/**
 * Force sync live matches.
 */
export async function adminSyncLiveAction(): Promise<
  ActionResponse<{ updated: number }>
> {
  await requireAdmin();
  const result = await syncLiveMatches();

  revalidatePath("/fixture");
  revalidatePath("/ranking");

  return { success: true, data: { updated: result.updated } };
}

/**
 * Recalculate all scores from scratch.
 */
export async function adminRecalculateScoresAction(): Promise<ActionResponse> {
  await requireAdmin();
  await recalculateAllScores();

  revalidatePath("/ranking");
  revalidatePath("/my-stats");

  return { success: true, data: undefined };
}

/**
 * Block or unblock a user.
 */
export async function adminToggleBlockUserAction(
  userId: string,
  block: boolean
): Promise<ActionResponse> {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: block },
  });

  revalidatePath("/admin/users");

  return { success: true, data: undefined };
}

/**
 * Update admin settings (scoring config).
 */
export async function adminUpdateSettingsAction(settings: {
  pointsExactScore: number;
  pointsCorrectWinner: number;
  pointsSemifinalist: number;
  predictionsOpen: boolean;
}): Promise<ActionResponse> {
  await requireAdmin();

  await prisma.adminSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...settings },
    update: settings,
  });

  revalidatePath("/admin/settings");

  return { success: true, data: undefined };
}

/**
 * Create an announcement.
 */
export async function adminCreateAnnouncementAction(data: {
  title: string;
  body: string;
  pinned: boolean;
  expiresAt?: Date;
}): Promise<ActionResponse> {
  await requireAdmin();

  const announcement = await prisma.announcement.create({ data });

  // Notify all active users
  const users = await prisma.user.findMany({
    where: { isBlocked: false },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: users.map(({ id }) => ({
      userId: id,
      type: "ANNOUNCEMENT" as const,
      title: data.title,
      body: data.body,
      data: { announcementId: announcement.id },
    })),
  });

  revalidatePath("/admin/announcements");

  return { success: true, data: undefined };
}

/**
 * Export rankings as CSV data.
 */
export async function adminExportRankingsAction(): Promise<
  ActionResponse<string>
> {
  await requireAdmin();

  const users = await prisma.user.findMany({
    where: { isBlocked: false },
    orderBy: [{ totalPoints: "desc" }, { exactScores: "desc" }],
    select: {
      nickname: true,
      firstName: true,
      lastName: true,
      totalPoints: true,
      exactScores: true,
      correctWinner: true,
      streak: true,
      curso: true,
    },
  });

  const header = "Rank,Nickname,First Name,Last Name,Curso,Total Points,Exact Scores,Correct Winners,Streak";
  const rows = users.map(
    (u, i) =>
      `${i + 1},${u.nickname},${u.firstName},${u.lastName},${u.curso ?? ""},${u.totalPoints},${u.exactScores},${u.correctWinner},${u.streak}`
  );

  const csv = [header, ...rows].join("\n");
  return { success: true, data: csv };
}

/**
 * Get all users for admin panel.
 */
export async function adminGetUsersAction() {
  await requireAdmin();

  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nickname: true,
      firstName: true,
      lastName: true,
      email: true,
      curso: true,
      isAdmin: true,
      isBlocked: true,
      totalPoints: true,
      exactScores: true,
      createdAt: true,
    },
  });
}

/**
 * Delete all data and reset tournament (DANGER).
 */
export async function adminResetTournamentAction(): Promise<ActionResponse> {
  await requireAdmin();

  await prisma.$transaction([
    prisma.rankingHistory.deleteMany(),
    prisma.weeklyScore.deleteMany(),
    prisma.prediction.deleteMany(),
    prisma.semifinalistPick.deleteMany(),
    prisma.userBadge.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.user.updateMany({
      data: {
        totalPoints: 0,
        exactScores: 0,
        correctWinner: 0,
        streak: 0,
        maxStreak: 0,
      },
    }),
    prisma.match.updateMany({
      data: {
        homeScore: null,
        awayScore: null,
        status: "SCHEDULED",
        predictionsLocked: false,
        winnerId: null,
      },
    }),
  ]);

  revalidatePath("/", "layout");

  return { success: true, data: undefined };
}
