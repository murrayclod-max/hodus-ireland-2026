/**
 * Who plays AGAINST whom. Partnerships (set-pairings.mjs) are left alone.
 *
 * Gulash flies home after Portstewart on the 16th and Cohen lands on the 17th,
 * so they share one seat on the Harris side — Gulash Rounds 1–3, Cohen 4–6.
 * For scheduling they count as one man, which makes it six against six all
 * week and every cross match-up reachable.
 *
 * A perfectly even draw — every man against every opposite seat exactly twice
 * — turns out to be impossible for this shape; verified against all six
 * one-factorisations and every Round 6 variant. The floor is a total deviation
 * of 12 from even, meaning six pairs meet three times, six meet once, and the
 * remaining twenty-four meet twice. This finds that floor while insisting
 * every pair meets at least once.
 *
 * Run with: node scripts/set-match-ups.mjs [--apply]
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const PERMS = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const SHARED_SEAT = new Set(['Joe Gulash', 'Rob Cohen']);

async function main() {
  const apply = process.argv.includes('--apply');

  const { data: players } = await db.from('players').select('id, name, first_name, team');
  const player = id => players.find(p => p.id === id);
  // Gulash and Cohen collapse to one seat for counting purposes
  const seatName = id => (SHARED_SEAT.has(player(id).name) ? 'Gulash/Cohen' : player(id).name);

  const murraySeats = players.filter(p => p.team === 'murray').map(p => p.name).sort();
  const harrisSeats = [...new Set(players.filter(p => p.team === 'harris').map(p => SHARED_SEAT.has(p.name) ? 'Gulash/Cohen' : p.name))].sort();
  const mIdx = n => murraySeats.indexOf(n);
  const hIdx = n => harrisSeats.indexOf(n);

  const { data: rounds } = await db.from('rounds').select('id, round_no').gte('round_no', 1).order('round_no');
  const { data: pairings } = await db.from('pairings').select('id, round_id, team, slot, player_a, player_b');
  const { data: matches } = await db.from('matches').select('id, round_id, murray_pairing_id');

  const board = rounds.map(r => ({
    round: r,
    murray: pairings.filter(p => p.round_id === r.id && p.team === 'murray').sort((a, b) => a.slot - b.slot),
    harris: pairings.filter(p => p.round_id === r.id && p.team === 'harris').sort((a, b) => a.slot - b.slot),
  }));

  let best = null;
  const counts = Array.from({ length: 6 }, () => new Array(6).fill(0));
  const picks = [];

  const score = () => {
    let deviation = 0, maxMeet = 0, minMeet = Infinity, captains = 0;
    for (let m = 0; m < 6; m++) {
      for (let h = 0; h < 6; h++) {
        const v = counts[m][h];
        deviation += Math.abs(v - 2);
        maxMeet = Math.max(maxMeet, v);
        minMeet = Math.min(minMeet, v);
        if (murraySeats[m] === 'Dan Murray' && harrisSeats[h] === 'Dave Harris') captains = v;
      }
    }
    // Everyone must meet everyone; then flatten; then hold the captains to
    // their fair share of two
    return { key: [minMeet < 1 ? 1 : 0, deviation, maxMeet, Math.abs(captains - 2)], deviation, maxMeet, minMeet, captains };
  };

  const cmp = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };

  const recurse = (ri) => {
    if (ri === board.length) {
      const s = score();
      if (!best || cmp(s.key, best.key) < 0) best = { ...s, picks: [...picks] };
      return;
    }
    for (let p = 0; p < PERMS.length; p++) {
      const perm = PERMS[p];
      const touched = [];
      let ok = true;
      for (let i = 0; i < 3 && ok; i++) {
        const m = board[ri].murray[i], h = board[ri].harris[perm[i]];
        for (const a of [m.player_a, m.player_b]) {
          for (const b of [h.player_a, h.player_b]) {
            const mi = mIdx(player(a).name), hi = hIdx(seatName(b));
            if (++counts[mi][hi] > 3) ok = false;
            touched.push([mi, hi]);
          }
        }
      }
      if (ok) { picks.push(p); recurse(ri + 1); picks.pop(); }
      for (const [mi, hi] of touched) counts[mi][hi]--;
    }
  };

  recurse(0);

  console.log(`Every man meets every opposite seat between ${best.minMeet} and ${best.maxMeet} times`);
  console.log(`Total deviation from an even two-each: ${best.deviation} (12 is the proven floor)`);
  console.log(`Murray v Harris head-to-head: ${best.captains} rounds\n`);

  const updates = [];
  for (let ri = 0; ri < board.length; ri++) {
    const { round, murray, harris } = board[ri];
    const perm = PERMS[best.picks[ri]];
    console.log(`Round ${round.round_no}`);
    for (let i = 0; i < 3; i++) {
      const m = murray[i], h = harris[perm[i]];
      const left = `${player(m.player_a).first_name}/${player(m.player_b).first_name}`;
      const right = `${player(h.player_a).first_name}/${player(h.player_b).first_name}`;
      console.log(`   ${left.padEnd(20)} v ${right}`);
      const match = matches.find(x => x.round_id === round.id && x.murray_pairing_id === m.id);
      if (match) updates.push({ id: match.id, harris_pairing_id: h.id });
      else console.log('     ⚠ no match row');
    }
  }

  if (!apply) { console.log('\nDry run — pass --apply to write.'); return; }

  for (const u of updates) {
    const { error } = await db.from('matches').update({ harris_pairing_id: u.harris_pairing_id }).eq('id', u.id);
    if (error) throw error;
  }
  console.log(`\nApplied to ${updates.length} matches.`);
}

main().catch(err => { console.error(err); process.exit(1); });
