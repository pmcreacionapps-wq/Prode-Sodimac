"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  avatarUrl?: string | null;
  totalPoints: number;
  exactScores: number;
  streak: number;
  isCurrentUser: boolean;
  badges: Array<{
    badge: { icon: string; name: string };
  }>;
}

interface GlobalLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

const MEDAL_COLORS = ["text-yellow-400", "text-slate-400", "text-amber-600"];
const MEDAL_BG = ["bg-yellow-400/10", "bg-slate-400/10", "bg-amber-600/10"];

export function GlobalLeaderboard({ entries, currentUserId }: GlobalLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-lg font-semibold">No predictions yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Rankings will appear once matches are scored.
        </p>
      </div>
    );
  }

  // Top 3 podium + full list
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-4">
      {/* Podium for top 3 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {top3.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: entry.rank * 0.1 }}
            className={cn(
              "flex flex-col items-center rounded-2xl border p-4 text-center",
              entry.rank === 1 && "border-yellow-400/30 bg-yellow-400/5",
              entry.rank === 2 && "border-slate-400/30 bg-slate-400/5",
              entry.rank === 3 && "border-amber-600/30 bg-amber-600/5",
              entry.isCurrentUser && "ring-2 ring-blue-500"
            )}
          >
            <span className={cn("text-2xl font-bold", MEDAL_COLORS[entry.rank - 1])}>
              {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
            </span>
            <Avatar className="mt-2 h-10 w-10">
              <AvatarImage src={entry.avatarUrl ?? undefined} />
              <AvatarFallback className={cn("text-xs font-semibold", MEDAL_BG[entry.rank - 1], MEDAL_COLORS[entry.rank - 1])}>
                {entry.nickname.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="mt-2 text-sm font-semibold truncate w-full">
              @{entry.nickname}
            </p>
            <p className="text-lg font-bold tabular-nums">
              {entry.totalPoints}
              <span className="text-xs text-muted-foreground font-normal ml-1">pts</span>
            </p>
            {entry.streak >= 3 && (
              <div className="flex items-center gap-1 mt-1">
                <Flame className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-500 font-medium">{entry.streak}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Full list */}
      <div className="rounded-2xl border overflow-hidden">
        {rest.map((entry, idx) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (idx + 3) * 0.03 }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors",
              entry.isCurrentUser && "bg-blue-500/5 border-blue-500/20"
            )}
          >
            <span className="w-8 text-center text-sm font-medium text-muted-foreground tabular-nums">
              {entry.rank}
            </span>

            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={entry.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {entry.nickname.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn("text-sm font-medium truncate", entry.isCurrentUser && "text-blue-600 dark:text-blue-400")}>
                  @{entry.nickname}
                  {entry.isCurrentUser && " (you)"}
                </p>
                {entry.badges.slice(0, 2).map((b, i) => (
                  <span key={i} className="text-xs" title={b.badge.name}>
                    {b.badge.icon}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.exactScores} exact
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold tabular-nums">{entry.totalPoints}</p>
              {entry.streak >= 3 && (
                <div className="flex items-center justify-end gap-0.5">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-500">{entry.streak}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
