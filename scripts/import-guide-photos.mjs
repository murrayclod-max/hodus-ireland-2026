/**
 * Drops a folder of hole screenshots into public/guides/<slug>/ as
 * hole-1.jpg … hole-18.jpg, resized to 900px tall. Files are taken in
 * numeric order of the first number in each filename ("IMG_3-hole.png" is
 * hole 3), or alphabetically if none have numbers.
 *
 * Run with: node scripts/import-guide-photos.mjs <slug> <folder>
 */
import { readdir, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const [slug, folder] = process.argv.slice(2);
if (!slug || !folder) { console.error('usage: node scripts/import-guide-photos.mjs <slug> <folder>'); process.exit(1); }

const files = (await readdir(folder)).filter(f => /\.(png|jpe?g|heic|tiff?)$/i.test(f));
const num = f => { const m = f.match(/(\d+)/); return m ? parseInt(m[1], 10) : null; };
const ordered = files.every(f => num(f) !== null)
  ? files.sort((a, b) => num(a) - num(b))
  : files.sort();

if (ordered.length !== 18) console.warn(`⚠ ${ordered.length} images found, expected 18`);

const out = path.join('public', 'guides', slug);
await mkdir(out, { recursive: true });
for (let i = 0; i < ordered.length; i++) {
  const dest = path.join(out, `hole-${i + 1}.jpg`);
  await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '74', '-Z', '900', path.join(folder, ordered[i]), '--out', dest]);
  console.log(`hole-${i + 1}.jpg  ←  ${ordered[i]}`);
}
console.log(`\nNow set photos: true in lib/guides/${slug}.ts and rebuild the PDFs.`);
