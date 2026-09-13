/**
 * Sun 13 Sept — the Amuse Bouche on the Annesley at 1:30 / 1:40 / 1:50, with
 * the groups, course handicaps and strokes agreed on the day. Round 1 goes
 * back to the Hidden Links schedule: Royal County Down, Mon 14 Sept, 9:22,
 * with the rotation pairings (these groups had been applied there by mistake).
 *
 * Run with: node scripts/set-amuse-bouche-groups.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: players } = await db.from('players').select('id, name');
const id = n => { const p = players.find(x => x.name === n); if (!p) throw new Error('unknown ' + n); return p.id; };

async function setRound(roundNo, patch, groups) {
  const { data: round } = await db.from('rounds').select('id').eq('round_no', roundNo).single();
  await db.from('rounds').update(patch).eq('id', round.id);
  const { data: pairings } = await db.from('pairings').select('id, team, slot').eq('round_id', round.id);
  const { data: matches } = await db.from('matches').select('id, murray_pairing_id').eq('round_id', round.id);
  for (const g of groups) {
    const mp = pairings.find(p => p.team === 'murray' && p.slot === g.slot);
    await db.from('pairings').update({ player_a: id(g.murray[0]), player_b: id(g.murray[1]) }).eq('id', mp.id);
    const hrow = pairings.find(p => p.team === 'harris' && p.slot === g.slot);
    await db.from('pairings').update({ player_a: id(g.harrisBySlot[0]), player_b: id(g.harrisBySlot[1]) }).eq('id', hrow.id);
  }
  // match-ups: which harris slot each murray slot plays
  for (const g of groups) {
    const mp = pairings.find(p => p.team === 'murray' && p.slot === g.slot);
    const hp = pairings.find(p => p.team === 'harris' && p.slot === g.plays);
    const m = matches.find(x => x.murray_pairing_id === mp.id);
    await db.from('matches').update({ harris_pairing_id: hp.id, notes: g.note ?? null }).eq('id', m.id);
    console.log(`  R${roundNo} ${g.murray.join(' & ')} v ${groups.find(x => x.slot === g.plays).harrisBySlot.join(' & ')}${g.note ? '  [' + g.note.split(' · ').pop() + ']' : ''}`);
  }
}

// ── Amuse Bouche today: groups as agreed ────────────────────────────────
await setRound(0, { play_date: '2026-09-13', tee_time: '1:30 PM' }, [
  { slot: 1, murray: ['Dan Murray', 'Matt Hodus'],     harrisBySlot: ['Jeff Pinksa', 'Galen Archibald'], plays: 1,
    note: '1:30 · Murray (5) + Hodus (10) = 3.3 v Pinksa (8) + Archibald (13) = 4.8 · Pinksa/Archibald get 1.5' },
  { slot: 2, murray: ['Todd Moutafian', 'Matt Burns'], harrisBySlot: ['Lee Einhorn', 'Dave Harris'], plays: 2,
    note: '1:40 · Einhorn (9) + Harris (14) = 5.3 v Moutafian (11) + Burns (12) = 5.7 · 0.4 apart, played scratch' },
  { slot: 3, murray: ['Jim Mitchell', 'Eric Strong'],  harrisBySlot: ['Joe Gulash', 'Jim Hughes'], plays: 3,
    note: '1:50 · Mitchell (2) + Strong (9) = 2.1 v Gulash (4) + Hughes (11) = 3.1 · Gulash/Hughes get 1' },
]);

// ── Round 1 back to the schedule and the rotation ───────────────────────
// Murray R1: Murray/Burns, Moutafian/Strong, Mitchell/Hodus
// Harris R1: Harris/Gulash, Einhorn/Hughes, Archibald/Pinksa
// Match-ups (set-match-ups.mjs): Murray/Burns v Harris/Gulash · Moutafian/Strong v Archibald/Pinksa · Mitchell/Hodus v Einhorn/Hughes
await setRound(1, { play_date: '2026-09-14', tee_time: '9:22 AM' }, [
  { slot: 1, murray: ['Dan Murray', 'Matt Burns'],      harrisBySlot: ['Dave Harris', 'Joe Gulash'],      plays: 1 },
  { slot: 2, murray: ['Todd Moutafian', 'Eric Strong'], harrisBySlot: ['Lee Einhorn', 'Jim Hughes'],       plays: 3 },
  { slot: 3, murray: ['Jim Mitchell', 'Matt Hodus'],    harrisBySlot: ['Galen Archibald', 'Jeff Pinksa'],  plays: 2 },
]);

// ── Itinerary ───────────────────────────────────────────────────────────
await db.from('itinerary_items').update({
  title: 'Amuse Bouche — Annesley Links',
  detail: '1:30 / 1:40 / 1:50 · Murray & Hodus v Pinksa & Archibald (P/A get 1.5) · Moutafian & Burns v Einhorn & Harris (scratch) · Mitchell & Strong v Gulash & Hughes (G/H get 1) · Does not count towards the match',
}).eq('day_date', '2026-09-13').eq('kind', 'golf');
await db.from('itinerary_items').update({
  title: 'Royal County Down — Round 1',
  detail: '9:22am · 12 players · Course next door · Match play starts here',
}).eq('day_date', '2026-09-14').eq('kind', 'golf');

const { data: r } = await db.from('rounds').select('round_no, play_date, tee_time, courses(name)').in('round_no', [-1, 0, 1]).order('play_date');
for (const x of r) console.log(' ', x.play_date, x.tee_time.padEnd(8), 'R' + x.round_no, x.courses.name);
