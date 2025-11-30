-- Fix für user_progress RLS Problem
-- Führe dieses SQL in der Supabase SQL Editor aus

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Erstelle user_progress für bestehende User, die noch keinen Eintrag haben
INSERT INTO public.user_progress (user_id, total_points, current_streak, longest_streak, level, achievements)
SELECT 
  id,
  0,
  0,
  0,
  1,
  '{}'::TEXT[]
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_progress)
ON CONFLICT (user_id) DO NOTHING;

