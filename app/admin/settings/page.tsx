import { prisma } from "@/lib/prisma"
import { adminUpdateSettingsAction, adminExportRankingsAction, adminResetTournamentAction } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Settings, Download, AlertTriangle, RefreshCw } from "lucide-react"

export const dynamic = "force-dynamic"

async function exportRankings() { "use server"; await adminExportRankingsAction() }
async function resetTournament() { "use server"; await adminResetTournamentAction() }

async function updateSettings(formData: FormData) {
  "use server"
  await adminUpdateSettingsAction({
    predictionsOpen: formData.get("predictionsOpen") === "on",
    pointsExactScore: Number(formData.get("pointsExactScore") ?? 3),
    pointsCorrectWinner: Number(formData.get("pointsCorrectWinner") ?? 1),
    pointsSemifinalist: Number(formData.get("pointsSemifinalist") ?? 2),
  })
}

export default async function AdminSettingsPage() {
  const settings = await prisma.adminSettings.findUnique({ where: { id: "singleton" } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajustes globales del torneo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Parámetros del torneo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSettings} className="space-y-5">
            {/* Toggle predicciones */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="predictionsOpen" className="font-medium">Predicciones abiertas</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Permitir que los usuarios guarden predicciones</p>
              </div>
              <Switch
                id="predictionsOpen"
                name="predictionsOpen"
                defaultChecked={settings?.predictionsOpen ?? true}
              />
            </div>

            {/* Puntajes */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Puntajes</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pointsExactScore" className="text-xs">Score exacto</Label>
                  <Input
                    id="pointsExactScore"
                    name="pointsExactScore"
                    type="number"
                    min={0}
                    defaultValue={settings?.pointsExactScore ?? 3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pointsCorrectWinner" className="text-xs">Ganador correcto</Label>
                  <Input
                    id="pointsCorrectWinner"
                    name="pointsCorrectWinner"
                    type="number"
                    min={0}
                    defaultValue={settings?.pointsCorrectWinner ?? 1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pointsSemifinalist" className="text-xs">Semifinalista</Label>
                  <Input
                    id="pointsSemifinalist"
                    name="pointsSemifinalist"
                    type="number"
                    min={0}
                    defaultValue={settings?.pointsSemifinalist ?? 2}
                  />
                </div>
              </div>
            </div>

            <Button type="submit">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Exportar datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={exportRankings}>
            <Button type="submit" variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Descargar ranking CSV
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Zona peligrosa
          </CardTitle>
          <CardDescription>Estas acciones son irreversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={resetTournament}>
            <Button type="submit" variant="destructive" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Resetear torneo completo
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
