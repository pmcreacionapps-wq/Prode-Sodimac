import { prisma } from "@/lib/prisma"
import { MatchStatus } from "@prisma/client"
import { adminSyncLiveAction, adminSyncFixturesAction, adminRecalculateScoresAction } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, RefreshCw, Trophy, Activity, Zap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export const dynamic = "force-dynamic"

// void wrappers
async function syncLive() { "use server"; await adminSyncLiveAction() }
async function syncFixtures() { "use server"; await adminSyncFixturesAction() }
async function recalculate() { "use server"; await adminRecalculateScoresAction() }

async function getStats() {
  const [userCount, matchCount, predCount, liveMatches, recentPreds] = await Promise.all([
    prisma.user.count({ where: { isBlocked: false } }),
    prisma.match.count(),
    prisma.prediction.count(),
    prisma.match.findMany({ where: { status: MatchStatus.LIVE }, include: { homeTeam: true, awayTeam: true } }),
    prisma.prediction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true, match: { include: { homeTeam: true, awayTeam: true } } },
    }),
  ])
  return { userCount, matchCount, predCount, liveMatches, recentPreds }
}

export default async function AdminPage() {
  const { userCount, matchCount, predCount, liveMatches, recentPreds } = await getStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">World Cup 2026 — Panel de Control</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Usuarios activos", value: userCount, icon: Users, color: "text-blue-400" },
          { label: "Partidos", value: matchCount, icon: Calendar, color: "text-green-400" },
          { label: "Predicciones", value: predCount, icon: Trophy, color: "text-yellow-400" },
          { label: "En vivo ahora", value: liveMatches.length, icon: Activity, color: "text-red-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {liveMatches.length > 0 && (
        <Card className="border-red-500/30 bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Activity className="h-4 w-4 animate-pulse" />
              Partidos en vivo ({liveMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {liveMatches.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-sm">
                <span>{m.homeTeam.name}</span>
                <span className="font-bold text-red-400">{m.homeScore ?? 0} - {m.awayScore ?? 0}</span>
                <span>{m.awayTeam.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Acciones rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <form action={syncLive}>
            <Button type="submit" variant="outline" size="sm" className="gap-2">
              <Activity className="h-4 w-4" />Sync en vivo
            </Button>
          </form>
          <form action={syncFixtures}>
            <Button type="submit" variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />Sync fixture
            </Button>
          </form>
          <form action={recalculate}>
            <Button type="submit" variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />Recalcular puntajes
            </Button>
          </form>
        </CardContent>
      </Card>

      {recentPreds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Últimas predicciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPreds.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">@{p.user.nickname}</span>
                <span className="text-muted-foreground">
                  {p.match.homeTeam.name} {p.predictedHomeScore}-{p.predictedAwayScore} {p.match.awayTeam.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(p.createdAt, { addSuffix: true })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
