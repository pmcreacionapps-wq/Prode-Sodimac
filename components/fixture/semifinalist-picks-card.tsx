"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { Trophy, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveSemifinalistsAction } from "@/actions/predictions";
import { useToast } from "@/hooks/use-toast";

// Martes 30 de junio 00:00 hora Argentina = UTC-3
const LOCK_DATE = new Date("2026-06-30T03:00:00Z");

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(target.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return timeLeft;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  flagUrl: string;
}

interface SemifinalistPick {
  teamId: string;
  team: Team;
  isCorrect?: boolean | null;
  bonusPoints: number;
}

interface SemifinalistPicksCardProps {
  currentPicks: SemifinalistPick[];
  allTeams: Team[];
}

export function SemifinalistPicksCard({
  currentPicks,
  allTeams,
}: SemifinalistPicksCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(
    currentPicks.map((p) => p.teamId)
  );
  const [isOpen, setIsOpen] = useState(false);

  const msLeft = useCountdown(LOCK_DATE);
  const isDateLocked = msLeft <= 0;
  const isCorrectLocked = currentPicks.some((p) => p.isCorrect !== null);
  const isLocked = isDateLocked || isCorrectLocked;

  const countdown = formatCountdown(msLeft);

  const toggle = (teamId: string) => {
    if (isLocked) return;
    setSelected((prev) => {
      if (prev.includes(teamId)) return prev.filter((id) => id !== teamId);
      if (prev.length >= 4) {
        toast({ title: "Solo podés elegir 4 semifinalistas", variant: "destructive" });
        return prev;
      }
      return [...prev, teamId];
    });
  };

  const handleSave = () => {
    if (selected.length !== 4) {
      toast({ title: "Elegí exactamente 4 semifinalistas", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const result = await saveSemifinalistsAction(selected);
      if (result.success) {
        toast({ title: "¡Picks guardados! 🏆" });
        setIsOpen(false);
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    });
  };

  const selectedTeams = allTeams.filter((t) => selected.includes(t.id));

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/20">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Picks de Semifinalistas</p>
              <p className="text-xs text-muted-foreground">
                +2 puntos bonus c/u · {selected.length}/4 elegidos
              </p>
            </div>
          </div>
          <div className="flex gap-1 items-center">
            {selectedTeams.slice(0, 4).map((team) => (
              <div key={team.id} className="relative h-6 w-6">
                <Image
                  src={team.flagUrl}
                  alt={team.name}
                  fill
                  className="object-contain"
                  sizes="24px"
                />
              </div>
            ))}
            {selected.length === 0 && (
              <span className="text-xs text-muted-foreground">Elegir →</span>
            )}
          </div>
        </div>

        {/* Countdown banner */}
        {!isLocked && countdown && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
            <Lock className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
              Se cierra en{" "}
              {countdown.days > 0 && `${countdown.days}d `}
              {String(countdown.hours).padStart(2, "0")}:
              {String(countdown.minutes).padStart(2, "0")}:
              {String(countdown.seconds).padStart(2, "0")}
            </span>
          </div>
        )}

        {isLocked && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
            <Lock className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="text-xs text-red-500 font-medium">
              Picks cerrados
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="border-t border-yellow-500/20 p-4">
          {isLocked ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {isCorrectLocked
                  ? "Los picks están cerrados — las semis comenzaron."
                  : "El plazo para elegir semifinalistas ya cerró."}
              </p>
              {currentPicks.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {currentPicks.map((pick) => (
                    <div
                      key={pick.teamId}
                      className={cn(
                        "flex items-center gap-2 rounded-xl p-2 border",
                        pick.isCorrect === true && "border-green-500/50 bg-green-500/10",
                        pick.isCorrect === false && "border-red-500/50 bg-red-500/5",
                        pick.isCorrect === null && "border-border"
                      )}
                    >
                      <div className="relative h-8 w-8">
                        <Image src={pick.team.flagUrl} alt={pick.team.name} fill className="object-contain" sizes="32px" />
                      </div>
                      <span className="text-sm font-medium">{pick.team.shortName}</span>
                      {pick.isCorrect === true && (
                        <span className="ml-auto text-xs text-green-500 font-medium">+{pick.bonusPoints}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Elegí los 4 equipos que creés que llegarán a las semifinales. Ganás +2 puntos bonus por cada acierto.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
                {allTeams.map((team) => {
                  const isSelected = selected.includes(team.id);
                  return (
                    <button
                      key={team.id}
                      onClick={() => toggle(team.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all text-xs font-medium",
                        isSelected
                          ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                          : "border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="relative h-8 w-8">
                        <Image src={team.flagUrl} alt={team.name} fill className="object-contain" sizes="32px" />
                      </div>
                      <span className="text-center leading-tight">{team.shortName}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {selected.length}/4 seleccionados
                </p>
                <button
                  onClick={handleSave}
                  disabled={isPending || selected.length !== 4}
                  className={cn(
                    "rounded-xl px-6 py-2 text-sm font-semibold transition-all",
                    selected.length === 4
                      ? "bg-yellow-500 text-yellow-950 hover:bg-yellow-400"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isPending ? "Guardando..." : "Guardar picks"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
