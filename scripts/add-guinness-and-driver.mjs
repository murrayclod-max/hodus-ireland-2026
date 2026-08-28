/**
 * Adds the Guinness Storehouse booking (Fri 11 Sept, ref 904474457) to the
 * itinerary and stamps the coach driver's contact on the Sept 13 travel items.
 *
 * Run with: node scripts/add-guinness-and-driver.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const GUINNESS = {
  day_date: '2026-09-11',
  title: 'Guinness Storehouse Experience',
  detail: "2:45pm · St James's Gate, Dublin 8 · 9 guests · Booking ref 904474457 · Self-guided, ~90 mins · Arrive inside your 15-min slot · /tickets/guinness",
  kind: 'note',
  sort: 15,
};

const DRIVER = 'Virginius · +353 86 179 5648';

async function main() {
  const { data: existing } = await db
    .from('itinerary_items').select('id')
    .eq('day_date', GUINNESS.day_date).eq('title', GUINNESS.title).maybeSingle();

  if (existing) {
    await db.from('itinerary_items').update(GUINNESS).eq('id', existing.id);
    console.log('Updated Guinness Storehouse item');
  } else {
    await db.from('itinerary_items').insert(GUINNESS);
    console.log('Added Guinness Storehouse item');
  }

  const driverEdits = [
    {
      match: 'Meet driver at Grafton Hotel lobby',
      detail: `10:15am pickup · ${DRIVER} · Joe Gulash joins from airport (DL 292, arrives 10:00am)`,
    },
    {
      match: 'Hidden Links Luxury Coach',
      detail: `Sep 13–19 · Driver: ${DRIVER} · Members Lounge/19th Hole · Reclining seats, 4 tables, fridge, full A/C`,
    },
  ];

  for (const edit of driverEdits) {
    const { data, error } = await db
      .from('itinerary_items').update({ detail: edit.detail })
      .eq('title', edit.match).select('id');
    if (error) throw error;
    console.log(`Updated ${data.length} row(s): ${edit.match}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
