import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BadgeInfo {
  badge: {
    name: string;
    description: string;
    icon: string;
  };
  createdAt: Date;
}

interface BadgesGridProps {
  badges: BadgeInfo[];
}

const ALL_BADGES = [
  { name: "first_blood", icon: "⚡", description: "First exact score" },
  { name: "sharp_shooter", icon: "🎯", description: "5 exact scores" },
  { name: "hot_streak", icon: "🔥", description: "5-match streak" },
  { name: "legendary_streak", icon: "⭐", description: "10-match streak" },
  { name: "century_club", icon: "💯", description: "100 total points" },
  { name: "top_predictor", icon: "🏅", description: "50+ pts and 10+ exact" },
];

export function BadgesGrid({ badges }: BadgesGridProps) {
  const earnedNames = new Set(badges.map((b) => b.badge.name));
  const earnedMap = Object.fromEntries(badges.map((b) => [b.badge.name, b]));

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="text-base font-semibold mb-4">Badges</h3>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {ALL_BADGES.map((badge) => {
          const isEarned = earnedNames.has(badge.name);
          const earned = earnedMap[badge.name];

          return (
            <div
              key={badge.name}
              title={isEarned ? `Earned ${format(new Date(earned.createdAt), "MMM d")}` : badge.description}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all",
                isEarned
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : "border-border bg-muted/30 opacity-40 grayscale"
              )}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-xs font-medium leading-tight">{badge.description}</span>
              {isEarned && (
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(earned.createdAt), "MMM d")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
