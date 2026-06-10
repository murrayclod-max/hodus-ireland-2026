/**
 * Appends proximity-to-itinerary callout to fun_fact for days 1–9 already in DB.
 * Run with: node scripts/update-fun-fact-proximity.mjs
 */

const SUPABASE_URL = 'https://gkvrjgrpaezknqmctncs.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdnJqZ3JwYWV6a25xbWN0bmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc0MTQyMSwiZXhwIjoyMDk2MzE3NDIxfQ.vwxSbpk7CnnvBSNx0VBt5143bBf2IdbhvlxhAECEch8';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// Trip reference: Round 1 = Royal County Down (Sep 14), Round 2 = Royal Portrush (Sep 15),
// Rounds 4-6 = Rosapenna (Sep 17-19)
const PROXIMITY = {
  1: '~420 km south of Royal County Down (Round 1)',
  2: '~170 km south of Royal County Down (Round 1)',
  3: '~390 km south of Royal County Down (Round 1)',
  4: '~185 km south of Rosapenna (Rounds 4–6)',
  5: '~255 km south of Rosapenna (Rounds 4–6)',
  6: '~215 km south of Rosapenna (Rounds 4–6)',
  7: "You're playing this course on Round 2 — Royal Portrush",
  8: '~65 km from Royal Portrush (Round 2)',
  9: '~285 km south of Royal County Down (Round 1)',
};

async function patch(dayNumber, funFact) {
  const url = `${SUPABASE_URL}/rest/v1/lass_of_the_day?day_number=eq.${dayNumber}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fun_fact: funFact }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Day ${dayNumber}: FAILED ${res.status} — ${text}`);
    return false;
  }

  const data = await res.json();
  if (!data.length) {
    console.warn(`Day ${dayNumber}: row not found`);
    return false;
  }

  console.log(`Day ${dayNumber} ✓  (${data[0].profession}, Co. ${data[0].county})`);
  return true;
}

// Fetch current fun_facts
const checkRes = await fetch(
  `${SUPABASE_URL}/rest/v1/lass_of_the_day?select=day_number,profession,county,fun_fact&order=day_number`,
  { headers }
);
const rows = await checkRes.json();
console.log(`Found ${rows.length} lasses\n`);

for (const row of rows) {
  const suffix = PROXIMITY[row.day_number];
  if (!suffix) {
    console.log(`Day ${row.day_number}: no proximity entry — skipping`);
    continue;
  }

  // Avoid double-appending if script is re-run
  if (row.fun_fact && row.fun_fact.includes('📍')) {
    console.log(`Day ${row.day_number}: already has 📍 callout — skipping`);
    continue;
  }

  const updated = `${row.fun_fact ?? ''}\n\n📍 ${suffix}`;
  await patch(row.day_number, updated);
}

console.log('\nDone.');
