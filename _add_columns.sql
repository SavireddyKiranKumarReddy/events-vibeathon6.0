ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS development_flow TEXT DEFAULT '';
ALTER TABLE r2_submissions ADD COLUMN IF NOT EXISTS tech_stack_used TEXT DEFAULT '';
