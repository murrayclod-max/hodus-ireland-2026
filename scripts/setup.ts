/**
 * One-time setup script: creates Storage bucket + 12 auth users
 * Run: npx tsx scripts/setup.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const USERS = [
  // Admin captains
  { email: 'db_murray@me.com',      name: 'Dan Murray' },
  // Add the other 11 emails here once you have them.
  // Format: { email: 'player@email.com', name: 'Player Name' }
  // Placeholder emails (players change these in settings):
  { email: 'jim.mitchell@hodus2026.local',    name: 'Jim Mitchell' },
  { email: 'eric.strong@hodus2026.local',     name: 'Eric Strong' },
  { email: 'matt.hodus@hodus2026.local',      name: 'Matt Hodus' },
  { email: 'matt.burns@hodus2026.local',      name: 'Matt Burns' },
  { email: 'todd.moutafian@hodus2026.local',  name: 'Todd Moutafian' },
  { email: 'dave.harris@hodus2026.local',     name: 'Dave Harris' },
  { email: 'joe.gulash@hodus2026.local',      name: 'Joe Gulash' },
  { email: 'lee.einhorn@hodus2026.local',     name: 'Lee Einhorn' },
  { email: 'jim.hughes@hodus2026.local',      name: 'Jim Hughes' },
  { email: 'galen.archibald@hodus2026.local', name: 'Galen Archibald' },
  { email: 'jeff.pinkson@hodus2026.local',    name: 'Jeff Pinksa' },
];

const DEFAULT_PASSWORD = 'Hodus2026!';

async function createBucket() {
  const { error } = await supabase.storage.createBucket('photos', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  });
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
  console.log('✓ Storage bucket "photos" ready');
}

async function createUsers() {
  for (const u of USERS) {
    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });

    if (authErr) {
      console.log(`  ⚠ ${u.name}: ${authErr.message}`);
      continue;
    }

    const authUserId = authData.user.id;

    // Link to players row
    const { error: linkErr } = await supabase
      .from('players')
      .update({ auth_user_id: authUserId })
      .eq('name', u.name);

    if (linkErr) {
      console.log(`  ⚠ Could not link ${u.name}: ${linkErr.message}`);
    } else {
      console.log(`✓ ${u.name} → ${u.email} (linked)`);
    }
  }
}

async function main() {
  console.log('Setting up Hodus 2026…\n');
  await createBucket();
  await createUsers();
  console.log(`\nDone! Default password: ${DEFAULT_PASSWORD}`);
  console.log('Share this password with all players. They can change it in Settings.');
}

main().catch(console.error);
