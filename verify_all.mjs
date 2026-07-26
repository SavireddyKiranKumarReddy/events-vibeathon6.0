const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aWJodWVucXhzam11ZG9oYnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDkyNzU0MiwiZXhwIjoyMTAwNTAzNTQyfQ.OGmmEpUhXSVEhw5vjkQhk1pdOrhzpNmNyeo_6XjZgnI';
const BASE = 'https://uyibhuenqxsjmudohbyq.supabase.co';

async function check(name, url) {
  const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  return { name, status: r.status, data: await r.json() };
}

const results = await Promise.all([
  // 1. OSINT config
  check('OSINT config', `${BASE}/rest/v1/day2_config?challenge_key=eq.osint_questions&select=config`),
  // 2. Speed quiz config
  check('Speed Quiz config', `${BASE}/rest/v1/day2_config?challenge_key=eq.speed_quiz&select=config`),
  // 3. day2_osint_progress columns
  check('day2_osint_progress columns', `${BASE}/rest/v1/day2_osint_progress?limit=1&select=*`),
  // 4. day2_config keys
  check('day2_config keys', `${BASE}/rest/v1/day2_config?select=challenge_key`),
]);

for (const r of results) {
  console.log(`\n=== ${r.name} (status: ${r.status}) ===`);
  if (r.status !== 200) {
    console.log('ERROR:', JSON.stringify(r.data).substring(0, 200));
    continue;
  }
  if (r.name === 'OSINT config') {
    const cfg = r.data[0]?.config;
    if (!cfg) { console.log('NO OSINT CONFIG FOUND!'); continue; }
    let totalQ = 0;
    for (const level of cfg.levels ?? []) {
      const qCount = level.questions.length;
      totalQ += qCount;
      console.log(`  Level ${level.level} (${level.name}): ${qCount} questions`);
      for (const q of level.questions) {
        const ans = q.type === 'multi' ? q.answers.join(' ||| ') : q.answer;
        const norm = q.normalize ? ` [normalize: ${q.normalize}]` : '';
        console.log(`    Q: ${q.q.substring(0, 80)}... => ${ans}${norm}`);
      }
    }
    console.log(`  TOTAL QUESTIONS: ${totalQ}`);
  }
  if (r.name === 'Speed Quiz config') {
    const cfg = r.data[0]?.config;
    if (!cfg) { console.log('NO SPEED QUIZ CONFIG!'); continue; }
    console.log(`  time_limit: ${cfg.time_limit}`);
    console.log(`  questions: ${cfg.questions?.length}`);
    for (const q of (cfg.questions ?? [])) {
      console.log(`    Q: ${q.q.substring(0, 60)}... => ${q.answer}`);
    }
  }
  if (r.name === 'day2_osint_progress columns') {
    if (r.data.length === 0) {
      console.log('  No progress rows yet (empty table)');
      console.log('  Need to check columns via SQL query');
    } else {
      const cols = Object.keys(r.data[0]);
      console.log('  Columns:', cols.join(', '));
      console.log('  Has hints_used:', cols.includes('hints_used'));
      console.log('  Has score:', cols.includes('score'));
    }
  }
  if (r.name === 'day2_config keys') {
    console.log('  Config keys:', r.data.map(d => d.challenge_key).join(', '));
  }
}
