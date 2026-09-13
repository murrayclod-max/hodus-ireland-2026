/**
 * Round 1 at Royal County Down: groups, course handicaps and strokes as set
 * on the day, tee times 1:30 / 1:40 / 1:50. Also puts the Portmarnock
 * appetizer back the way it was (these were applied there by mistake first).
 *
 * Run with: node scripts/set-rcd-groups.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: players } = await db.from('players').select('id, name');
const id = n => { const p = players.find(x => x.name === n); if (!p) throw new Error('unknown ' + n); return p.id; };

async function setRound(roundNo, teeTime, groups) {
  const { data: round } = await db.from('rounds').select('id').eq('round_no', roundNo).single();
  await db.from('rounds').update({ tee_time: teeTime }).eq('id', round.id);
  const { data: pairings } = await db.from('pairings').select('id, team, slot').eq('round_id', round.id);
  const { data: matches } = await db.from('matches').select('id, murray_pairing_id').eq('round_id', round.id);
  for (const g of groups) {
    const mp = pairings.find(p => p.team === 'murray' && p.slot === g.slot);
    const hp = pairings.find(p => p.team === 'harris' && p.slot === g.slot);
    await db.from('pairings').update({ player_a: id(g.murray[0]), player_b: id(g.murray[1]) }).eq('id', mp.id);
    await db.from('pairings').update({ player_a: id(g.harris[0]), player_b: id(g.harris[1]) }).eq('id', hp.id);
    const m = matches.find(x => x.murray_pairing_id === mp.id);
    await db.from('matches').update({ harris_pairing_id: hp.id, notes: g.note ?? null }).eq('id', m.id);
    console.log(`  R${roundNo} slot ${g.slot}: ${g.murray.join(' & ')} v ${g.harris.join(' & ')}${g.note ? '  [' + g.note.split(' · ').pop() + ']' : ''}`);
  }
}

// ── Portmarnock back to how it was ──────────────────────────────────────
await setRound(-1, '2:30 PM', [
  { slot: 1, murray: ['Dan Murray', 'Eric Strong'],    harris: ['Dave Harris', 'Galen Archibald'] },
  { slot: 2, murray: ['Jim Mitchell', 'Matt Burns'],   harris: ['Jeff Pinksa', 'Joe Gulash'] },
  { slot: 3, murray: ['Matt Hodus', 'Todd Moutafian'], harris: ['Jim Hughes', 'Lee Einhorn'] },
]);
await db.from('itinerary_items').update({ detail: '2:30pm · 11 players · Own arrangement · Pre-trip appetizer' })
  .eq('day_date', '2026-09-12').eq('kind', 'golf');

// ── Round 1, Royal County Down ──────────────────────────────────────────
await setRound(1, '1:30 PM', [
  { slot: 1, murray: ['Dan Murray', 'Matt Hodus'],     harris: ['Jeff Pinksa', 'Galen Archibald'],
    note: '1:30 · Murray (5) + Hodus (10) = 3.3 v Pinksa (8) + Archibald (13) = 4.8 · Pinksa/Archibald get 1.5' },
  { slot: 2, murray: ['Todd Moutafian', 'Matt Burns'], harris: ['Lee Einhorn', 'Dave Harris'],
    note: '1:40 · Einhorn (9) + Harris (14) = 5.3 v Moutafian (11) + Burns (12) = 5.7 · 0.4 apart, played scratch' },
  { slot: 3, murray: ['Jim Mitchell', 'Eric Strong'],  harris: ['Joe Gulash', 'Jim Hughes'],
    note: '1:50 · Mitchell (2) + Strong (9) = 2.1 v Gulash (4) + Hughes (11) = 3.1 · Gulash/Hughes get 1' },
]);
const { data: it } = await db.from('itinerary_items').update({
  detail: '1:30 / 1:40 / 1:50 · Murray & Hodus v Pinksa & Archibald (P/A get 1.5) · Moutafian & Burns v Einhorn & Harris (scratch) · Mitchell & Strong v Gulash & Hughes (G/H get 1) · 12 players',
}).eq('day_date', '2026-09-14').eq('kind', 'golf').select('title');
console.log('itinerary updated:', it?.map(i => i.title).join(', ') || 'no Sept 14 golf item found');
