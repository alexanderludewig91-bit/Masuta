import { UserProgress } from '@/types';
import { calculateLevel, getPointsForLevel } from './utils';

export const POINTS_PER_CORRECT = 10;
export const POINTS_PER_STREAK_BONUS = 5;
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export function calculatePoints(
  correct: boolean,
  currentStreak: number
): number {
  let points = 0;
  
  if (correct) {
    points += POINTS_PER_CORRECT;
    
    // Streak-Bonus
    if (currentStreak > 0 && currentStreak % 5 === 0) {
      points += POINTS_PER_STREAK_BONUS * (currentStreak / 5);
    }
  }
  
  return points;
}

export function updateStreak(
  progress: UserProgress,
  practicedToday: boolean
): { currentStreak: number; longestStreak: number } {
  const today = new Date().toISOString().split('T')[0];
  const lastPractice = progress.last_practice_date
    ? new Date(progress.last_practice_date).toISOString().split('T')[0]
    : null;
  
  let currentStreak = progress.current_streak;
  let longestStreak = progress.longest_streak;
  
  if (practicedToday) {
    if (lastPractice === today) {
      // Bereits heute geübt, Streak bleibt gleich
      return { currentStreak, longestStreak };
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastPractice === yesterdayStr) {
      // Kontinuierlicher Streak
      currentStreak += 1;
    } else if (lastPractice !== today) {
      // Streak unterbrochen, neu starten
      currentStreak = 1;
    }
    
    longestStreak = Math.max(longestStreak, currentStreak);
  }
  
  return { currentStreak, longestStreak };
}

export function checkAchievements(
  progress: UserProgress,
  vocabularyCount: number
): string[] {
  const newAchievements: string[] = [];
  const existing = progress.achievements || [];
  
  // Streak-Achievements
  for (const milestone of STREAK_MILESTONES) {
    const achievementId = `streak-${milestone}`;
    if (progress.current_streak >= milestone && !existing.includes(achievementId)) {
      newAchievements.push(achievementId);
    }
  }
  
  // Vokabel-Achievements
  const vocabularyMilestones = [10, 50, 100, 250, 500, 1000];
  for (const milestone of vocabularyMilestones) {
    const achievementId = `vocab-${milestone}`;
    if (vocabularyCount >= milestone && !existing.includes(achievementId)) {
      newAchievements.push(achievementId);
    }
  }
  
  // Level-Achievements
  const levelMilestones = [5, 10, 20, 30, 50];
  for (const milestone of levelMilestones) {
    const achievementId = `level-${milestone}`;
    if (progress.level >= milestone && !existing.includes(achievementId)) {
      newAchievements.push(achievementId);
    }
  }
  
  return newAchievements;
}

export function getAchievementName(achievementId: string): string {
  const [type, value] = achievementId.split('-');
  
  switch (type) {
    case 'streak':
      return `${value} Tage Streak!`;
    case 'vocab':
      return `${value} Vokabeln gelernt!`;
    case 'level':
      return `Level ${value} erreicht!`;
    default:
      return 'Achievement freigeschaltet!';
  }
}

