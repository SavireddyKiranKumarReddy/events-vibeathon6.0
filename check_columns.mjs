const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aWJodWVucXhzam11ZG9oYnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkyNzU0MiwiZXhwIjoyMTAwNTAzNTQyfQ.OGmmEpUhXSVEhw5vjkQhk1pdOrhzpNmNyeo_6XjZgnI';
const BASE = 'https://uyibhuenqxsjmudohbyq.supabase.co';

// Try to insert a test row with hints_used and score to see if columns exist
const r = await fetch(`${BASE}/rest/v1/day2_osint_progress`, {
  method: 'POST',
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
  body: JSON.stringify({
    team_name: '__TEST_COL_CHECK__',
    lead_name: '__TEST_COL_CHECK__',
    current_question: 0,
    total_correct: 0,
    total_skipped: 0,
    skips_remaining: 0,
    hints_used: [],
    answers: [],
    completed: false,
    score: 0,
  }),
});

const data = await r.json();
console.log('Insert status:', r.status);

if (r.status >= 400) {
  console.log('ERROR:', data.message || JSON.stringify(data));
  if (data.message?.includes('score')) {
    console.log('\n>>> score column MISSING - need to run migration!');
  }
  if (data.message?.includes('hints_used')) {
    console.log('\n>>> hints_used column MISSING - need to run migration!');
  }
} else {
  console.log('Insert OK! Columns exist.');
  console.log('Returned columns:', Object.keys(data[0] ?? data).join(', '));
  // Clean up
  await fetch(`${BASE}/rest/v1/day2_osint_progress?team_name=eq.__TEST_COL_CHECK__`, {
    method: 'DELETE',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  console.log('Test row cleaned up.');
}
