/**
 * Rebuilds the six competition rounds so each man partners every one of his
 * team-mates exactly once across Rounds 1–5, then Round 6 (alternate shot)
 * replays the Round 1 partnerships.
 *
 * Harris has a roster change mid-trip — Gulash flies home after Portstewart
 * and Cohen joins at Rosapenna — so Cohen simply takes Gulash's seat in the
 * Round 1 lineup for the finale. The five who play all week still partner
 * each other exactly once.
 *
 * Updates the existing pairing rows in place, so the matches and their
 * hole-by-hole scoring stay attached.
 *
 * Run with: node scripts/set-pairings.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Slot 1 is always the captain's match
const SCHEDULE = {
  murray: {
    1: [['Dan Murray', 'Matt Burns'],     ['Todd Moutafian', 'Eric Strong'], ['Jim Mitchell', 'Matt Hodus']],
    2: [['Dan Murray', 'Todd Moutafian'], ['Jim Mitchell', 'Matt Burns'],    ['Matt Hodus', 'Eric Strong']],
    3: [['Dan Murray', 'Jim Mitchell'],   ['Matt Hodus', 'Todd Moutafian'],  ['Eric Strong', 'Matt Burns']],
    4: [['Dan Murray', 'Matt Hodus'],     ['Eric Strong', 'Jim Mitchell'],   ['Matt Burns', 'Todd Moutafian']],
    5: [['Dan Murray', 'Eric Strong'],    ['Matt Burns', 'Matt Hodus'],      ['Todd Moutafian', 'Jim Mitchell']],
    6: [['Dan Murray', 'Matt Burns'],     ['Todd Moutafian', 'Eric Strong'], ['Jim Mitchell', 'Matt Hodus']],
  },
  harris: {
    1: [['Dave Harris', 'Joe Gulash'],      ['Lee Einhorn', 'Jim Hughes'],   ['Galen Archibald', 'Jeff Pinksa']],
    2: [['Dave Harris', 'Galen Archibald'], ['Joe Gulash', 'Lee Einhorn'],   ['Jim Hughes', 'Jeff Pinksa']],
    3: [['Dave Harris', 'Jeff Pinksa'],     ['Joe Gulash', 'Jim Hughes'],    ['Lee Einhorn', 'Galen Archibald']],
    4: [['Dave Harris', 'Lee Einhorn'],     ['Jim Hughes', 'Galen Archibald'], ['Rob Cohen', 'Jeff Pinksa']],
    5: [['Dave Harris', 'Jim Hughes'],      ['Lee Einhorn', 'Jeff Pinksa'],  ['Rob Cohen', 'Galen Archibald']],
    6: [['Rob Cohen', 'Dave Harris'],       ['Lee Einhorn', 'Jim Hughes'],   ['Galen Archibald', 'Jeff Pinksa']],
  },
};

function auditTeam(team, rounds) {
  const seen = new Map();
  const repeats = [];
  for (const [roundNo, pairs] of Object.entries(rounds)) {
    const inRound = new Set();
    for (const [a, b] of pairs) {
      if (inRound.has(a) || inRound.has(b)) throw new Error(`${team} R${roundNo}: player twice in one round`);
      inRound.add(a); inRound.add(b);
      const key = [a, b].sort().join(' & ');
      if (seen.has(key)) repeats.push(`R${roundNo} ${key} (also R${seen.get(key)})`);
      else seen.set(key, roundNo);
    }
  }
  console.log(`${team}: ${seen.size} distinct partnerships, ${repeats.length} repeat${repeats.length === 1 ? '' : 's'}`);
  for (const r of repeats) console.log(`   repeat — ${r}`);
}

async function main() {
  auditTeam('murray', SCHEDULE.murray);
  auditTeam('harris', SCHEDULE.harris);

  const { data: players } = await db.from('players').select('id, name');
  const id = name => {
    const p = players.find(x => x.name === name);
    if (!p) throw new Error(`Unknown player: ${name}`);
    return p.id;
  };

  const { data: rounds } = await db.from('rounds').select('id, round_no').gte('round_no', 1).order('round_no');

  for (const round of rounds) {
    for (const team of ['murray', 'harris']) {
      const pairs = SCHEDULE[team][round.round_no];
      if (!pairs) continue;
      for (let slot = 1; slot <= 3; slot++) {
        const [a, b] = pairs[slot - 1];
        const { data, error } = await db.from('pairings')
          .update({ player_a: id(a), player_b: id(b) })
          .eq('round_id', round.id).eq('team', team).eq('slot', slot)
          .select('id');
        if (error) throw error;
        if (!data.length) console.log(`  ⚠ no ${team} slot ${slot} row in R${round.round_no}`);
      }
    }
    console.log(`Round ${round.round_no} set`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
