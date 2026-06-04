import Link from "next/link";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { AnnouncementBanner } from "@/components/shared/announcement-banner";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const [user, pinnedAnnouncement] = await Promise.all([
    getCurrentUser(),
    prisma.announcement.findFirst({
      where: { pinned: true, active: true },
    }),
  ]);

  // FIFA 2026 kickoff: June 11, 2026 — opening match
  const tournamentStart = new Date("2026-06-11T17:00:00Z");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0F172A]">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Subtle radial glow */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Sodimac
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/fixture"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Ir al prode
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Ingresar
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Announcement banner */}
      {pinnedAnnouncement && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 mb-6">
          <AnnouncementBanner announcement={pinnedAnnouncement} />
        </div>
      )}

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-medium text-blue-400 uppercase tracking-widest">
            FIFA World Cup 2026
          </span>
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Predecí el{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Mundial
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-slate-400 leading-relaxed">
          Hacé tus predicciones, escalá el ranking y competí con tus compañeros del{" "}
          <span className="text-white font-medium">Equipo Sodimac</span>.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          {user ? (
            <Link
              href="/fixture"
              className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white hover:bg-blue-500 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Hacer predicciones →
            </Link>
          ) : (
            <>
              <Link
                href="/auth/register"
                className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white hover:bg-blue-500 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Empezar — es gratis
              </Link>
              <Link
                href="/auth/login"
                className="rounded-xl border border-slate-700 px-8 py-4 text-base font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-all duration-200"
              >
                Ingresar
              </Link>
            </>
          )}
        </div>

        {/* Countdown */}
        <div className="mt-16 w-full max-w-lg">
          <p className="mb-4 text-xs uppercase tracking-widest text-slate-500 font-medium">
            El torneo empieza en
          </p>
          <CountdownTimer targetDate={tournamentStart} />
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {[
            "⚽ Predecí cada partido",
            "🏆 Rankings semanales",
            "🔥 Rachas ganadoras",
            "📊 Stats y logros",
            "🎯 Bonus por resultado exacto",
          ].map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-sm text-slate-400"
            >
              {feature}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-semibold text-white mb-12">
          ¿Cómo funciona?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Registrate",
              description: "Creá tu cuenta y elegí un nickname único.",
            },
            {
              step: "02",
              title: "Predecí",
              description:
                "Enviá tus predicciones de resultado antes de que empiece cada partido.",
            },
            {
              step: "03",
              title: "Competí",
              description:
                "Sumá puntos, escalá el ranking y ganá los premios semanales.",
            },
          ].map(({ step, title, description }) => (
            <div
              key={step}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm"
            >
              <div className="mb-3 text-3xl font-bold text-blue-500/30">
                {step}
              </div>
              <h3 className="mb-2 font-semibold text-white">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring rules */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/20 p-8">
          <h2 className="text-lg font-semibold text-white mb-6 text-center">
            Sistema de puntos
          </h2>
          <div className="space-y-4">
            {[
              { label: "Resultado exacto", points: "3 pts", color: "text-yellow-400" },
              { label: "Ganador correcto / empate", points: "1 pt", color: "text-blue-400" },
              { label: "Semifinalista correcto", points: "+2 pts bonus", color: "text-green-400" },
            ].map(({ label, points, color }) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 border-b border-slate-700/40 last:border-0"
              >
                <span className="text-slate-300 text-sm">{label}</span>
                <span className={`font-semibold text-sm ${color}`}>{points}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-8 text-center text-sm text-slate-600">
        <p>© 2026 Equipo Sodimac — Todos los derechos reservados</p>
      </footer>
    </main>
  );
}
