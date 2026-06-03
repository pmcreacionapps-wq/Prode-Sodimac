import Image from "next/image";
import { cn } from "@/lib/utils";

interface SemifinalistStatusProps {
  picks: Array<{
    team: {
      name: string;
      shortName: string;
      flagUrl: string;
    };
    isCorrect?: boolean | null;
    bonusPoints: number;
  }>;
}

export function SemifinalistStatus({ picks }: SemifinalistStatusProps) {
  const totalBonus = picks.reduce((acc, p) => acc + p.bonusPoints, 0);
  const hasResults = picks.some((p) => p.isCorrect !== null);

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Semifinalist picks</h3>
        {hasResults && totalBonus > 0 && (
          <span className="text-sm font-semibold text-yellow-500">
            +{totalBonus} bonus pts
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {picks.map((pick) => (
          <div
            key={pick.team.name}
            className={cn(
              "flex items-center gap-2 rounded-xl border p-2.5",
              pick.isCorrect === true && "border-green-500/40 bg-green-500/5",
              pick.isCorrect === false && "border-red-500/30 bg-red-500/5",
              pick.isCorrect === null && "border-border"
            )}
          >
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image
                src={pick.team.flagUrl}
                alt={pick.team.name}
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{pick.team.shortName}</p>
              {pick.isCorrect === true && (
                <p className="text-[10px] text-green-500 font-semibold">+{pick.bonusPoints} pts</p>
              )}
              {pick.isCorrect === false && (
                <p className="text-[10px] text-muted-foreground">Missed</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
