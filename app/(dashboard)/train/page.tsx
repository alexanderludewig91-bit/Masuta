'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Vocabulary, LearningStats, TrainingMode } from '@/types';
import MultipleChoice from '@/components/training/MultipleChoice';
import TextInput from '@/components/training/TextInput';
import FlashCards from '@/components/training/FlashCards';
import Button from '@/components/ui/Button';
import { calculateNextReview, calculateDifficultyScore } from '@/lib/srs';
import { calculatePoints, updateStreak, checkAchievements } from '@/lib/gamification';
import { calculateLevel } from '@/lib/utils';

export default function TrainPage() {
  const [mode, setMode] = useState<TrainingMode>('multiple-choice');
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<any>(null);

  useEffect(() => {
    loadVocabulariesForReview();
    loadUserProgress();
  }, []);

  const loadVocabulariesForReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Lade Vokabeln die zum Review bereit sind
      const { data: vocabData, error: vocabError } = await supabase
        .from('vocabularies')
        .select('*, learning_stats(*)')
        .eq('user_id', user.id);

      if (vocabError) throw vocabError;

      const now = new Date();
      const reviewVocabularies = (vocabData || [])
        .filter((vocab: any) => {
          if (!vocab.learning_stats || vocab.learning_stats.length === 0) return true;
          const stats = vocab.learning_stats[0];
          return new Date(stats.next_review_date) <= now;
        })
        .sort((a: any, b: any) => {
          const difficultyA = a.learning_stats?.[0]?.difficulty_score || 0.5;
          const difficultyB = b.learning_stats?.[0]?.difficulty_score || 0.5;
          return difficultyB - difficultyA;
        });

      setVocabularies(reviewVocabularies);
    } catch (error) {
      console.error('Error loading vocabularies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserProgress(data);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const generateMultipleChoiceOptions = (correctAnswer: string, allVocabularies: Vocabulary[]): string[] => {
    const options = [correctAnswer];
    const otherVocabularies = allVocabularies
      .filter(v => v.japanese_text !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.japanese_text);
    
    options.push(...otherVocabularies);
    return options.sort(() => Math.random() - 0.5);
  };

  const handleAnswer = async (correct: boolean) => {
    if (vocabularies.length === 0) return;

    const currentVocab = vocabularies[currentIndex];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update Session Stats
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    // Load or create learning stats
    const { data: existingStats } = await supabase
      .from('learning_stats')
      .select('*')
      .eq('vocabulary_id', currentVocab.id)
      .eq('user_id', user.id)
      .single();

    const quality = correct ? 'correct' : 'wrong';
    const reviewResult = calculateNextReview(
      existingStats || null,
      quality
    );

    const successCount = (existingStats?.success_count || 0) + (correct ? 1 : 0);
    const failureCount = (existingStats?.failure_count || 0) + (correct ? 0 : 1);
    const difficultyScore = calculateDifficultyScore(successCount, failureCount);

    // Update or create learning stats
    const statsData = {
      vocabulary_id: currentVocab.id,
      user_id: user.id,
      last_reviewed: new Date().toISOString(),
      success_count: successCount,
      failure_count: failureCount,
      difficulty_score: difficultyScore,
      next_review_date: reviewResult.nextReviewDate.toISOString(),
      easiness_factor: reviewResult.easinessFactor,
    };

    if (existingStats) {
      await supabase
        .from('learning_stats')
        .update(statsData)
        .eq('id', existingStats.id);
    } else {
      await supabase
        .from('learning_stats')
        .insert(statsData);
    }

    // Update user progress (gamification)
    const points = calculatePoints(correct, userProgress?.current_streak || 0);
    const newTotalPoints = (userProgress?.total_points || 0) + points;
    const newLevel = calculateLevel(newTotalPoints);
    const streakUpdate = updateStreak(
      userProgress || {
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        last_practice_date: null,
      },
      true
    );

    const newAchievements = checkAchievements(
      {
        ...userProgress,
        current_streak: streakUpdate.currentStreak,
        level: newLevel,
      },
      vocabularies.length
    );

    const progressData = {
      user_id: user.id,
      total_points: newTotalPoints,
      current_streak: streakUpdate.currentStreak,
      longest_streak: streakUpdate.longestStreak,
      level: newLevel,
      achievements: [...(userProgress?.achievements || []), ...newAchievements],
      last_practice_date: new Date().toISOString(),
    };

    if (userProgress) {
      await supabase
        .from('user_progress')
        .update(progressData)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_progress')
        .insert(progressData);
    }

    await loadUserProgress();

    // Show achievement notifications
    if (newAchievements.length > 0) {
      newAchievements.forEach(achievement => {
        // Könnte als Toast implementiert werden
        console.log('Achievement:', achievement);
      });
    }

    // Move to next vocabulary
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session complete
      alert(`Session beendet! ${sessionStats.correct + (correct ? 1 : 0)}/${sessionStats.total + 1} richtig`);
      await loadVocabulariesForReview();
      setCurrentIndex(0);
      setSessionStats({ correct: 0, total: 0 });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-700">
        <p>Lädt Vokabeln...</p>
      </div>
    );
  }

  if (vocabularies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-800 mb-4">Keine Vokabeln zum Üben verfügbar</p>
        <p className="text-sm text-gray-700 mb-6">
          Füge Vokabeln hinzu oder warte bis die nächste Wiederholung fällig ist.
        </p>
        <Button onClick={loadVocabulariesForReview}>Erneut laden</Button>
      </div>
    );
  }

  const currentVocab = vocabularies[currentIndex];
  const progress = ((currentIndex + 1) / vocabularies.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold">Training</h1>
          <div className="text-sm text-gray-800">
            {currentIndex + 1} / {vocabularies.length}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setMode('multiple-choice')}
          className={`px-4 py-2 rounded-lg font-medium ${
            mode === 'multiple-choice'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Multiple Choice
        </button>
        <button
          onClick={() => setMode('text-input')}
          className={`px-4 py-2 rounded-lg font-medium ${
            mode === 'text-input'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Texteingabe
        </button>
        <button
          onClick={() => setMode('flashcards')}
          className={`px-4 py-2 rounded-lg font-medium ${
            mode === 'flashcards'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Karteikarten
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {mode === 'multiple-choice' && (
          <MultipleChoice
            vocabulary={currentVocab}
            options={generateMultipleChoiceOptions(currentVocab.japanese_text, vocabularies)}
            onAnswer={handleAnswer}
          />
        )}

        {mode === 'text-input' && (
          <TextInput
            vocabulary={currentVocab}
            onAnswer={handleAnswer}
          />
        )}

        {mode === 'flashcards' && (
          <FlashCards
            vocabulary={currentVocab}
            onAnswer={handleAnswer}
          />
        )}
      </div>

      {userProgress && (
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Punkte</p>
              <p className="text-2xl font-bold">{userProgress.total_points || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Level</p>
              <p className="text-2xl font-bold">{userProgress.level || 1}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Streak</p>
              <p className="text-2xl font-bold">{userProgress.current_streak || 0} 🔥</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

