import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return points === 1 ? "1 pt" : `${points} pts`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
