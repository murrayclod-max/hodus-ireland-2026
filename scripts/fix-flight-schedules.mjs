/**
 * Real published schedules for every leg, departures included, so the Flights
 * tab shows when you leave as well as when you land. Times stored UTC.
 *
 *  EI 60  SFO→DUB  17:40 PDT Thu 10 → 11:45 IST Fri 11
 *  EI 100 EWR→DUB  17:35 EDT Thu 11 → 05:15 IST Sat 12
 *  UA 23  EWR→DUB  19:45 EDT Fri 11 → 07:30 IST Sat 12
 *  DL 292 DTW→DUB  22:00 EDT Sat 12 → 10:00 IST Sun 13
 *  EI 61  DUB→SFO  13:00 IST Sun 20 → 15:55 PDT Sun 20
 *  EI 101 DUB→EWR  13:15 IST Sun 20 → 16:05 EDT Sun 20
 *  EI 404 DUB→FCO  10:30 IST Sun 20 → 14:35 CEST Sun 20
 *  UA 981 DUB→ORD  11:35 IST Sun 20 → 13:40 CDT Sun 20  (connects for SFO)
 *
 * Run with: node scripts/fix-flight-schedules.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EI61 = {
  airline: 'Aer Lingus', flight_no: 'EI 61', from_code: 'DUB', to_code: 'SFO',
  depart_at: '2026-09-20T12:00:00Z', arrive_at: '2026-09-20T22:55:00Z', stops: 'Nonstop',
};

const HOME_ON_EI61 = [
  'Dan Murray', 'Todd Moutafian', 'Matt Hodus', 'Dave Harris', 'Eric Strong',
  'Galen Archibald', 'Jim Hughes', 'Lee Einhorn', 'Joe Gulash',
];

const LEGS = [
  ...HOME_ON_EI61.map(name => ({ name, direction: 'return', ...EI61 })),
  {
    name: 'Matt Burns', direction: 'return',
    airline: 'Aer Lingus', flight_no: 'EI 101', from_code: 'DUB', to_code: 'EWR',
    depart_at: '2026-09-20T12:15:00Z', arrive_at: '2026-09-20T20:05:00Z', stops: 'Nonstop',
  },
  {
    name: 'Jim Mitchell', direction: 'return',
    airline: 'Aer Lingus', flight_no: 'EI 404', from_code: 'DUB', to_code: 'FCO',
    depart_at: '2026-09-20T09:30:00Z', arrive_at: '2026-09-20T12:35:00Z', stops: 'Nonstop',
  },
  {
    name: 'Jeff Pinksa', direction: 'return',
    airline: 'United', flight_no: 'UA 981', from_code: 'DUB', to_code: 'ORD',
    depart_at: '2026-09-20T10:35:00Z', arrive_at: '2026-09-20T18:40:00Z',
    stops: 'Chicago O’Hare — connects for SFO',
  },
  {
    name: 'Matt Burns', direction: 'out',
    airline: 'Aer Lingus', flight_no: 'EI 100', from_code: 'EWR', to_code: 'DUB',
    depart_at: '2026-09-11T21:35:00Z', arrive_at: '2026-09-12T04:15:00Z', stops: 'Nonstop',
  },
  {
    name: 'Jeff Pinksa', direction: 'out',
    airline: 'United', flight_no: 'UA 23', from_code: 'EWR', to_code: 'DUB',
    depart_at: '2026-09-11T23:45:00Z', arrive_at: '2026-09-12T06:30:00Z', stops: 'Nonstop',
  },
  {
    name: 'Joe Gulash', direction: 'out',
    airline: 'Delta', flight_no: 'DL 292', from_code: 'DTW', to_code: 'DUB',
    depart_at: '2026-09-13T02:00:00Z', arrive_at: '2026-09-13T09:00:00Z', stops: 'Nonstop',
  },
];

async function main() {
  const { data: players } = await db.from('players').select('id, name');
  const byName = new Map(players.map(p => [p.name, p.id]));

  for (const { name, direction, ...leg } of LEGS) {
    const playerId = byName.get(name);
    if (!playerId) { console.log(`No player row: ${name}`); continue; }

    const { data, error } = await db
      .from('flights').update(leg)
      .eq('player_id', playerId).eq('direction', direction).select('id');
    if (error) throw error;
    console.log(`${data.length ? 'Set' : 'MISSING'} ${direction.padEnd(6)} ${leg.flight_no.padEnd(7)} ${name}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
