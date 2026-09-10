/**
 * Guest logins for the partners — same treatment as Eleanor: an auth user,
 * a players row flagged as a guest (RLS needs one), a temp password and a
 * forced reset on first sign-in. Guests never appear in the roster, the
 * pairing dropdowns or the flight list.
 *
 * Run with: node scripts/add-guests.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

export const TEMP_PASSWORD = 'Hodus2026!';

// Display names are best-effort from the addresses — rename in Admin
export const GUESTS = [
  { email: 'rchibaldbird@gmail.com',      name: "Galen's guest",  first_name: 'Guest',  of: 'Galen Archibald' },
  { email: 'annalinnhodus@gmail.com',     name: 'Anna Hodus',     first_name: 'Anna',   of: 'Matt Hodus' },
  { email: 'emily@jimhughesphoto.com',    name: 'Emily Hughes',   first_name: 'Emily',  of: 'Jim Hughes' },
  { email: 'sydney_sweeney@hotmail.com',  name: 'Sydney Sweeney', first_name: 'Sydney', of: 'Lee Einhorn' },
  { email: 'zoe@sidemarkstudio.com',      name: "Zoe — Jeff's guest", first_name: 'Zoe', of: 'Jeff Pinksa' },
  { email: 'agulash@gmail.com',           name: "Joe's guest",    first_name: 'Guest',  of: 'Joe Gulash' },
  { email: 'ksweetharris@hotmail.com',    name: "Dave's guest",   first_name: 'Guest',  of: 'Dave Harris' },
  { email: 'libbymitchell@yahoo.com',     name: 'Libby Mitchell', first_name: 'Libby',  of: 'Jim Mitchell' },
  { email: 'marceinhorn@gmail.com',       name: 'Marc Einhorn',   first_name: 'Marc',   of: 'Lee Einhorn' },
];

// Pass emails on the command line to touch only those; with none, all of them.
// Re-running for someone who has already changed their password would put the
// temp one back, so be deliberate.
const ONLY = process.argv.slice(2).map(e => e.toLowerCase());
const TARGETS = ONLY.length ? GUESTS.filter(g => ONLY.includes(g.email.toLowerCase())) : GUESTS;

async function main() {
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const { data: players } = await db.from('players').select('id, name, team').in('name', TARGETS.map(g => g.of));
  const teamOf = Object.fromEntries(players.map(p => [p.name, p.team]));

  for (const g of TARGETS) {
    let user = list.users.find(u => u.email?.toLowerCase() === g.email.toLowerCase());
    if (user) {
      await db.auth.admin.updateUserById(user.id, { password: TEMP_PASSWORD, email_confirm: true });
    } else {
      const { data, error } = await db.auth.admin.createUser({ email: g.email, password: TEMP_PASSWORD, email_confirm: true });
      if (error) throw new Error(`${g.email}: ${error.message}`);
      user = data.user;
    }

    const row = {
      name: g.name, first_name: g.first_name,
      team: teamOf[g.of] ?? 'murray',   // NOT NULL column; the guest flag keeps them off the team
      is_captain: false, is_admin: false, must_reset_password: true,
      auth_user_id: user.id, fun_facts: { guest: true, guest_of: g.of }, handicap_index: null,
    };
    const { data: existing } = await db.from('players').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (existing) await db.from('players').update(row).eq('id', existing.id);
    else { const { error } = await db.from('players').insert(row); if (error) throw error; }

    console.log(`${existing ? 'Updated' : 'Added  '} ${g.name.padEnd(20)} ${g.email.padEnd(30)} (guest of ${g.of})`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
