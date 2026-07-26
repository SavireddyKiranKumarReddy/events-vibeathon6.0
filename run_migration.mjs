const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aWJodWVucXhzam11ZG9oYnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkyNzU0MiwiZXhwIjoyMTAwNTAzNTQyfQ.OGmmEpUhXSVEhw5vjkQhk1pdOrhzpNmNyeo_6XjZgnI';
const BASE = 'https://uyibhuenqxsjmudohbyq.supabase.co';

const sql = `
ALTER TABLE public.day2_osint_progress ADD COLUMN IF NOT EXISTS hints_used jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.day2_osint_progress ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;
`;

const r = await fetch(`${BASE}/rest/v1/rpc/exec`, {
  method: 'POST',
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

console.log('RPC exec status:', r.status);
const text = await r.text();
console.log('Response:', text.substring(0, 500));

if (r.status >= 400) {
  // Try the /sql endpoint instead
  console.log('\nTrying /sql endpoint...');
  const r2 = await fetch(`${BASE}/pg/sql`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  console.log('/sql status:', r2.status);
  const text2 = await r2.text();
  console.log('/sql response:', text2.substring(0, 500));
}
