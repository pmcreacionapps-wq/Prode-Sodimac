import type { MatchPhase, MatchStatus, NotificationType } from "@prisma/client";

// ─────────────────────────────────────────
// RE-EXPORTS from Prisma
// ─────────────────────────────────────────
export type { MatchPhase, MatchStatus, NotificationType };

// ─────────────────────────────────────────
// USER
// ─────────────────────────────────────────
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  curso?: string | null;
  avatarUrl?: string | null;
  isAdmin: boolean;
  isBlocked: boolean;
  totalPoints: number;
  exactScores: number;
  correctWinner: number;
  streak: number;
  maxStreak: number;
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  nickname: string;
  avatarUrl?: string | null;
  totalPoints: number;
  streak: number;
}

// ─────────────────────────────────────────
// TEAM
// ─────────────────────────────────────────
export interface Team {
  id: string;
  name: string;
  shortName: string;
  flagUrl: string;
  group?: string | null;
  apiId?: number | null;
}

// ─────────────────────────────────────────
// MATCH
// ─────────────────────────────────────────
export interface Match {
  id: string;
  apiId?: number | null;
  homeTeam: Team;
  awayTeam: Team;
  kickoffAt: Date;
  venue?: string | null;
  city?: string | null;
  phase: MatchPhase;
  groupName?: string | null;
  matchDay?: number | null;
  roundName?: string | null;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  winnerId?: string | null;
  penaltyScore?: string | null;
  predictionsLocked: boolean;
}

export interface MatchWithPrediction extends Match {
  userPrediction?: PredictionResult | null;
}

// ─────────────────────────────────────────
// PREDICTION
// ─────────────────────────────────────────
export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  pointsEarned?: number | null;
  isExactScore?: boolean | null;
  isCorrectWinner?: boolean | null;
  weekNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PredictionResult extends Prediction {
  match: Match;
}

export interface PredictionInput {
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
}

// ─────────────────────────────────────────
// RANKING
// ─────────────────────────────────────────
export interface RankingEntry {
  rank: number;
  user: PublicUser;
  totalPoints: number;
  exactScores: number;
  correctWinner: number;
  streak: number;
  weeklyDelta?: number; // points gained this week
  badges: BadgeInfo[];
}

export interface WeeklyRankingEntry {
  rank: number;
  user: PublicUser;
  weekPoints: number;
  exactScores: number;
  weekNumber: number;
}

// ─────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────
export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

// ─────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

// ─────────────────────────────────────────
// SEMIFINALISTS
// ─────────────────────────────────────────
export interface SemifinalistPick {
  id: string;
  teamId: string;
  team: Team;
  isCorrect?: boolean | null;
  bonusPoints: number;
}

// ─────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────
export interface AdminSettings {
  pointsExactScore: number;
  pointsCorrectWinner: number;
  pointsSemifinalist: number;
  tournamentActive: boolean;
  predictionsOpen: boolean;
  currentWeek: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
  pinned: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
}

// ─────────────────────────────────────────
// STATS (for My Performance page)
// ─────────────────────────────────────────
export interface UserStats {
  totalPredictions: number;
  exactScores: number;
  correctWinner: number;
  totalPoints: number;
  accuracy: number; // percentage
  streak: number;
  maxStreak: number;
  rank: number;
  weeklyHistory: WeeklyStatEntry[];
  rankHistory: RankHistoryEntry[];
  badges: BadgeInfo[];
  semifinalistPicks: SemifinalistPick[];
}

export interface WeeklyStatEntry {
  weekNumber: number;
  points: number;
  exactScores: number;
}

export interface RankHistoryEntry {
  matchId: string;
  rank: number;
  totalPoints: number;
  createdAt: Date;
}

// ─────────────────────────────────────────
// API FOOTBALL (external)
// ─────────────────────────────────────────
export interface APIFootballMatch {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
    venue: { name: string; city: string } | null;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  league: {
    round: string;
  };
}

// ─────────────────────────────────────────
// SERVER ACTION RESPONSES
// ─────────────────────────────────────────
export type ActionResponse<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// ─────────────────────────────────────────
// GROUP STAGE
// ─────────────────────────────────────────
export interface GroupStanding {
  group: string;
  teams: GroupTeamRow[];
}

export interface GroupTeamRow {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}
