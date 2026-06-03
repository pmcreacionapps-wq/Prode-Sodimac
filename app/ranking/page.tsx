import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { GlobalLeaderboard } from "@/components/ranking/global-leaderboard";
import { WeeklyLeaderboard } from "@/components/ranking/weekly-leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const revalidate = 30; // ISR — revalidate every 30 seconds

export default async function RankingPage() {
  const user = await requireAuth();

  const settings = await prisma.adminSettings.findUnique({
    where: { id: "singleton" },
  });

  const currentWeek = settings?.currentWeek ?? 1;

  const [globalRanking, weeklyRanking, userBadges] = await Promise.all([
    // Global ranking
    prisma.user.findMany({
      where: { isBlocked: false },
      orderBy: [{ totalPoints: "desc" }, { exactScores: "desc" }],
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        totalPoints: true,
        exactScores: true,
        correctWinner: true,
        streak: true,
        badges: {
          include: { badge: true },
          take: 3,
        },
      },
      take: 100,
    }),
    // Weekly ranking
    prisma.weeklyScore.findMany({
      where: { weekNumber: currentWeek },
      orderBy: [{ points: "desc" }, { exactScores: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            streak: true,
          },
        },
      },
      take: 100,
    }),
    // Current user's badges for context
    prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
    }),
  ]);

  // Add rank position and weekly delta
  const rankedGlobal = globalRanking.map((u, idx) => ({
    rank: idx + 1,
    ...u,
    isCurrentUser: u.id === user.id,
  }));

  const rankedWeekly = weeklyRanking.map((w, idx) => ({
    ...w,
    rank: idx + 1,
    isCurrentUser: w.user.id === user.id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rankings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Week {currentWeek} — Updated every 30 seconds
        </p>
      </div>

      <Tabs defaultValue="global">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="global" className="flex-1 sm:flex-none">
            🌍 Global
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1 sm:flex-none">
            📅 Week {currentWeek}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <GlobalLeaderboard
            entries={rankedGlobal}
            currentUserId={user.id}
          />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <WeeklyLeaderboard
            entries={rankedWeekly}
            currentUserId={user.id}
            weekNumber={currentWeek}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
