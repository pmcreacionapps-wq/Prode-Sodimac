import Image from "next/image";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PredictionHistoryItem {
  id: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  pointsEarned?: number | null;
  isExactScore?: boolean | null;
  isCorrectWinner?: boolean | null;
  match: {
    kickoffAt: Date;
    homeScore?: number | null;
    awayScore?: number | null;
    homeTeam: { name: string; shortName: string; flagUrl: string };
    awayTeam: { name: string; shortName: string; flagUrl: string };
  };
}

interface PredictionHistoryProps {
  predictions: PredictionHistoryItem[];
}

export function PredictionHistory({ predictions }: PredictionHistoryProps) {
  if (predictions.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50">
        <h3 className="text-base font-semibold">Recent predictions</h3>
      </div>

      <div className="divide-y divide-border/50">
        {predictions.map((pred) => {
          const { match } = pred;
          const hasResult = pred.pointsEarned !== null;

          return (
            <div key={pred.id} className="flex items-center gap-3 px-5 py-3">
              {/* Result indicator */}
              <div className="flex-shrink-0">
                {!hasResult ? (
                  <div className="h-8 w-8 rounded-full bg-muted" />
                ) : pred.isExactScore ? (
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Star className="h-4 w-4 text-green-500" />
                  </div>
                ) : pred.isCorrectWinner ? (
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Teams */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative h-5 w-5 flex-shrink-0">
                  <Image src={match.homeTeam.flagUrl} alt={match.homeTeam.name} fill className="object-contain" sizes="20px" />
                </div>
                <span className="text-xs text-muted-foreground">vs</span>
                <div className="relative h-5 w-5 flex-shrink-0">
                  <Image src={match.awayTeam.flagUrl} alt={match.awayTeam.name} fill className="object-contain" sizes="20px" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(match.kickoffAt), "MMM d")} ·
                    {hasResult
                      ? ` Result: ${match.homeScore}–${match.awayScore}`
                      : " Pending"}
                  </p>
                </div>
              </div>

              {/* Prediction */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium tabular-nums">
                  {pred.predictedHomeScore}–{pred.predictedAwayScore}
                </p>
                {hasResult && (
                  <p className={cn(
                    "text-xs font-semibold",
                    (pred.pointsEarned ?? 0) > 0 ? "text-green-500" : "text-muted-foreground"
                  )}>
                    +{pred.pointsEarned} pts
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
