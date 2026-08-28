/**
 * Itinerary corrections from Vari's pre-trip note:
 * the driver meets us at 10:00 (not 10:15) and there are refreshments
 * aboard the coach on day one.
 *
 * Run with: node scripts/packing-hidden-links-revisions.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

async function main() {
  const { data: pickup } = await db
    .from('itinerary_items')
    .update({ detail: '10:00am in the lobby · Virginius · +353 86 179 5648 · then out to the airport for Joe Gulash (DL 292, lands 10:00am)' })
    .eq('title', 'Meet driver at Grafton Hotel lobby').select('id');
  console.log(`Updated pickup time on ${pickup?.length ?? 0} row(s)`);

  const { data: coach } = await db
    .from('itinerary_items')
    .update({ detail: 'Sep 13–19 · Driver: Virginius · +353 86 179 5648 · Beer, soft drinks and snacks aboard on day one, compliments of Hidden Links · Members Lounge/19th Hole · Reclining seats, 4 tables, fridge, full A/C' })
    .eq('title', 'Hidden Links Luxury Coach').select('id');
  console.log(`Updated coach note on ${coach?.length ?? 0} row(s)`);
}

main().catch(err => { console.error(err); process.exit(1); });
