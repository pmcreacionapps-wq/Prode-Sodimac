"use client"

import { useState, useTransition } from "react"
import { adminCreateAnnouncementAction } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Megaphone, Send, CheckCircle, XCircle } from "lucide-react"

export default function AdminAnnouncementsPage() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await adminCreateAnnouncementAction({ title, body, pinned: false })
      setResult({
        success: res.success,
        message: res.success
          ? "Anuncio publicado y notificaciones enviadas"
          : (res.error ?? "Error"),
      })
      if (res.success) {
        setTitle("")
        setBody("")
        setTimeout(() => setResult(null), 4000)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Anuncios</h1>
        <p className="text-sm text-muted-foreground">Publicar un anuncio notifica a todos los usuarios</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Nuevo anuncio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej: ¡Comienza la fase de grupos!"
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Contenido</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribí el mensaje del anuncio..."
                rows={4}
                maxLength={500}
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending} className="gap-2">
                <Send className="h-4 w-4" />
                {isPending ? "Publicando..." : "Publicar anuncio"}
              </Button>
              {result && (
                <div className={`flex items-center gap-2 text-sm ${result.success ? "text-green-400" : "text-red-400"}`}>
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {result.message}
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          El historial de anuncios se muestra en la página de inicio del prode.
        </CardContent>
      </Card>
    </div>
  )
}
