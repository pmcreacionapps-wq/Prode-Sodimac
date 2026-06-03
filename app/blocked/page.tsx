import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/actions/auth"

export default function BlockedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950 border border-red-500/30">
          <ShieldAlert className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cuenta bloqueada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cuenta ha sido bloqueada. Si creés que es un error, contactá al administrador.
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  )
}
