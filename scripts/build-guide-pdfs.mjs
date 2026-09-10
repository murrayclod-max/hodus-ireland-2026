/**
 * Renders each field guide's print route to a PDF with headless Chrome.
 *
 * The route sits behind auth, so this signs in as a throwaway account,
 * fetches the rendered HTML with that session, makes the asset URLs
 * absolute, and prints the result. Output lands in public/guides/<slug>/
 * so the PDFs are downloadable from the app.
 *
 * Run with: node scripts/build-guide-pdfs.mjs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir, copyFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

dotenv.config({ path: '.env.local' });
const run = promisify(execFile);

const BASE = 'https://hodus.mvgcwl.com';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = new URL(SUPA).hostname.split('.')[0];
const GUIDES = ['rcd', 'portrush'];
const OUT = process.env.PDF_OUT ?? '/tmp/hodus-guides';

const admin = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function withSession(fn) {
  const email = `pdf-${Date.now()}@hodus2026.local`;
  const password = 'PdfBuild!2026';
  const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const { data: player } = await admin.from('players').insert({
    name: 'PDF Build', first_name: 'PDF', team: 'murray',
    auth_user_id: created.user.id, fun_facts: { guest: true }, must_reset_password: false,
  }).select('id').single();
  try {
    const res = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const session = await res.json();
    const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;
    return await fn(cookie);
  } finally {
    await admin.from('players').delete().eq('id', player.id);
    await admin.auth.admin.deleteUser(created.user.id);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });

  await withSession(async cookie => {
    const VARIANTS = [
      { name: 'print',   query: '' },
      { name: 'booklet', query: '?layout=booklet' },
    ];
    for (const slug of GUIDES) for (const { name, query } of VARIANTS) {
      const res = await fetch(`${BASE}/courses/${slug}/guide/print${query}`, { headers: { cookie } });
      if (!res.ok) throw new Error(`${slug} ${name}: HTTP ${res.status}`);
      let html = await res.text();

      // Chrome opens this from disk, so every root-relative URL needs the host
      html = html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`)
        .replace(/url\(\/(?!\/)/g, `url(${BASE}/`);

      const htmlPath = path.join(OUT, `${slug}-${name}.html`);
      const pdfPath = path.join(OUT, `${slug}-field-guide-${name}.pdf`);
      await writeFile(htmlPath, html);

      await run(CHROME, [
        '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
        '--run-all-compositor-stages-before-draw', '--virtual-time-budget=8000',
        `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`,
      ]);

      const dest = path.join('public', 'guides', slug, `field-guide-${name}.pdf`);
      await copyFile(pdfPath, dest);
      console.log(`${slug} ${name}: ${dest}`);
    }
  });
}

main().catch(err => { console.error(err); process.exit(1); });
