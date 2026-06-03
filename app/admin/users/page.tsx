import { adminGetUsersAction, adminToggleBlockUserAction } from "@/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Shield, ShieldOff, Users } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const users = await adminGetUsersAction()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{users.length} usuarios registrados</p>
        </div>
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((user) => {
              async function toggleBlock() {
                "use server"
                await adminToggleBlockUserAction(user.id, !user.isBlocked)
              }

              return (
                <div key={user.id} className="flex items-center gap-4 px-4 py-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {user.firstName} {user.lastName}
                      </span>
                      {user.isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                      {user.isBlocked && <Badge variant="destructive" className="text-xs">Bloqueado</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>@{user.nickname}</span>
                      <span>{user.totalPoints ?? 0} pts</span>
                      <span className="hidden sm:inline">
                        {format(new Date(user.createdAt), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>

                  {!user.isAdmin && (
                    <form action={toggleBlock}>
                      <Button
                        type="submit"
                        variant={user.isBlocked ? "outline" : "destructive"}
                        size="sm"
                        className="gap-1.5 text-xs"
                      >
                        {user.isBlocked
                          ? <><Shield className="h-3 w-3" /> Desbloquear</>
                          : <><ShieldOff className="h-3 w-3" /> Bloquear</>
                        }
                      </Button>
                    </form>
                  )}
                </div>
              )
            })}

            {users.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No hay usuarios registrados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
