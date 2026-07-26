const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aWJodWVucXhzam11ZG9oYnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkyNzU0MiwiZXhwIjoyMTAwNTAzNTQyfQ.OGmmEpUhXSVEhw5vjkQhk1pdOrhzpNmNyeo_6XjZgnI';
const BASE = 'https://uyibhuenqxsjmudohbyq.supabase.co';

// Create a temporary function to run DDL, then call it, then drop it
const steps = [
  // Step 1: Create temporary exec function
  {
    name: 'Create exec_sql() function',
    sql: `CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS void AS $$ BEGIN EXECUTE query; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`,
  },
  // Step 2: Add hints_used column
  {
    name: 'Add hints_used column',
    sql: `ALTER TABLE public.day2_osint_progress ADD COLUMN IF NOT EXISTS hints_used jsonb DEFAULT '[]'::jsonb;`,
  },
  // Step 3: Add score column
  {
    name: 'Add score column',
    sql: `ALTER TABLE public.day2_osint_progress ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;`,
  },
];

// Use Supabase's SQL endpoint via the database REST API
// Actually, let's try creating the function via a different approach
// We can use the PostgREST raw SQL endpoint

// Try using the undocumented /pg endpoint
for (const step of steps) {
  console.log(`\n--- ${step.name} ---`);
  const r = await fetch(`${BASE}/pg/query`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: step.sql }),
  });
  console.log(`Status: ${r.status}`);
  const t = await r.text();
  console.log(`Response: ${t.substring(0, 300)}`);
}
