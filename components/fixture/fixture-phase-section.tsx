import { MatchCard } from "./match-card";
import type { MatchPhase } from "@/types";

interface FixturePhaseSectionProps {
  phase: MatchPhase;
  label: string;
  matches: any[];
  predictionMap: Record<string, any>;
}

export function FixturePhaseSection({
  phase,
  label,
  matches,
  predictionMap,
}: FixturePhaseSectionProps) {
  // Group by group name for GROUP phase
  if (phase === "GROUP") {
    const byGroup: Record<string, typeof matches> = {};
    for (const m of matches) {
      const g = m.groupName ?? "?";
      byGroup[g] = byGroup[g] ?? [];
      byGroup[g].push(m);
    }

    return (
      <section>
        <h2 className="text-lg font-semibold mb-4">{label}</h2>
        <div className="space-y-6">
          {Object.entries(byGroup)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, groupMatches]) => (
              <div key={group}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Group {group}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {groupMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predictionMap[match.id] ?? null}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{label}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predictionMap[match.id] ?? null}
          />
        ))}
      </div>
    </section>
  );
}
