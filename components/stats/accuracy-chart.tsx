"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WeeklyHistory {
  weekNumber: number;
  points: number;
  exactScores: number;
}

interface RankHistory {
  rank: number;
  totalPoints: number;
  createdAt: Date;
}

interface AccuracyChartProps {
  weeklyHistory: WeeklyHistory[];
  rankHistory: RankHistory[];
}

export function AccuracyChart({ weeklyHistory, rankHistory }: AccuracyChartProps) {
  const weekData = weeklyHistory.map((w) => ({
    week: `W${w.weekNumber}`,
    points: w.points,
    exact: w.exactScores,
  }));

  const rankData = rankHistory.map((r, i) => ({
    match: i + 1,
    rank: r.rank,
    points: r.totalPoints,
  }));

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="text-base font-semibold mb-4">Evolution</h3>

      <Tabs defaultValue="weekly">
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">Weekly points</TabsTrigger>
          <TabsTrigger value="rank">Rank history</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="points" fill="#2563EB" radius={[4, 4, 0, 0]} name="Points" />
              <Bar dataKey="exact" fill="#22c55e" radius={[4, 4, 0, 0]} name="Exact" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-600 inline-block"/>Points</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-500 inline-block"/>Exact scores</span>
          </div>
        </TabsContent>

        <TabsContent value="rank">
          {rankData.length < 2 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              Rank history will appear after more matches are scored.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={rankData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="match" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} label={{ value: "Match", position: "insideBottom", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  reversed
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: 12,
                  }}
                  formatter={(v) => [`#${v}`, "Rank"]}
                />
                <Line
                  type="monotone"
                  dataKey="rank"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ fill: "#2563EB", r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Rank"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
