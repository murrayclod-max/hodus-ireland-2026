/**
 * Gives Eleanor Murray a login without putting her in the competition.
 *
 * RLS gates every table behind is_trip_member(), which means having a row in
 * players — so she gets one, flagged as a guest in fun_facts. isGuest() in
 * lib/utils keeps guests out of the roster, the pairing dropdowns and the
 * flight list.
 *
 * Run with: node scripts/add-guest-eleanor.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EMAIL = 'eleanor_jm@yahoo.com';
const TEMP_PASSWORD = 'imissmywife';

async function main() {
  // Is she already there?
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  let authUser = list.users.find(u => u.email?.toLowerCase() === EMAIL);

  if (authUser) {
    await db.auth.admin.updateUserById(authUser.id, { password: TEMP_PASSWORD, email_confirm: true });
    console.log('Auth user already existed — temp password reset');
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email: EMAIL,
      password: TEMP_PASSWORD,
      email_confirm: true, // no confirmation email needed; she has the password
    });
    if (error) throw error;
    authUser = data.user;
    console.log('Created auth user:', EMAIL);
  }

  const { data: existing } = await db
    .from('players').select('id').eq('name', 'Eleanor Murray').maybeSingle();

  const row = {
    name: 'Eleanor Murray',
    first_name: 'Eleanor',
    team: 'murray',            // column is NOT NULL; the guest flag keeps her off the team
    is_captain: false,
    is_admin: false,
    must_reset_password: true, // she'll be asked to choose her own on first login
    auth_user_id: authUser.id,
    fun_facts: { guest: true },
    handicap_index: null,
  };

  if (existing) {
    await db.from('players').update(row).eq('id', existing.id);
    console.log('Updated her player row');
  } else {
    const { error } = await db.from('players').insert(row);
    if (error) throw error;
    console.log('Added her player row (guest)');
  }

  console.log(`\n  Site:     https://hodus.mvgcwl.com`);
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${TEMP_PASSWORD}  (she'll be prompted to change it)`);
}

main().catch(err => { console.error(err); process.exit(1); });
