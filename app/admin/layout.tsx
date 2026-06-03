import { redirect } from "next/navigation"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { LayoutDashboard, Users, Settings, Megaphone, Calendar, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/matches", label: "Partidos", icon: Calendar },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/announcements", label: "Anuncios", icon: Megaphone },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin().catch(() => null)
  if (!user) redirect("/fixture")

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Link href="/fixture" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al Prode</span>
          </Link>
          <div className="flex-1" />
          <span className="text-sm font-semibold text-primary">Panel Admin</span>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r md:block">
          <nav className="sticky top-14 flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground"
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden xs:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 p-4 pb-20 sm:p-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
