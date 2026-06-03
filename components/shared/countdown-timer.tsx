"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    getTimeLeft(targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const isOver =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (isOver) {
    return (
      <div className="text-center text-white font-bold text-xl">
        🎉 The tournament has started!
      </div>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                  {pad(value)}
                </span>
              </div>
            </div>
            <span className="mt-2 text-xs text-slate-500 uppercase tracking-widest font-medium">
              {label}
            </span>
          </div>

          {i < units.length - 1 && (
            <span className="text-2xl text-slate-600 font-light mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
