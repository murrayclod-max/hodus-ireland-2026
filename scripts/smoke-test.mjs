/**
 * Signs in as a throwaway account and requests the real pages, because the
 * auth middleware turns every anonymous request into a redirect — which is
 * how a 500 hid behind a green build twice.
 *
 * Creates the account, checks the pages, deletes the account.
 *
 * Run with: node scripts/smoke-test.mjs [baseUrl]
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const BASE = process.argv[2] ?? 'https://hodus.mvgcwl.com';
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = new URL(URL_).hostname.split('.')[0];
const EMAIL = `smoke-${Date.now()}@hodus2026.local`;
const PASSWORD = 'SmokeTest!2026';

const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const PAGES = [
  '/', '/courses', '/courses/rcd', '/courses/annesley', '/courses/portrush',
  '/courses/rcd/guide', '/courses/portrush/guide', '/courses/annesley/guide',
  '/courses/rcd/guide/print', '/courses/annesley/guide/print?layout=flipbook',
  '/trip', '/match', '/packing', '/flights', '/players', '/weather', '/feed',
  '/tickets/guinness', '/settings',
];

async function main() {
  const { data: created, error: ce } = await admin.auth.admin.createUser({
    email: EMAIL, password: PASSWORD, email_confirm: true,
  });
  if (ce) throw ce;

  const { data: player, error: pe } = await admin.from('players').insert({
    name: 'Smoke Test', first_name: 'Smoke', team: 'murray',
    auth_user_id: created.user.id, fun_facts: { guest: true }, must_reset_password: false,
  }).select('id').single();
  if (pe) throw pe;

  try {
    const res = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const session = await res.json();
    if (!session.access_token) throw new Error('sign-in failed: ' + JSON.stringify(session));

    // How @supabase/ssr stores a session in a cookie
    const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;

    let bad = 0;
    for (const path of PAGES) {
      const r = await fetch(BASE + path, { headers: { cookie }, redirect: 'manual' });
      const flag = r.status === 200 ? '  ok ' : r.status < 400 ? ' redir' : ' FAIL';
      if (r.status >= 400) bad++;
      console.log(`${flag} ${String(r.status).padEnd(4)} ${path}`);
    }
    console.log(bad === 0 ? '\nAll pages returned 200.' : `\n${bad} page(s) failing.`);
    process.exitCode = bad === 0 ? 0 : 1;
  } finally {
    await admin.from('players').delete().eq('id', player.id);
    await admin.auth.admin.deleteUser(created.user.id);
    console.log('Test account removed.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
