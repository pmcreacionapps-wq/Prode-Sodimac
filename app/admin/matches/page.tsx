import { prisma } from "@/lib/prisma"
import { MatchStatus, MatchPhase } from "@prisma/client"
import { adminSyncFixturesAction, adminSyncLiveAction } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, RefreshCw, Activity, Lock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: "Programado",
  LIVE: "En vivo",
  FINISHED: "Finalizado",
  POSTPONED: "Postergado",
  CANCELLED: "Cancelado",
}

const PHASE_LABELS: Record<MatchPhase, string> = {
  GROUP: "Fase de Grupos",
  ROUND_OF_32: "Ronda de 32",
  ROUND_OF_16: "Octavos",
  QUARTER_FINAL: "Cuartos",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "3er y 4to Puesto",
  FINAL: "Final",
}

// Wrappers que devuelven void para usar como form actions
async function syncLive() {
  "use server"
  await adminSyncLiveAction()
}

async function syncFixtures() {
  "use server"
  await adminSyncFixturesAction()
}

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoffAt: "asc" },
  })

  const byPhase = matches.reduce<Record<string, typeof matches>>((acc, m) => {
    const key = m.phase
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partidos</h1>
          <p className="text-sm text-muted-foreground">{matches.length} partidos en total</p>
        </div>
        <div className="flex gap-2">
          <form action={syncLive}>
            <Button type="submit" variant="outline" size="sm" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Sync live
            </Button>
          </form>
          <form action={syncFixtures}>
            <Button type="submit" variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Sync fixture
            </Button>
          </form>
        </div>
      </div>

      {Object.entries(byPhase).map(([phase, phaseMatches]) => (
        <div key={phase}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {PHASE_LABELS[phase as MatchPhase] ?? phase}
          </h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {phaseMatches.map((match) => (
                <div key={match.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <div className="w-28 shrink-0 text-xs text-muted-foreground">
                    {format(match.kickoffAt, "dd/MM HH:mm", { locale: es })}
                  </div>
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <span className="truncate text-right flex-1">{match.homeTeam.name}</span>
                    <span className="shrink-0 font-bold tabular-nums">
                      {match.status === MatchStatus.SCHEDULED
                        ? "vs"
                        : `${match.homeScore ?? 0}-${match.awayScore ?? 0}`}
                    </span>
                    <span className="truncate flex-1">{match.awayTeam.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {match.predictionsLocked && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABELS[match.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      {matches.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No hay partidos cargados. Sincronizá el fixture primero.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
