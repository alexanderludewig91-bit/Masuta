import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function calculateLevel(points: number): number {
  // Level 1 bei 0 Punkten, Level 2 bei 100, Level 3 bei 300, etc.
  // Exponentielles Wachstum
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

export function getPointsForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

