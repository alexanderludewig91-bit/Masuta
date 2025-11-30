export interface Vocabulary {
  id: string;
  user_id: string;
  german_text: string;
  japanese_text: string;
  romaji?: string;
  created_at: string;
  updated_at: string;
}

export interface VocabularyCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface VocabularyCategoryRelation {
  vocabulary_id: string;
  category_id: string;
}

export interface LearningStats {
  id: string;
  vocabulary_id: string;
  user_id: string;
  last_reviewed: string | null;
  success_count: number;
  failure_count: number;
  difficulty_score: number;
  next_review_date: string;
  easiness_factor: number;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  user_id: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  level: number;
  achievements: string[];
  last_practice_date: string | null;
  updated_at: string;
}

export interface TranslationCache {
  id: string;
  source_text: string;
  source_language: string;
  target_language: string;
  translated_text: string;
  created_at: string;
}

export type TrainingMode = 'multiple-choice' | 'text-input' | 'flashcards';

export interface TrainingSession {
  vocabularyId: string;
  mode: TrainingMode;
  correct: boolean;
  timestamp: string;
}

