ALTER TABLE public.final_submissions
  ALTER COLUMN team_lead_contact DROP NOT NULL,
  ALTER COLUMN github_url DROP NOT NULL,
  ALTER COLUMN deployment_url DROP NOT NULL,
  ALTER COLUMN ppt_url DROP NOT NULL,
  ALTER COLUMN project_summary DROP NOT NULL,
  ALTER COLUMN project_uniqueness DROP NOT NULL,
  ALTER COLUMN phases_completed DROP NOT NULL;
