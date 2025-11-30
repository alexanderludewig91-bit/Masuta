-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vocabularies table
CREATE TABLE IF NOT EXISTS vocabularies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  german_text TEXT NOT NULL,
  japanese_text TEXT NOT NULL,
  romaji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vocabulary categories table
CREATE TABLE IF NOT EXISTS vocabulary_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vocabulary category relations (Many-to-Many)
CREATE TABLE IF NOT EXISTS vocabulary_category_relations (
  vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES vocabulary_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (vocabulary_id, category_id)
);

-- Learning stats table
CREATE TABLE IF NOT EXISTS learning_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  difficulty_score DECIMAL(3, 2) DEFAULT 0.5,
  next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  easiness_factor DECIMAL(4, 2) DEFAULT 2.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vocabulary_id, user_id)
);

-- User progress table (Gamification)
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievements TEXT[] DEFAULT '{}',
  last_practice_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translation cache table
CREATE TABLE IF NOT EXISTS translation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_text, source_language, target_language)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vocabularies_user_id ON vocabularies(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_stats_user_id ON learning_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_stats_vocabulary_id ON learning_stats(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_learning_stats_next_review ON learning_stats(next_review_date);
CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup ON translation_cache(source_text, source_language, target_language);

-- Row Level Security (RLS) Policies
ALTER TABLE vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_category_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;

-- Policies for vocabularies
CREATE POLICY "Users can view their own vocabularies"
  ON vocabularies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vocabularies"
  ON vocabularies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabularies"
  ON vocabularies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabularies"
  ON vocabularies FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for vocabulary_categories
CREATE POLICY "Users can view their own categories"
  ON vocabulary_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON vocabulary_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON vocabulary_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON vocabulary_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for vocabulary_category_relations
CREATE POLICY "Users can view their own category relations"
  ON vocabulary_category_relations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vocabularies
      WHERE vocabularies.id = vocabulary_category_relations.vocabulary_id
      AND vocabularies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own category relations"
  ON vocabulary_category_relations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vocabularies
      WHERE vocabularies.id = vocabulary_category_relations.vocabulary_id
      AND vocabularies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own category relations"
  ON vocabulary_category_relations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vocabularies
      WHERE vocabularies.id = vocabulary_category_relations.vocabulary_id
      AND vocabularies.user_id = auth.uid()
    )
  );

-- Policies for learning_stats
CREATE POLICY "Users can view their own learning stats"
  ON learning_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning stats"
  ON learning_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning stats"
  ON learning_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning stats"
  ON learning_stats FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for user_progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for translation_cache (public read, authenticated write)
CREATE POLICY "Anyone can read translation cache"
  ON translation_cache FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert translation cache"
  ON translation_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_vocabularies_updated_at
  BEFORE UPDATE ON vocabularies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_stats_updated_at
  BEFORE UPDATE ON learning_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user_progress when a new user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, total_points, current_streak, longest_streak, level, achievements)
  VALUES (
    NEW.id,
    0,
    0,
    0,
    1,
    '{}'::TEXT[]
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user_progress when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

