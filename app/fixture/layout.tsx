import { requireAuth } from "@/lib/auth";
import { MainNav } from "@/components/shared/main-nav";
import { BottomNav } from "@/components/shared/bottom-nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav — visible on desktop */}
      <MainNav user={user} />

      {/* Main content with bottom padding for mobile nav */}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:pb-6">
        {children}
      </main>

      {/* Bottom nav — visible on mobile */}
      <BottomNav isAdmin={user.isAdmin} />
    </div>
  );
}
