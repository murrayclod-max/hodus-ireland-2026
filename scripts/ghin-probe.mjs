/**
 * Raw GHIN scores response for one or more GHIN numbers, fetched through the
 * app's admin debug endpoint on production (the GHIN credentials live only in
 * Vercel). Creates a temporary admin login and removes it afterwards.
 *
 * Run with: node scripts/ghin-probe.mjs 444506 444527
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL, REF = new URL(URL_).hostname.split('.')[0];
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const email = `ghinprobe-${Date.now()}@hodus2026.local`, password = 'Probe!2026x';
const { data: u } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
const { data: p } = await admin.from('players').insert({ name: 'GHIN Probe', first_name: 'Probe', team: 'murray', auth_user_id: u.user.id, is_admin: true, fun_facts: { guest: true }, must_reset_password: false }).select('id').single();
try {
  const s = await (await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })).json();
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(s)).toString('base64')}`;
  for (const g of (process.argv.length > 2 ? process.argv.slice(2) : ['444527'])) {
    const r = await fetch(`https://hodus.mvgcwl.com/api/ghin/debug?ghin=${g}`, { headers: { cookie } });
    const txt = await r.text(); let d = null; try { d = JSON.parse(txt); } catch {}
    console.log(`\n=== ${g} → HTTP ${r.status} ===`);
    if (!d) { console.log(txt.slice(0, 300)); continue; }
    for (const [k, v] of Object.entries(d)) {
      if (v && typeof v === 'object') {
        const inner = Array.isArray(v) ? `array[${v.length}]` : Object.entries(v).map(([ik, iv]) => `${ik}:${Array.isArray(iv) ? 'array[' + iv.length + ']' : typeof iv}`).join(', ');
        console.log(`  ${k} → ${inner}`);
        const arr = Array.isArray(v) ? v : (v.scores ?? []);
        if (arr[0]) console.log('    first:', process.env.FULL ? JSON.stringify(arr[0]) : JSON.stringify(arr[0]).slice(0, 260));
        if (process.env.STATS && k === 'revision_scores') {
          for (const r of arr) console.log('    row:', JSON.stringify({ played_at: r.played_at, posted_at: r.posted_at, course: r.course_name ?? r.facility_name ?? r.ghin_course_name_display ?? null, type: r.score_type, holes: r.number_of_holes, ags: r.adjusted_gross_score, diff: r.differential, used: r.used }));
        }
      } else console.log(`  ${k} → ${JSON.stringify(v)}`);
    }
  }
} finally {
  await admin.from('players').delete().eq('id', p.id);
  await admin.auth.admin.deleteUser(u.user.id);
  console.log('\nprobe account removed');
}
