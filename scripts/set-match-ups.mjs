/**
 * Team pairings decide who you play WITH; the match-ups decide who you play
 * AGAINST. Every round was slot 1 v slot 1, so the captains drew each other
 * six times running and half the field never met.
 *
 * This leaves the pairings alone and re-points each match at a different
 * opposing pair, searching all 6^6 combinations for one where every Murray
 * man faces every Harris man at least once.
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
const key = (m, h) => `${m}|${h}`;

async function main() {
  const apply = process.argv.includes('--apply');

  const { data: players } = await db.from('players').select('id, name, first_name, team');
  const name = id => players.find(p => p.id === id).first_name;
  const full = id => players.find(p => p.id === id).name;

  const { data: rounds } = await db.from('rounds').select('id, round_no').gte('round_no', 1).order('round_no');
  const { data: pairings } = await db.from('pairings').select('id, round_id, team, slot, player_a, player_b');
  const { data: matches } = await db.from('matches').select('id, round_id, murray_pairing_id, harris_pairing_id');

  // Per round: the three Murray pairs and the three Harris pairs, by slot
  const board = rounds.map(r => ({
    round: r,
    murray: pairings.filter(p => p.round_id === r.id && p.team === 'murray').sort((a, b) => a.slot - b.slot),
    harris: pairings.filter(p => p.round_id === r.id && p.team === 'harris').sort((a, b) => a.slot - b.slot),
  }));

  // Every cross pairing that is actually possible, given Gulash leaves after
  // Round 3 and Cohen arrives for Round 4
  const possible = new Set();
  for (const { murray, harris } of board) {
    for (const m of murray) for (const h of harris) {
      for (const mp of [m.player_a, m.player_b]) for (const hp of [h.player_a, h.player_b]) possible.add(key(mp, hp));
    }
  }

  // Gulash plays Rounds 1–3 only and Cohen 4–6, which makes total coverage a
  // trap: the only schedules where all 42 happen force Mitchell to draw Harris
  // in all six rounds. Better to leave one match-up unplayed — and make it one
  // involving a man who's only here for half the trip.
  const PART_TIMERS = new Set(['Joe Gulash', 'Rob Cohen']);

  let best = null;
  const choice = new Array(board.length);

  const evaluate = () => {
    const counts = new Map();
    let captains = 0;
    for (let ri = 0; ri < board.length; ri++) {
      const { murray, harris } = board[ri];
      const perm = PERMS[choice[ri]];
      for (let i = 0; i < 3; i++) {
        const m = murray[i], h = harris[perm[i]];
        for (const mp of [m.player_a, m.player_b]) {
          for (const hp of [h.player_a, h.player_b]) {
            const k = key(mp, hp);
            counts.set(k, (counts.get(k) ?? 0) + 1);
            if (full(mp) === 'Dan Murray' && full(hp) === 'Dave Harris') captains++;
          }
        }
      }
    }
    const covered = counts.size;
    const maxMult = Math.max(...counts.values());
    const missing = [...possible].filter(k => !counts.has(k));
    const missingIsPartTimer = missing.every(k => k.split('|').some(id => PART_TIMERS.has(full(id))));

    // No one should face the same man more than three times; then cover as
    // many match-ups as possible; then let any gap fall on a part-timer; then
    // hold the captains to a single head-to-head
    return {
      score: [maxMult, -covered, missingIsPartTimer ? 0 : 1, Math.abs(captains - 1)],
      covered, maxMult, captains, missing,
    };
  };

  const cmp = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };

  const recurse = (ri) => {
    if (ri === board.length) {
      const r = evaluate();
      if (!best || cmp(r.score, best.score) < 0) best = { ...r, choice: [...choice] };
      return;
    }
    for (let p = 0; p < PERMS.length; p++) { choice[ri] = p; recurse(ri + 1); }
  };

  recurse(0);

  console.log(`Possible cross match-ups: ${possible.size}`);
  console.log(`Covered by best schedule: ${best.covered}`);
  console.log(`Most times any two men meet: ${best.maxMult}`);
  console.log(`Murray v Harris head-to-head: ${best.captains} round(s)`);
  for (const k of best.missing) console.log(`Never meet: ${k.split('|').map(full).join(' v ')}`);
  console.log();

  const updates = [];
  for (let ri = 0; ri < board.length; ri++) {
    const { round, murray, harris } = board[ri];
    const perm = PERMS[best.choice[ri]];
    console.log(`Round ${round.round_no}`);
    for (let i = 0; i < 3; i++) {
      const m = murray[i], h = harris[perm[i]];
      console.log(`   ${name(m.player_a)}/${name(m.player_b)}`.padEnd(22) + ` v ${name(h.player_a)}/${name(h.player_b)}`);
      const match = matches.find(x => x.round_id === round.id && x.murray_pairing_id === m.id);
      if (!match) { console.log('     ⚠ no match row'); continue; }
      updates.push({ id: match.id, harris_pairing_id: h.id });
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
