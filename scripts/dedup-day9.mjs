const SUPABASE_URL = 'https://gkvrjgrpaezknqmctncs.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdnJqZ3JwYWV6a25xbWN0bmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc0MTQyMSwiZXhwIjoyMDk2MzE3NDIxfQ.vwxSbpk7CnnvBSNx0VBt5143bBf2IdbhvlxhAECEch8';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/lass_of_the_day?day_number=eq.9&select=id,created_at&order=created_at.asc`,
  { headers }
);
const rows = await res.json();
console.log('Day 9 rows:', JSON.stringify(rows, null, 2));

if (rows.length <= 1) {
  console.log('No duplicate — nothing to do.');
  process.exit(0);
}

// Keep the last one (most recently created), delete all earlier ones
const toDelete = rows.slice(0, -1);
for (const row of toDelete) {
  const del = await fetch(
    `${SUPABASE_URL}/rest/v1/lass_of_the_day?id=eq.${row.id}`,
    { method: 'DELETE', headers }
  );
  console.log(`Deleted ${row.id}: HTTP ${del.status}`);
}
console.log('Done.');
