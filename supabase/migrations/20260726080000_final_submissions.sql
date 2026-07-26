CREATE TABLE IF NOT EXISTS public.final_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_lead_name text NOT NULL,
  team_lead_contact text NOT NULL,
  team_lead_email text NOT NULL,
  certificate_name text NOT NULL,
  teammate_1 text DEFAULT '',
  teammate_2 text DEFAULT '',
  teammate_3 text DEFAULT '',
  github_url text NOT NULL,
  deployment_url text NOT NULL,
  phases_completed integer NOT NULL DEFAULT 0,
  project_summary text NOT NULL,
  project_uniqueness text NOT NULL,
  round_status text DEFAULT 'submitted',
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.final_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all via service role" ON public.final_submissions
  FOR ALL USING (true) WITH CHECK (true);
