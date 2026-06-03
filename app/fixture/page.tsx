import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { FixturePhaseSection } from "@/components/fixture/fixture-phase-section";
import { FixtureSkeleton } from "@/components/fixture/fixture-skeleton";
import { SemifinalistPicksCard } from "@/components/fixture/semifinalist-picks-card";
import type { MatchPhase } from "@/types";

const PHASE_ORDER: MatchPhase[] = [
  "GROUP",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
];

const PHASE_LABELS: Record<MatchPhase, string> = {
  GROUP: "Group Stage",
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINAL: "Quarter-finals",
  SEMI_FINAL: "Semi-finals",
  THIRD_PLACE: "Third place",
  FINAL: "Final",
};

export const dynamic = "force-dynamic";

export default async function FixturePage() {
  const user = await requireAuth();

  const [matches, userPredictions, semiPicks] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoffAt: "asc" },
    }),
    prisma.prediction.findMany({
      where: { userId: user.id },
    }),
    prisma.semifinalistPick.findMany({
      where: { userId: user.id },
      include: { team: true },
    }),
  ]);

  // Group matches by phase
  const byPhase = PHASE_ORDER.reduce(
    (acc, phase) => {
      const phaseMatches = matches.filter((m) => m.phase === phase);
      if (phaseMatches.length > 0) acc[phase] = phaseMatches;
      return acc;
    },
    {} as Record<MatchPhase, typeof matches>
  );

  // Build prediction map for quick lookup
  const predMap = Object.fromEntries(
    userPredictions.map((p) => [p.matchId, p])
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fixture</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Predict match results before kickoff to earn points.
        </p>
      </div>

      {/* Semifinalist picks */}
      <Suspense fallback={<FixtureSkeleton rows={1} />}>
        <SemifinalistPicksCard
          currentPicks={semiPicks}
          allTeams={await prisma.team.findMany({ orderBy: { name: "asc" } })}
        />
      </Suspense>

      {/* Matches by phase */}
      {Object.entries(byPhase).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">⚽</div>
          <h3 className="text-lg font-semibold">No matches yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Fixtures will appear here once the draw is complete.
          </p>
        </div>
      ) : (
        <Suspense fallback={<FixtureSkeleton rows={3} />}>
          {(Object.entries(byPhase) as [MatchPhase, typeof matches][]).map(
            ([phase, phaseMatches]) => (
              <FixturePhaseSection
                key={phase}
                phase={phase}
                label={PHASE_LABELS[phase]}
                matches={phaseMatches}
                predictionMap={predMap}
              />
            )
          )}
        </Suspense>
      )}
    </div>
  );
}
