/**
 * Sets the Irish first name on each published lass row (days 1–9).
 * Run with: node scripts/add-lass-names.mjs
 */

const SUPABASE_URL = 'https://gkvrjgrpaezknqmctncs.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdnJqZ3JwYWV6a25xbWN0bmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc0MTQyMSwiZXhwIjoyMDk2MzE3NDIxfQ.vwxSbpk7CnnvBSNx0VBt5143bBf2IdbhvlxhAECEch8';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const NAMES = {
  1: 'Aoife',
  2: 'Sinéad',
  3: 'Saoirse',
  4: 'Clodagh',
  5: 'Niamh',
  6: 'Muireann',
  7: 'Caoimhe',
  8: 'Eimear',
  9: 'Brigid',
};

for (const [day, name] of Object.entries(NAMES)) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/lass_of_the_day?day_number=eq.${day}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`Day ${day}: FAILED ${res.status} — ${text}`);
    continue;
  }

  const data = await res.json();
  if (!data.length) {
    console.warn(`Day ${day}: row not found`);
    continue;
  }

  console.log(`Day ${day} → ${name} ✓  (${data[0].profession}, Co. ${data[0].county})`);
}

console.log('\nDone.');
