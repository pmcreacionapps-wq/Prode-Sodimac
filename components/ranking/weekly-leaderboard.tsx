"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WeeklyEntry {
  rank: number;
  user: {
    id: string;
    nickname: string;
    avatarUrl?: string | null;
    streak: number;
  };
  points: number;
  exactScores: number;
  isCurrentUser: boolean;
}

interface WeeklyLeaderboardProps {
  entries: WeeklyEntry[];
  currentUserId: string;
  weekNumber: number;
}

export function WeeklyLeaderboard({
  entries,
  currentUserId,
  weekNumber,
}: WeeklyLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">📅</div>
        <h3 className="text-lg font-semibold">No data for week {weekNumber}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly rankings update as matches are scored.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-muted/30">
        <span className="w-8 text-center text-xs font-medium text-muted-foreground">#</span>
        <span className="flex-1 text-xs font-medium text-muted-foreground">Player</span>
        <span className="text-xs font-medium text-muted-foreground">Exact</span>
        <span className="w-16 text-right text-xs font-medium text-muted-foreground">Pts</span>
      </div>

      {entries.map((entry, idx) => (
        <motion.div
          key={entry.user.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.03 }}
          className={cn(
            "flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0",
            entry.isCurrentUser && "bg-blue-500/5"
          )}
        >
          <span className="w-8 text-center text-sm font-medium text-muted-foreground tabular-nums">
            {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
          </span>

          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={entry.user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs bg-muted">
              {entry.user.nickname.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <p className={cn("flex-1 text-sm font-medium truncate", entry.isCurrentUser && "text-blue-600 dark:text-blue-400")}>
            @{entry.user.nickname}
            {entry.isCurrentUser && " (you)"}
          </p>

          <span className="text-sm text-muted-foreground tabular-nums w-8 text-center">
            {entry.exactScores}
          </span>

          <span className="w-16 text-right text-sm font-bold tabular-nums">
            {entry.points}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
