import { Trophy, Target, Zap, TrendingUp, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  totalPoints: number;
  exactScores: number;
  correctWinner: number;
  streak: number;
  maxStreak: number;
  accuracy: number;
  globalRank: number;
  totalPredictions: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, sublabel, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
  );
}

export function StatsOverview({
  totalPoints,
  exactScores,
  correctWinner,
  streak,
  maxStreak,
  accuracy,
  globalRank,
  totalPredictions,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard
        label="Total points"
        value={totalPoints}
        icon={Trophy}
        color="text-yellow-500"
        bgColor="bg-yellow-500/10"
      />
      <StatCard
        label="Global rank"
        value={globalRank > 0 ? `#${globalRank}` : "—"}
        sublabel={totalPredictions > 0 ? `of ${totalPredictions} players` : undefined}
        icon={TrendingUp}
        color="text-blue-500"
        bgColor="bg-blue-500/10"
      />
      <StatCard
        label="Accuracy"
        value={`${accuracy}%`}
        sublabel={`${totalPredictions} predictions`}
        icon={Target}
        color="text-green-500"
        bgColor="bg-green-500/10"
      />
      <StatCard
        label="Exact scores"
        value={exactScores}
        sublabel="+3 pts each"
        icon={Star}
        color="text-purple-500"
        bgColor="bg-purple-500/10"
      />
      <StatCard
        label="Current streak"
        value={streak}
        sublabel={`Best: ${maxStreak}`}
        icon={Flame}
        color="text-orange-500"
        bgColor="bg-orange-500/10"
      />
      <StatCard
        label="Correct winners"
        value={correctWinner}
        sublabel="+1 pt each"
        icon={Zap}
        color="text-cyan-500"
        bgColor="bg-cyan-500/10"
      />
    </div>
  );
}
