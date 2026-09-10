/**
 * Adds the Annesley Links at Royal County Down and the Amuse Bouche round on
 * Sunday 13 September, and reworks that day's travel:
 *   - coach leaves the Grafton an hour earlier, at 9:00
 *   - no airport detour: Gulash makes his own way to Newcastle
 *
 * Non-competition rounds are numbered below 1 so everything still sorts
 * chronologically: -1 is the Portmarnock appetizer, 0 the Annesley Amuse
 * Bouche. Neither number is ever displayed — see roundLabel() in lib/utils.
 *
 * Run with: node scripts/add-annesley-amuse-bouche.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const DESCRIPTION = `Like the much underrated Valley golf course at Royal Portrush, the Annesley at Royal County Down is often overlooked by visiting golfers when they make the pilgrimage to play one of the finest links layouts in the land.

It's a very short layout at only 4,548 yards from the back tees, which is hardly surprising when you consider there are no par five holes, only one par four measures in excess of 350 yards and six of the holes are par threes.

Nonetheless, it's a challenging test where your driver can remain in the locker room as you negotiate your way round the heaving fairways that twist and turn in the duneland beside the Championship course.

The best holes are found between the 5th and 15th holes where short, narrow fairways play to small, undulating greens — some visible, some blind — that are firm and fast enough to ensure the par of 66 is rarely matched.

Mackenzie & Ebert carried out a significant redesign of the Annesley course in 2015, adding three new holes around the turn, with the fairways of these holes routed through the towering dunes in the northeast corner of the property.`;

// 1:30, 1:40 and 1:50 off the first tee — Gulash in the last group
const GROUPS = [
  { slot: 1, tee: '1:30 PM', murray: ['Dan Murray', 'Eric Strong'],      harris: ['Dave Harris', 'Galen Archibald'] },
  { slot: 2, tee: '1:40 PM', murray: ['Jim Mitchell', 'Matt Burns'],     harris: ['Jim Hughes', 'Lee Einhorn'] },
  { slot: 3, tee: '1:50 PM', murray: ['Matt Hodus', 'Todd Moutafian'],   harris: ['Jeff Pinksa', 'Joe Gulash'] },
];

async function main() {
  const { data: players } = await db.from('players').select('id, name');
  const idOf = n => {
    const p = players.find(x => x.name === n);
    if (!p) throw new Error(`Unknown player: ${n}`);
    return p.id;
  };

  // ── Course ───────────────────────────────────────────────────────────────
  const { data: existing } = await db.from('courses').select('id').eq('slug', 'annesley').maybeSingle();

  const course = {
    slug: 'annesley',
    name: 'Annesley Links at Royal County Down',
    location: 'Newcastle, Co. Down',
    par: 66,
    yards: 4594,
    designer: 'Mackenzie & Ebert (2015 redesign)',
    rail_color: '#7A1A2B',            // shares Royal County Down's colours
    crest_url: '/medallions/rcd.png', // and its crest
    signature_holes: [],
    world_rank: 'The short course at Royal County Down',
    description: DESCRIPTION,
    sort: 2,
    tees: [
      { name: 'White',  yards: 4594, rating: 64.3, slope: 112, par: 66 },
      { name: 'Yellow', yards: 4397, rating: 63.7, slope: 106, par: 66 },
      { name: 'Red',    yards: 4218, rating: 63.2, slope: 107, par: 66 },
    ],
  };

  let courseId;
  if (existing) {
    await db.from('courses').update(course).eq('id', existing.id);
    courseId = existing.id;
    console.log('Updated course: Annesley');
  } else {
    // Slot it in just after Royal County Down
    for (const [slug, sort] of [['rcd', 1], ['portrush', 3], ['portstewart', 4], ['stpats', 5], ['otm', 6]]) {
      await db.from('courses').update({ sort }).eq('slug', slug);
    }
    const { data, error } = await db.from('courses').insert(course).select('id').single();
    if (error) throw error;
    courseId = data.id;
    console.log('Added course: Annesley Links at Royal County Down');
  }

  // ── Round ────────────────────────────────────────────────────────────────
  await db.from('rounds').update({ round_no: -1 }).eq('round_no', 0).eq('play_date', '2026-09-12');

  const { data: already } = await db.from('rounds').select('id').eq('play_date', '2026-09-13').maybeSingle();
  let roundId;
  if (already) {
    roundId = already.id;
    console.log('Amuse Bouche round already present');
  } else {
    const { data, error } = await db.from('rounds').insert({
      round_no: 0,
      course_id: courseId,
      play_date: '2026-09-13',
      tee_time: '1:30 PM',
      format: 'fourball',
      is_altshot: false,
      in_competition: false,
      selected_tee: 'White',
    }).select('id').single();
    if (error) throw error;
    roundId = data.id;
    console.log('Added the Amuse Bouche round');

    for (const g of GROUPS) {
      const made = {};
      for (const team of ['murray', 'harris']) {
        const { data: pair, error: pe } = await db.from('pairings').insert({
          round_id: roundId, team, slot: g.slot,
          player_a: idOf(g[team][0]), player_b: idOf(g[team][1]),
        }).select('id').single();
        if (pe) throw pe;
        made[team] = pair.id;
      }
      const { error: me } = await db.from('matches').insert({
        round_id: roundId, murray_pairing_id: made.murray, harris_pairing_id: made.harris, status: 'pending',
      });
      if (me) throw me;
      console.log(`  ${g.tee}  ${g.murray.join(' & ')} v ${g.harris.join(' & ')}`);
    }
  }

  // ── Sunday's itinerary ───────────────────────────────────────────────────
  const { data: sunday } = await db.from('itinerary_items').select('id, title').eq('day_date', '2026-09-13');
  const find = t => sunday.find(x => x.title === t);

  const edits = [
    ['Meet driver at Grafton Hotel lobby', {
      title: 'Meet driver at Grafton Hotel lobby',
      detail: '9:00am in the lobby · Virginius · +353 86 179 5648 · Straight north — no airport detour',
      sort: 1,
    }],
    ['Drive north to Newcastle', { detail: '1 hour 50 mins · Newcastle by about 10:50', sort: 2 }],
    ['Slieve Donard Resort & Spa, Newcastle', { sort: 4 }],
    ['Dinner at Villa Vinci', { sort: 6 }],
    ['ETA required for Northern Ireland entry', { sort: 7 }],
    ['Hidden Links Luxury Coach', { sort: 8 }],
  ];
  for (const [title, patch] of edits) {
    const row = find(title);
    if (!row) { console.log(`  ⚠ no itinerary row titled "${title}"`); continue; }
    await db.from('itinerary_items').update(patch).eq('id', row.id);
  }

  const additions = [
    {
      day_date: '2026-09-13', kind: 'travel', sort: 3,
      title: 'Joe Gulash — own transport to Newcastle',
      detail: 'DL 292 lands 10:00am · Makes his own way from Dublin Airport (about 2 hrs) · Meets the group at the Slieve Donard',
    },
    {
      day_date: '2026-09-13', kind: 'golf', sort: 5,
      title: 'Amuse Bouche — Annesley Links',
      detail: '1:30 / 1:40 / 1:50 tee times · Annesley Links at Royal County Down · Par 66, 4,594 yds off the White · Leave the driver in the locker · Does not count towards the match',
    },
  ];
  for (const item of additions) {
    if (find(item.title)) { console.log(`  already there: ${item.title}`); continue; }
    const { error } = await db.from('itinerary_items').insert(item);
    if (error) throw error;
    console.log(`  Added: ${item.title}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
