/**
 * Sets created_at for each lass so Day 1 = June 2, Day 9 = June 10.
 * Run with: node scripts/set-lass-dates.mjs
 */

const SUPABASE_URL = 'https://gkvrjgrpaezknqmctncs.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdnJqZ3JwYWV6a25xbWN0bmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc0MTQyMSwiZXhwIjoyMDk2MzE3NDIxfQ.vwxSbpk7CnnvBSNx0VBt5143bBf2IdbhvlxhAECEch8';

// Day 1 = June 2, Day 2 = June 3, ... Day 9 = June 10
// All at noon UTC so they clearly show as the right date everywhere
const DATES = {
  1: '2026-06-02T12:00:00Z',
  2: '2026-06-03T12:00:00Z',
  3: '2026-06-04T12:00:00Z',
  4: '2026-06-05T12:00:00Z',
  5: '2026-06-06T12:00:00Z',
  6: '2026-06-07T12:00:00Z',
  7: '2026-06-08T12:00:00Z',
  8: '2026-06-09T12:00:00Z',
  9: '2026-06-10T12:00:00Z',
};

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function setDate(dayNumber, createdAt) {
  const url = `${SUPABASE_URL}/rest/v1/lass_of_the_day?day_number=eq.${dayNumber}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ created_at: createdAt }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Day ${dayNumber}: FAILED ${res.status} — ${text}`);
    return false;
  }

  const data = await res.json();
  if (!data.length) {
    console.warn(`Day ${dayNumber}: no row found (not yet generated?)`);
    return false;
  }

  console.log(`Day ${dayNumber} → ${createdAt.slice(0, 10)} ✓  (${data[0].profession}, Co. ${data[0].county})`);
  return true;
}

// First verify rows exist
const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/lass_of_the_day?select=day_number,profession,county,created_at&order=day_number`, { headers });
const rows = await checkRes.json();
console.log(`\nFound ${rows.length} lasses in DB:\n`);
for (const r of rows) {
  console.log(`  Day ${r.day_number}: ${r.profession}, Co. ${r.county} — currently ${r.created_at?.slice(0,10)}`);
}

if (!rows.length) {
  console.log('\nNo lasses found — they may need to be regenerated via the admin panel.');
  process.exit(1);
}

console.log('\nUpdating dates...\n');
for (const [day, date] of Object.entries(DATES)) {
  await setDate(Number(day), date);
}

console.log('\nDone. Days 1–9 now span June 2–10.');
console.log('Day 1 (Firefighter, Kerry): 103 days left');
console.log('Day 9 (Whiskey Distiller, Tipperary): 95 days left');
