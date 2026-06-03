"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, CalendarDays, BarChart2, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import type { UserProfile } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MainNavProps {
  user: UserProfile;
}

const navItems = [
  { href: "/fixture", label: "Fixture", icon: CalendarDays },
  { href: "/ranking", label: "Rankings", icon: Trophy },
  { href: "/my-stats", label: "My stats", icon: BarChart2 },
];

export function MainNav({ user }: MainNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <span className="font-semibold text-sm hidden sm:block">
            Next World Cup
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {user.nickname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">@{user.nickname}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.totalPoints} pts
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/my-stats">
                <User className="mr-2 h-4 w-4" />
                My stats
              </Link>
            </DropdownMenuItem>
            {user.isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin panel
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction}>
                <button type="submit" className="w-full text-left text-destructive">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}
