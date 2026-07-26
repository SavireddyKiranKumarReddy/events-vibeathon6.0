const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aWJodWVucXhzam11ZG9oYnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkyNzU0MiwiZXhwIjoyMTAwNTAzNTQyfQ.OGmmEpUhXSVEhw5vjkQhk1pdOrhzpNmNyeo_6XjZgnI';
const BASE = 'https://uyibhuenqxsjmudohbyq.supabase.co';

// Check if there's an existing exec function
const r1 = await fetch(`${BASE}/rest/v1/rpc/exec_sql?query=SELECT 1`, {
  method: 'POST',
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: 'SELECT 1' }),
});
console.log('exec_sql exists?', r1.status, await r1.text());

// Try another common name
const r2 = await fetch(`${BASE}/rest/v1/rpc/run_sql`, {
  method: 'POST',
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sql: 'SELECT 1' }),
});
console.log('run_sql exists?', r2.status, await r2.text());

// Check for any RPC functions
const r3 = await fetch(`${BASE}/rest/v1/`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
console.log('API root:', r3.status, (await r3.text()).substring(0, 500));
