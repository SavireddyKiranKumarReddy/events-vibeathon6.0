-- Remove orphan Phase 1 column from r2_submissions
ALTER TABLE r2_submissions ALTER COLUMN feedback_screenshot_url DROP NOT NULL;
ALTER TABLE r2_submissions ALTER COLUMN feedback_screenshot_url SET DEFAULT '';
ALTER TABLE r2_submissions ALTER COLUMN event_experience DROP NOT NULL;
ALTER TABLE r2_submissions ALTER COLUMN event_experience SET DEFAULT '';
