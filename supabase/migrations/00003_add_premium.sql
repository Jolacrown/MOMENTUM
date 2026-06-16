-- Add premium columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_since TIMESTAMPTZ;

-- Allow users to read their own premium status (already covered by existing RLS)
-- The existing policy "Users can view own profile" covers SELECT
-- The existing policy "Users can update own profile" covers UPDATE
