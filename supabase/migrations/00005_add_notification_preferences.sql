-- Notification preferences for email and reminders
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_daily_reminder BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  email_streak_recovery BOOLEAN DEFAULT true,
  email_milestones BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  reminder_time TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'Africa/Lagos',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification preferences"
ON notification_preferences FOR ALL
USING (auth.uid() = user_id);
