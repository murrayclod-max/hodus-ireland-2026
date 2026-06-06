# Hodus 2026 — Ireland Golf Trip App

Private trip app for 12 players: Northern Ireland & Donegal, Sept 13–20, 2026.

**Live:** https://hodus-ireland-2026.vercel.app  
**GitHub:** https://github.com/murrayclod-max/hodus-ireland-2026  
**Supabase project:** `gkvrjgrpaezknqmctncs`

---

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** — mobile-first, 390px primary target
- **Supabase** — Postgres + Auth + Storage
- **Vercel** — deployment

## Env vars (in `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://gkvrjgrpaezknqmctncs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Local dev

```bash
npm install
npm run dev
```

## Database

Migrations are in `supabase/migrations/`. To push changes:

```bash
supabase db push
```

To reset and re-seed from scratch:
```bash
supabase db reset --linked
```

## Auth users setup

All 12 players already created in Supabase Auth and linked to their `players` rows.

Default password: **`Hodus2026!`** — share this with each player.
They change it via Settings → (need to add password-change flow if desired).

To update a player's email (when you have their real email):
```bash
# Run in Supabase SQL editor
UPDATE auth.users SET email='real@email.com' WHERE email='jim.mitchell@hodus2026.local';
UPDATE players SET auth_user_id = (SELECT id FROM auth.users WHERE email='real@email.com') WHERE name='Jim Mitchell';
```

## One-time manual setup (Supabase dashboard)

1. Go to Authentication → URL Configuration at:  
   https://supabase.com/dashboard/project/gkvrjgrpaezknqmctncs/auth/url-configuration  
2. Set **Site URL** to: `https://hodus-ireland-2026.vercel.app`  
3. Add **Redirect URL**: `https://hodus-ireland-2026.vercel.app/auth/callback`

## Add to iPhone home screen

1. Open https://hodus-ireland-2026.vercel.app in **Safari**
2. Tap the Share button (box with arrow)
3. Tap **Add to Home Screen**
4. Name it "Hodus 2026" → **Add**

The app opens full-screen, no browser chrome, like a native app.

## Screens

| Tab | Route | What it does |
|-----|-------|-------------|
| Home | `/` | Countdown, live standings, next round card, quick links |
| Trip | `/trip` | Day-by-day itinerary (editable by admins) |
| Courses | `/courses` | Course list → detail (crest, par/yards, tee times, sig holes) |
| Match | `/match` | Team standings, per-round pairings, link to live scoring |
| Match scoring | `/match/[id]` | Hole-by-hole tap scoring, auto half-log on close-out |
| Flights | `/flights` | Per-player in/out flights + arrival window summary |
| Feed | `/feed` | Messages + photo uploads (Supabase Storage) |
| Players | `/players` | Roster grid → player profiles |
| Settings | `/settings` | Edit own profile + avatar |

## Match format (seeded in `trip_settings.rules_md`)

- **Fourball (better-ball) match play** · Rounds 1–5
- **Alternate shot** · Round 6 (Sat, St Patrick's)
- 1 pt win · ½ pt half · **Half-log**: closed-out match replays 18th for ½ pt (¼ if tied)
- **Ace pool**: $100/man = $1,200 total, straight to any hole-in-one

## Deploying updates

```bash
git push origin main   # Vercel auto-deploys from main
```

Or manual push:
```bash
vercel --prod
```
