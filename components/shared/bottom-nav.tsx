"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Trophy, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  isAdmin: boolean;
}

export function BottomNav({ isAdmin }: BottomNavProps) {
  const pathname = usePathname();

  const items = [
    { href: "/fixture", label: "Fixture", icon: CalendarDays },
    { href: "/ranking", label: "Rankings", icon: Trophy },
    { href: "/my-stats", label: "My stats", icon: BarChart2 },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Settings }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/90 backdrop-blur-md sm:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-0",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
