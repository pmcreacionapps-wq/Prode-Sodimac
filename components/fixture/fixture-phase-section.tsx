"use client";

import { useState } from "react";
import { MatchCard } from "./match-card";
import type { MatchPhase } from "@/types";

interface FixturePhaseSectionProps {
  phase: MatchPhase;
  label: string;
  matches: any[];
  predictionMap: Record<string, any>;
  defaultOpen?: boolean;
}

export function FixturePhaseSection({
  phase,
  label,
  matches,
  predictionMap,
  defaultOpen = true,
}: FixturePhaseSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const header = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="flex w-full items-center justify-between gap-2 py-1 text-left"
    >
      <h2 className="text-lg font-semibold">{label}</h2>
      <svg
        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  if (phase === "GROUP") {
    const byGroup: Record<string, typeof matches> = {};
    for (const m of matches) {
      const g = m.groupName ?? "?";
      byGroup[g] = byGroup[g] ?? [];
      byGroup[g].push(m);
    }

    return (
      <section>
        {header}
        {isOpen && (
          <div className="mt-4 space-y-6">
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
        )}
      </section>
    );
  }

  return (
    <section>
      {header}
      {isOpen && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictionMap[match.id] ?? null}
            />
          ))}
        </div>
      )}
    </section>
  );
}
