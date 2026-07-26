const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aWJodWVucXhzam11ZG9oYnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkyNzU0MiwiZXhwIjoyMTAwNTAzNTQyfQ.OGmmEpUhXSVEhw5vjkQhk1pdOrhzpNmNyeo_6XjZgnI';
const BASE = 'https://uyibhuenqxsjmudohbyq.supabase.co';

// exec_sql exists but parsing as filter. Try different param names
const params = [
  { body: { query: 'ALTER TABLE public.day2_osint_progress ADD COLUMN IF NOT EXISTS hints_used jsonb DEFAULT \'[]\'::jsonb;' } },
  { body: { text: 'ALTER TABLE public.day2_osint_progress ADD COLUMN IF NOT EXISTS hints_used jsonb DEFAULT \'[]\'::jsonb;' } },
  { body: { q: 'ALTER TABLE public.day2_osint_progress ADD COLUMN IF NOT EXISTS hints_used jsonb DEFAULT \'[]\'::jsonb;' } },
  { body: { input: 'ALTER TABLE public.day2_osint_progress ADD COLUMN IF NOT EXISTS hints_used jsonb DEFAULT \'[]\'::jsonb;' } },
];

for (const p of params) {
  const paramKey = Object.keys(p.body)[0];
  const r = await fetch(`${BASE}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(p.body),
  });
  const t = await r.text();
  console.log(`Param "${paramKey}": status=${r.status} response=${t.substring(0, 200)}`);
}
