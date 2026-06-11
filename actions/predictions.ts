"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentWeek } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResponse, Prediction } from "@/types";

const predictionSchema = z.object({
  matchId: z.string().min(1),
  predictedHomeScore: z.number().int().min(0).max(99),
  predictedAwayScore: z.number().int().min(0).max(99),
});

/**
 * Save or update a prediction.
 * Triple-validated: schema → match locked check → DB constraint.
 */
export async function savePredictionAction(
  input: z.infer<typeof predictionSchema>
): Promise<ActionResponse<Prediction>> {
  const user = await requireAuth();

  const parsed = predictionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid prediction data" };
  }

  const { matchId, predictedHomeScore, predictedAwayScore } = parsed.data;

  // Server-side lock check — re-validates even if frontend already checked
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { predictionsLocked: true, status: true, kickoffAt: true },
  });

  if (!match) {
    return { success: false, error: "Match not found" };
  }

  // Check both lock flag AND time (dual protection)
  const isLocked =
    match.predictionsLocked ||
    match.status !== "SCHEDULED" ||
    new Date() >= match.kickoffAt;

  if (isLocked) {
    return {
      success: false,
      error: "Predictions are locked — the match has already started",
    };
  }

  const weekNumber = getCurrentWeek();

  const prediction = await prisma.prediction.upsert({
    where: {
      userId_matchId: { userId: user.id, matchId },
    },
    create: {
      userId: user.id,
      matchId,
      predictedHomeScore,
      predictedAwayScore,
      weekNumber,
    },
    update: {
      predictedHomeScore,
      predictedAwayScore,
    },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true },
      },
    },
  });

  revalidatePath("/fixture");
  revalidatePath("/predictions");

  return { success: true, data: prediction as unknown as Prediction };
}

/**
 * Save multiple predictions in a batch.
 */
export async function saveBatchPredictionsAction(
  predictions: Array<z.infer<typeof predictionSchema>>
): Promise<ActionResponse<{ saved: number; skipped: number }>> {
  const user = await requireAuth();

  let saved = 0;
  let skipped = 0;

  for (const pred of predictions) {
    const result = await savePredictionAction(pred);
    if (result.success) {
      saved++;
    } else {
      skipped++;
    }
  }

  revalidatePath("/fixture");
  return { success: true, data: { saved, skipped } };
}

/**
 * Get all predictions for the current user.
 */
export async function getUserPredictionsAction(): Promise<
  ActionResponse<Prediction[]>
> {
  const user = await requireAuth();

  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true },
      },
    },
    orderBy: { match: { kickoffAt: "asc" } },
  });

  return { success: true, data: predictions as unknown as Prediction[] };
}

/**
 * Save semifinalist picks (max 4 teams).
 */
export async function saveSemifinalistsAction(
  teamIds: string[]
): Promise<ActionResponse> {
  const user = await requireAuth();

  if (teamIds.length !== 4) {
    return { success: false, error: "You must pick exactly 4 semifinalists" };
  }

  if (new Set(teamIds).size !== 4) {
    return { success: false, error: "You cannot pick the same team twice" };
  }

  // Check if semi-final picks are still editable
  const semiMatches = await prisma.match.findMany({
    where: { phase: "SEMI_FINAL" },
    select: { kickoffAt: true },
    orderBy: { kickoffAt: "asc" },
  });

  if (semiMatches.length > 0 && new Date() >= semiMatches[0].kickoffAt) {
    return {
      success: false,
      error: "Semifinalist picks are locked — semis have already started",
    };
  }

  // Delete existing picks and recreate
  await prisma.semifinalistPick.deleteMany({ where: { userId: user.id } });

  await prisma.semifinalistPick.createMany({
    data: teamIds.map((teamId) => ({ userId: user.id, teamId })),
  });

  revalidatePath("/predictions");

  return { success: true, data: undefined };
}
