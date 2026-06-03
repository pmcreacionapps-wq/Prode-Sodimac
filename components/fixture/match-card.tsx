"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { Lock, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { savePredictionAction } from "@/actions/predictions";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/types";

interface PredictionData {
  predictedHomeScore: number;
  predictedAwayScore: number;
  pointsEarned?: number | null;
  isExactScore?: boolean | null;
  isCorrectWinner?: boolean | null;
}

interface MatchCardProps {
  match: Match;
  prediction?: PredictionData | null;
}

export function MatchCard({ match, prediction }: MatchCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [homeScore, setHomeScore] = useState<string>(
    prediction?.predictedHomeScore?.toString() ?? ""
  );
  const [awayScore, setAwayScore] = useState<string>(
    prediction?.predictedAwayScore?.toString() ?? ""
  );

  const isLocked =
    match.predictionsLocked ||
    match.status !== "SCHEDULED" ||
    new Date() >= match.kickoffAt;

  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "LIVE";

  const handleSubmit = () => {
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);

    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast({ title: "Enter valid scores (0 or higher)", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await savePredictionAction({
        matchId: match.id,
        predictedHomeScore: h,
        predictedAwayScore: a,
      });

      if (result.success) {
        toast({ title: "Prediction saved ✓" });
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card transition-all duration-200",
        isLive && "border-green-500/50 shadow-green-500/10 shadow-lg",
        isFinished && "bg-card/60",
        !isLocked && !isFinished && "hover:border-border"
      )}
    >
      {/* Status badge */}
      <div className="absolute top-3 right-3">
        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </span>
        )}
        {isLocked && !isLive && !isFinished && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Locked
          </span>
        )}
        {!isLocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-500">
            <Clock className="h-3 w-3" />
            Open
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Match info */}
        <div className="mb-1 text-xs text-muted-foreground">
          {format(new Date(match.kickoffAt), "EEE, MMM d · HH:mm")}
          {match.city && ` · ${match.city}`}
        </div>

        {/* Teams row */}
        <div className="flex items-center justify-between gap-4 my-4">
          {/* Home team */}
          <div className="flex flex-1 flex-col items-center gap-2 min-w-0">
            <div className="relative h-12 w-12 flex-shrink-0">
              <Image
                src={match.homeTeam.flagUrl}
                alt={match.homeTeam.name}
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
            <span className="text-sm font-medium text-center truncate max-w-full">
              {match.homeTeam.shortName}
            </span>
          </div>

          {/* Score / input */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isFinished ? (
              // Show actual result
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold tabular-nums">
                  {match.homeScore}
                </span>
                <span className="text-muted-foreground">—</span>
                <span className="text-2xl font-bold tabular-nums">
                  {match.awayScore}
                </span>
              </div>
            ) : isLocked ? (
              // Locked — show user's prediction or placeholder
              <div className="flex items-center gap-1.5">
                {prediction ? (
                  <>
                    <span className="text-xl font-bold tabular-nums text-muted-foreground">
                      {prediction.predictedHomeScore}
                    </span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-xl font-bold tabular-nums text-muted-foreground">
                      {prediction.predictedAwayScore}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No prediction
                  </span>
                )}
              </div>
            ) : (
              // Open prediction inputs
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-12 rounded-lg border border-border bg-background text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <span className="text-muted-foreground font-medium">—</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-12 rounded-lg border border-border bg-background text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-1 flex-col items-center gap-2 min-w-0">
            <div className="relative h-12 w-12 flex-shrink-0">
              <Image
                src={match.awayTeam.flagUrl}
                alt={match.awayTeam.name}
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
            <span className="text-sm font-medium text-center truncate max-w-full">
              {match.awayTeam.shortName}
            </span>
          </div>
        </div>

        {/* Prediction result (after match) */}
        {isFinished && prediction && prediction.pointsEarned !== null && (
          <div
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
              prediction.isExactScore
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : prediction.isCorrectWinner
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              {prediction.isExactScore ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Exact score!</span>
                </>
              ) : prediction.isCorrectWinner ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Correct winner</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>
                    You predicted {prediction.predictedHomeScore}–
                    {prediction.predictedAwayScore}
                  </span>
                </>
              )}
            </div>
            <span className="font-semibold">
              +{prediction.pointsEarned} pts
            </span>
          </div>
        )}

        {/* Save button */}
        {!isLocked && (
          <button
            onClick={handleSubmit}
            disabled={isPending || homeScore === "" || awayScore === ""}
            className={cn(
              "mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition-all",
              homeScore !== "" && awayScore !== ""
                ? "bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-not-allowed",
              isPending && "opacity-70 cursor-wait"
            )}
          >
            {isPending ? "Saving..." : prediction ? "Update prediction" : "Save prediction"}
          </button>
        )}

        {/* Closing soon warning */}
        {!isLocked && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Closes {formatDistanceToNow(new Date(match.kickoffAt), { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );
}
