import { readFileSync } from 'fs';

// Load env vars from .env.local
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const GHIN_API = 'https://api2.ghin.com/api/v1';
const GHIN = '444527';

// Login
const loginRes = await fetch(`${GHIN_API}/golfer_login.json`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
  body: JSON.stringify({
    user: { email_or_ghin: env.GHIN_EMAIL, password: env.GHIN_PASSWORD, remember_me: false },
    token: 'nonce', source: 'GHINcom',
  }),
});
const loginData = await loginRes.json();
const token = loginData.golfer_user?.golfer_user_token ?? loginData.golfer_user_token;
if (!token) { console.error('Login failed:', JSON.stringify(loginData)); process.exit(1); }
console.log('✓ Logged in\n');

// Fetch scores
const scoresRes = await fetch(`${GHIN_API}/golfers/${GHIN}/scores.json?per_page=5&page=1`, {
  headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
});
const data = await scoresRes.json();

// Print top-level keys
console.log('Top-level keys:', Object.keys(data));

// Print first score from each section
for (const section of ['revision_scores', 'recent_scores', 'scores']) {
  const rows = data[section]?.scores ?? (Array.isArray(data[section]) ? data[section] : null);
  if (rows?.length) {
    console.log(`\n--- ${section} (first row keys) ---`);
    console.log('Keys:', Object.keys(rows[0]));
    console.log('First row:', JSON.stringify(rows[0], null, 2));
  } else {
    console.log(`\n--- ${section}: empty or missing ---`);
  }
}
