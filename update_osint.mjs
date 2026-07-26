import { readFileSync } from 'fs';

const url = 'https://uyibhuenqxsjmudohbyq.supabase.co/rest/v1/day2_config?challenge_key=eq.osint_questions';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aWJodWVucXhzam11ZG9oYnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkyNzU0MiwiZXhwIjoyMTAwNTAzNTQyfQ.OGmmEpUhXSVEhw5vjkQhk1pdOrhzpNmNyeo_6XjZgnI';

const raw = readFileSync('./osint_config.json', 'utf8').replace(/^\uFEFF/, '');
const config = JSON.parse(raw);

const resp = await fetch(url, {
  method: 'PATCH',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify(config)
});

const data = await resp.json();
const levels = data[0].config.levels;
const total = levels.reduce((s, l) => s + l.questions.length, 0);
console.log(`Updated. ${total} questions across ${levels.length} levels`);
levels.forEach(l => console.log(`  Level ${l.level} (${l.name}): ${l.questions.length} questions`));
