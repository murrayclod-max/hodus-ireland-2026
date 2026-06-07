-- GHIN index history and recent rounds (mirrors oominv schema)

create table if not exists player_indexes (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  revision_date date not null,
  index_value   numeric(4,1) not null,
  source        text not null default 'ghin',
  unique(player_id, revision_date)
);

create table if not exists ghin_recent_rounds (
  id                   uuid primary key default gen_random_uuid(),
  player_id            uuid not null references players(id) on delete cascade,
  date_played          date not null,
  course_name          text not null,
  course_rating        numeric(4,1) not null,
  slope_rating         integer not null,
  gross_score          integer not null,
  adjusted_gross_score integer not null,
  differential         numeric(5,1) not null,
  raw                  jsonb,
  fetched_at           timestamptz not null default now(),
  unique(player_id, date_played, course_name)
);

-- RLS
alter table player_indexes     enable row level security;
alter table ghin_recent_rounds enable row level security;

create policy "members can read player_indexes" on player_indexes
  for select using (is_trip_member());

create policy "members can read ghin_recent_rounds" on ghin_recent_rounds
  for select using (is_trip_member());
