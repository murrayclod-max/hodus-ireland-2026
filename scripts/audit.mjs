/**
 * Pre-flight audit: signs in as a throwaway account and requests EVERY page
 * the app can serve — static routes, every course, every player, every
 * match scoring page, the guides in all print layouts — then HEAD-checks
 * every static asset the database and guides point at.
 *
 * Run with: node scripts/audit.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readdirSync } from 'node:fs';

dotenv.config({ path: '.env.local' });
const BASE = 'https://hodus.mvgcwl.com';
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = new URL(URL_).hostname.split('.')[0];
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const email = `audit-${Date.now()}@hodus2026.local`, password = 'Audit!2026x';
const { data: u } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
const { data: me } = await admin.from('players').insert({ name: 'Audit Bot', first_name: 'Audit', team: 'murray', auth_user_id: u.user.id, is_admin: true, fun_facts: { guest: true }, must_reset_password: false }).select('id').single();

try {
  const sess = await (await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })).json();
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(sess)).toString('base64')}`;

  const q = async (name, p) => { const { data, error } = await p; if (error || !data) throw new Error(`${name}: ${error?.message ?? 'no data'}`); return data; };
  const [courses, players, rounds] = await Promise.all([
    q('courses', admin.from('courses').select('slug, crest_url')),
    q('players', admin.from('players').select('id, avatar_url, fun_facts')),
    q('rounds', admin.from('rounds').select('id')),
  ]);
  const realPlayers = players.filter(p => !p.fun_facts?.guest);

  const pages = [
    '/', '/trip', '/courses', '/match', '/lass', '/weather', '/flights', '/feed', '/players', '/trends',
    '/settings', '/packing', '/tickets/guinness', '/admin', '/audit', '/trip/new',
    ...courses.map(c => `/courses/${c.slug}`),
    ...['rcd', 'portrush', 'annesley'].flatMap(s => [`/courses/${s}/guide`, `/courses/${s}/guide/print`, `/courses/${s}/guide/print?layout=booklet`, `/courses/${s}/guide/print?layout=flipbook`]),
    ...realPlayers.map(p => `/players/${p.id}`),
    ...rounds.map(r => `/match/${r.id}`),   // scoring pages are keyed by round
  ];

  let bad = 0;
  for (const path of pages) {
    const r = await fetch(BASE + path, { headers: { cookie }, redirect: 'manual' });
    if (r.status !== 200) { bad++; console.log(`  FAIL ${r.status}  ${path}`); }
  }
  console.log(`pages: ${pages.length} requested, ${pages.length - bad} ok, ${bad} failing`);

  // Static assets referenced by data and guides
  const assets = new Set([
    ...courses.flatMap(c => [c.crest_url, `/banners/${c.slug}.png`].filter(Boolean)),
    ...realPlayers.map(p => p.avatar_url).filter(Boolean),
    '/hodus-flag.png', '/manifest.json', '/sw.js', '/map/route_map.png',
    ...['rcd', 'portrush'].flatMap(s => Array.from({ length: 18 }, (_, i) => `/guides/${s}/hole-${i + 1}.jpg`)),
    ...['rcd', 'portrush', 'annesley'].flatMap(s => ['print', 'booklet', 'flipbook'].map(v => `/guides/${s}/field-guide-${v}.pdf`)),
    ...readdirSync('public/tickets/guinness').map(f => `/tickets/guinness/${f}`),
  ]);
  let badAssets = 0;
  for (const a of assets) {
    const url = a.startsWith('http') ? a : BASE + a;
    const r = await fetch(url, { method: 'HEAD', headers: { cookie }, redirect: 'manual' });
    if (r.status !== 200) { badAssets++; console.log(`  MISSING ${r.status}  ${a}`); }
  }
  console.log(`assets: ${assets.size} checked, ${badAssets} missing`);
  process.exitCode = bad + badAssets ? 1 : 0;
} finally {
  await admin.from('players').delete().eq('id', me.id);
  await admin.auth.admin.deleteUser(u.user.id);
}
