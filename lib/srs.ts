import { LearningStats } from '@/types';

// SM-2 ähnlicher Algorithmus für Spaced Repetition
const INITIAL_EASINESS = 2.5;
const MIN_EASINESS = 1.3;
const QUALITY_WEIGHTS = {
  perfect: 5,    // Sofort richtig
  correct: 4,    // Richtig nach kurzem Nachdenken
  hard: 3,       // Schwierig, aber richtig
  wrong: 1,      // Falsch
  veryWrong: 0,  // Komplett falsch
};

export interface ReviewResult {
  nextReviewDate: Date;
  easinessFactor: number;
  interval: number; // in Tagen
}

export function calculateNextReview(
  stats: LearningStats | null,
  quality: keyof typeof QUALITY_WEIGHTS
): ReviewResult {
  const qualityValue = QUALITY_WEIGHTS[quality];
  let easiness = stats?.easiness_factor || INITIAL_EASINESS;
  let interval = 1;
  let repetitions = 0;

  if (stats) {
    // Berechne aktuelle Wiederholungen basierend auf Erfolgsrate
    repetitions = Math.floor((stats.success_count / (stats.success_count + stats.failure_count + 1)) * 5);
  }

  // Easiness Factor anpassen
  easiness = easiness + (0.1 - (5 - qualityValue) * (0.08 + (5 - qualityValue) * 0.02));
  easiness = Math.max(easiness, MIN_EASINESS);

  // Intervall berechnen
  if (qualityValue < 3) {
    // Falsch beantwortet - von vorne beginnen
    interval = 1;
    repetitions = 0;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
    repetitions += 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    nextReviewDate,
    easinessFactor: easiness,
    interval,
  };
}

export function calculateDifficultyScore(
  successCount: number,
  failureCount: number
): number {
  const total = successCount + failureCount;
  if (total === 0) return 0.5; // Neutral für neue Vokabeln
  
  const successRate = successCount / total;
  // Umgekehrt: niedrige Erfolgsrate = hohe Schwierigkeit
  return 1 - successRate;
}

export function getVocabulariesForReview(
  vocabularies: Array<{ id: string; learning_stats?: LearningStats | null }>
): string[] {
  const now = new Date();
  
  return vocabularies
    .filter(vocab => {
      if (!vocab.learning_stats) return true; // Neue Vokabeln
      
      const nextReview = new Date(vocab.learning_stats.next_review_date);
      return nextReview <= now;
    })
    .sort((a, b) => {
      // Sortiere nach Schwierigkeit (schwierigste zuerst)
      const difficultyA = a.learning_stats?.difficulty_score || 0.5;
      const difficultyB = b.learning_stats?.difficulty_score || 0.5;
      return difficultyB - difficultyA;
    })
    .map(vocab => vocab.id);
}

