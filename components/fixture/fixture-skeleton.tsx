import { cn } from "@/lib/utils";

interface FixtureSkeletonProps {
  rows?: number;
}

function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4 animate-pulse">
      <div className="h-3 w-24 bg-muted rounded mb-4" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-3 w-12 bg-muted rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="h-4 w-4 rounded bg-muted self-center" />
          <div className="h-10 w-10 rounded-lg bg-muted" />
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-3 w-12 bg-muted rounded" />
        </div>
      </div>
      <div className="mt-3 h-10 w-full rounded-xl bg-muted" />
    </div>
  );
}

export function FixtureSkeleton({ rows = 2 }: FixtureSkeletonProps) {
  return (
    <div className="space-y-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          <div className="h-5 w-28 bg-muted rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}
