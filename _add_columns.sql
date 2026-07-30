-- Add development_flow and tech_stack_used (if not already there)
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS development_flow TEXT DEFAULT '';
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS tech_stack_used TEXT DEFAULT '';
-- Credits tracking: each edit of github or deployment URL costs 1 credit each
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
