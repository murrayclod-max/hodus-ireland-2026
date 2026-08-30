/**
 * One flight, one landing time. EI 60 SFO→DUB is scheduled into Dublin at
 * 11:45 IST (10:45 UTC); eight of us are on it and the rows disagreed.
 *
 * Run with: node scripts/fix-ei60-flights.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EI60 = {
  airline: 'Aer Lingus',
  flight_no: 'EI 60',
  from_code: 'SFO',
  to_code: 'DUB',
  depart_at: '2026-09-11T00:40:00Z', // 17:40 Thu 10 Sept, San Francisco
  arrive_at: '2026-09-11T10:45:00Z', // 11:45 Fri 11 Sept, Dublin
  stops: 'Nonstop',
};

const PASSENGERS = [
  'Dan Murray', 'Todd Moutafian', 'Jim Mitchell', 'Matt Hodus',
  'Dave Harris', 'Eric Strong', 'Galen Archibald', 'Jim Hughes',
];

async function main() {
  const { data: players } = await db.from('players').select('id, name').in('name', PASSENGERS);
  const byName = new Map(players.map(p => [p.name, p.id]));

  for (const name of PASSENGERS) {
    const playerId = byName.get(name);
    if (!playerId) { console.log(`No player row: ${name}`); continue; }

    const { data, error } = await db
      .from('flights').update(EI60)
      .eq('player_id', playerId).eq('direction', 'out').select('id');
    if (error) throw error;
    console.log(`${data.length ? 'Updated' : 'No outbound row for'} ${name}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
