-- Hodus 2026 Ireland Trip Schema

-- Players
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  first_name text not null,
  handicap_index numeric(4,1),
  ghin text,
  team text not null check (team in ('murray','harris')),
  is_captain boolean not null default false,
  is_admin boolean not null default false,
  avatar_url text,
  bio text,
  home_club text,
  nickname text,
  phone text,
  fun_facts jsonb,
  created_at timestamptz not null default now()
);

-- Trip settings (singleton row, id=1)
create table if not exists trip_settings (
  id integer primary key default 1,
  buy_in numeric not null default 300,
  per_round numeric not null default 50,
  ace_pool_per_man numeric not null default 100,
  points_win numeric not null default 1,
  points_half numeric not null default 0.5,
  half_log_18 numeric not null default 0.5,
  half_log_18_tie numeric not null default 0.25,
  rules_md text,
  constraint singleton check (id = 1)
);

-- Courses
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  location text not null,
  par integer not null,
  yards integer not null,
  designer text,
  founded text,
  rail_color text not null default '#0E3B2E',
  crest_url text,
  signature_holes jsonb not null default '[]',
  notes_md text,
  sort integer not null default 0
);

-- Itinerary items
create table if not exists itinerary_items (
  id uuid primary key default gen_random_uuid(),
  day_date date not null,
  title text not null,
  detail text,
  kind text not null default 'note' check (kind in ('travel','golf','lodging','note')),
  sort integer not null default 0
);

-- Rounds (one per day of golf)
create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  round_no integer not null,
  course_id uuid not null references courses(id),
  play_date date not null,
  tee_time text not null,
  format text not null default 'fourball' check (format in ('fourball','altshot')),
  is_altshot boolean not null default false
);

-- Pairings (partners within each round per team)
create table if not exists pairings (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  team text not null check (team in ('murray','harris')),
  player_a uuid not null references players(id),
  player_b uuid not null references players(id),
  slot integer not null default 1
);

-- Matches (one per pairing matchup per round; 3 per round)
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  murray_pairing_id uuid references pairings(id) on delete set null,
  harris_pairing_id uuid references pairings(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','live','final')),
  closed_out_hole integer,
  murray_points numeric not null default 0,
  harris_points numeric not null default 0,
  notes text
);

-- Hole results for live match scoring
create table if not exists hole_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  hole integer not null check (hole between 1 and 18),
  result text check (result in ('murray','harris','halved')),
  unique(match_id, hole)
);

-- Flights
create table if not exists flights (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  direction text not null check (direction in ('out','return')),
  airline text,
  flight_no text,
  from_code text,
  to_code text,
  depart_at timestamptz,
  arrive_at timestamptz,
  notes text
);

-- Feed messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references players(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Photos
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references players(id) on delete cascade,
  storage_path text not null,
  caption text,
  round_id uuid references rounds(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Aces
create table if not exists aces (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  round_id uuid not null references rounds(id) on delete cascade,
  hole integer not null,
  note text,
  created_at timestamptz not null default now()
);
