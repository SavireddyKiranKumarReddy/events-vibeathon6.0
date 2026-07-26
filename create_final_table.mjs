const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aWJodWVucXhzam11ZG9oYnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkyNzU0MiwiZXhwIjoyMTAwNTAzNTQyfQ.OGmmEpUhXSVEhw5vjkQhk1pdOrhzpNmNyeo_6XjZgnI';
const BASE = 'https://uyibhuenqxsjmudohbyq.supabase.co';

const sql = `
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
`;

// Create via exec function
const r = await fetch(`${BASE}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});
console.log('RPC status:', r.status);
const t = await r.text();
console.log('Response:', t.substring(0, 500));

// If RPC doesn't exist, try direct table creation test
if (r.status >= 400) {
  console.log('\nTrying insert test to check if table exists...');
  const r2 = await fetch(`${BASE}/rest/v1/final_submissions?limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
  });
  console.log('Table exists?', r2.status, (await r2.text()).substring(0, 200));
}
