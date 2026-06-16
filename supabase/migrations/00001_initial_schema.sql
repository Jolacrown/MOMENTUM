-- Set up Enums
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE learning_style AS ENUM ('video', 'reading', 'practice', 'mixed');
CREATE TYPE goal_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE recommendation_type AS ENUM ('mentor', 'course', 'workshop', 'resource');

-- Users Table (Extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  skill_level skill_level,
  learning_style learning_style,
  daily_time_minutes INT,
  timezone TEXT DEFAULT 'Africa/Lagos',
  onboarding_step INT DEFAULT 0,
  reminder_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals Table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_date DATE,
  daily_target TEXT,
  priority INT DEFAULT 1,
  status goal_status DEFAULT 'active',
  progress_percent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkins Table
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  task_completed BOOLEAN DEFAULT false,
  mood INT,
  notes TEXT,
  effort_level INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, goal_id, date)
);

-- Streaks Table
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  recovery_streak INT DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources Table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT,
  category TEXT NOT NULL,
  skill_level skill_level,
  duration TEXT,
  thumbnail_url TEXT,
  provider TEXT,
  resource_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Resources Table (Bookmarking)
CREATE TABLE saved_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- Resource Analytics Table
CREATE TABLE resource_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- e.g., 'resource_viewed', 'resource_opened', 'resource_completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommendations Table (Curated by system)
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type recommendation_type,
  resource_type TEXT,
  category TEXT,
  title TEXT NOT NULL,
  url TEXT,
  tags TEXT[] DEFAULT '{}',
  skill_level skill_level,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Recommendations (Tracking what is shown to user)
CREATE TABLE user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recommendation_id)
);

-- Reports Table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'weekly', 'monthly'
  report_url TEXT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for User Creation (Automatically create User row when Auth User signs up)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'User'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Setup Row Level Security (RLS) policies

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 1. Users can view/update their own profile
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE USING (auth.uid() = id);

-- 2. Goals Policies
CREATE POLICY "Users can manage own goals" 
ON goals FOR ALL USING (auth.uid() = user_id);

-- 3. Checkins Policies
CREATE POLICY "Users can manage own checkins" 
ON checkins FOR ALL USING (auth.uid() = user_id);

-- 4. Streaks Policies
CREATE POLICY "Users can manage own streaks" 
ON streaks FOR ALL USING (auth.uid() = user_id);

-- 5. Resources Policies (Public Read, Admin Write)
CREATE POLICY "Resources are viewable by all authenticated users" 
ON resources FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Saved Resources Policies
CREATE POLICY "Users can manage own saved resources" 
ON saved_resources FOR ALL USING (auth.uid() = user_id);

-- 7. Resource Analytics
CREATE POLICY "Users can manage own analytics" 
ON resource_analytics FOR ALL USING (auth.uid() = user_id);

-- 8. Recommendations (Public Read)
CREATE POLICY "Recommendations are viewable by all" 
ON recommendations FOR SELECT USING (auth.role() = 'authenticated');

-- 9. User Recommendations
CREATE POLICY "Users can manage own recommendations" 
ON user_recommendations FOR ALL USING (auth.uid() = user_id);

-- 10. Reports
CREATE POLICY "Users can view own reports" 
ON reports FOR SELECT USING (auth.uid() = user_id);
