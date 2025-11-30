'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Vocabulary, LearningStats, UserProgress } from '@/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatDate, calculateLevel, getPointsForLevel } from '@/lib/utils';
import { getAchievementName } from '@/lib/gamification';

export default function StatisticsPage() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load vocabularies
      const { data: vocabData, error: vocabError } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('user_id', user.id);

      if (vocabError) throw vocabError;
      setVocabularies(vocabData || []);

      // Load learning stats
      const { data: statsData, error: statsError } = await supabase
        .from('learning_stats')
        .select('*')
        .eq('user_id', user.id);

      if (statsError) throw statsError;
      setLearningStats(statsData || []);

      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') throw progressError;
      setUserProgress(progressData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-700">
        <p>Lädt Statistiken...</p>
      </div>
    );
  }

  // Calculate statistics
  const totalVocabularies = vocabularies.length;
  const totalReviews = learningStats.reduce((sum, stat) => sum + stat.success_count + stat.failure_count, 0);
  const successRate = totalReviews > 0
    ? (learningStats.reduce((sum, stat) => sum + stat.success_count, 0) / totalReviews) * 100
    : 0;

  // Vocabularies by difficulty
  const difficultyData = [
    { name: 'Einfach', value: learningStats.filter(s => s.difficulty_score < 0.3).length },
    { name: 'Mittel', value: learningStats.filter(s => s.difficulty_score >= 0.3 && s.difficulty_score < 0.7).length },
    { name: 'Schwer', value: learningStats.filter(s => s.difficulty_score >= 0.7).length },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // Most difficult vocabularies
  const difficultVocabularies = learningStats
    .sort((a, b) => b.difficulty_score - a.difficulty_score)
    .slice(0, 5)
    .map(stat => {
      const vocab = vocabularies.find(v => v.id === stat.vocabulary_id);
      return vocab ? { ...vocab, difficulty: stat.difficulty_score } : null;
    })
    .filter(Boolean);

  // Progress over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const progressData = last7Days.map(date => {
    const reviews = learningStats.filter(stat => {
      if (!stat.last_reviewed) return false;
      return stat.last_reviewed.split('T')[0] === date;
    });
    return {
      date: new Date(date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }),
      reviews: reviews.length,
      correct: reviews.reduce((sum, r) => sum + (r.success_count > 0 ? 1 : 0), 0),
    };
  });

  const currentLevel = userProgress?.level || 1;
  const currentPoints = userProgress?.total_points || 0;
  const pointsForCurrentLevel = getPointsForLevel(currentLevel);
  const pointsForNextLevel = getPointsForLevel(currentLevel + 1);
  const progressToNextLevel = ((currentPoints - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Statistiken</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-800 mb-1">Gesamt Vokabeln</p>
          <p className="text-3xl font-bold">{totalVocabularies}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-800 mb-1">Wiederholungen</p>
          <p className="text-3xl font-bold">{totalReviews}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-800 mb-1">Erfolgsrate</p>
          <p className="text-3xl font-bold">{successRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-800 mb-1">Aktuelle Streak</p>
          <p className="text-3xl font-bold">{userProgress?.current_streak || 0} 🔥</p>
        </div>
      </div>

      {/* Level Progress */}
      {userProgress && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Level Fortschritt</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {currentLevel}</span>
              <span>Level {currentLevel + 1}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${Math.min(progressToNextLevel, 100)}%` }}
              />
            </div>
            <div className="text-center text-sm text-gray-800">
              {currentPoints} / {pointsForNextLevel} Punkte
            </div>
          </div>
        </div>
      )}

      {/* Progress Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Fortschritt (letzte 7 Tage)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="reviews" stroke="#3b82f6" name="Wiederholungen" />
            <Line type="monotone" dataKey="correct" stroke="#10b981" name="Richtig" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Difficulty Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Schwierigkeitsverteilung</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={difficultyData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {difficultyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Most Difficult Vocabularies */}
      {difficultVocabularies.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Schwierigste Vokabeln</h2>
          <div className="space-y-2">
            {difficultVocabularies.map((vocab: any) => (
              <div key={vocab.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{vocab.german_text}</p>
                  <p className="text-gray-800">{vocab.japanese_text}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">Schwierigkeit</p>
                  <p className="font-bold text-red-600">{(vocab.difficulty * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {userProgress && userProgress.achievements && userProgress.achievements.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {userProgress.achievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center"
              >
                <p className="text-2xl mb-2">🏆</p>
                <p className="font-semibold text-sm">{getAchievementName(achievement)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

