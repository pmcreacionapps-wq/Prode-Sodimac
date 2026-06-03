import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/types";

/**
 * Get the current authenticated user's full profile from DB.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  return dbUser as UserProfile | null;
}

/**
 * Require authentication — redirect to login if not authenticated.
 */
export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.isBlocked) redirect("/blocked");
  return user;
}

/**
 * Require admin role.
 */
export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireAuth();
  if (!user.isAdmin) redirect("/");
  return user;
}

/**
 * Check if a nickname is available.
 */
export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { nickname: nickname.toLowerCase() },
  });
  return !existing;
}

/**
 * Get the current week number based on tournament start date.
 * FIFA 2026 starts June 11, 2026.
 */
export function getCurrentWeek(): number {
  const tournamentStart = new Date("2026-06-11T00:00:00Z");
  const now = new Date();
  const diffMs = now.getTime() - tournamentStart.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, diffWeeks + 1);
}
