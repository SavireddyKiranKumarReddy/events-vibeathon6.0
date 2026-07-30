-- Add all missing columns to r2_submissions
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS unique_features TEXT DEFAULT '';
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS llms_used TEXT DEFAULT '';
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS vibecoding_tools TEXT DEFAULT '';
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS database_used TEXT DEFAULT '';
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS oauth_exists TEXT DEFAULT '';
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS development_flow TEXT DEFAULT '';
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS tech_stack_used TEXT DEFAULT '';
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
ALTER TABLE r2_submissions ALTER COLUMN feedback_screenshot_url DROP NOT NULL;
ALTER TABLE r2_submissions ALTER COLUMN feedback_screenshot_url SET DEFAULT '';
ALTER TABLE r2_submissions ALTER COLUMN event_experience DROP NOT NULL;
ALTER TABLE r2_submissions ALTER COLUMN event_experience SET DEFAULT '';
