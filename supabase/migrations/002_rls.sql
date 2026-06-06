-- Enable RLS on all tables
alter table players         enable row level security;
alter table trip_settings   enable row level security;
alter table courses         enable row level security;
alter table itinerary_items enable row level security;
alter table rounds          enable row level security;
alter table pairings        enable row level security;
alter table matches         enable row level security;
alter table hole_results    enable row level security;
alter table flights         enable row level security;
alter table messages        enable row level security;
alter table photos          enable row level security;
alter table aces            enable row level security;

-- Helper: is the caller an authenticated trip member?
create or replace function is_trip_member()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from players where auth_user_id = auth.uid()
  );
$$;

-- Helper: is the caller an admin?
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from players where auth_user_id = auth.uid() and is_admin = true
  );
$$;

-- Helper: get the caller's player id
create or replace function my_player_id()
returns uuid language sql security definer stable as $$
  select id from players where auth_user_id = auth.uid() limit 1;
$$;

-- ── Players ──────────────────────────────────────────────────────
create policy "members can read players" on players
  for select using (is_trip_member());
create policy "player can update own row" on players
  for update using (auth_user_id = auth.uid());
create policy "admin can update any player" on players
  for update using (is_admin());

-- ── Trip settings ─────────────────────────────────────────────────
create policy "members can read trip_settings" on trip_settings
  for select using (is_trip_member());
create policy "admin can update trip_settings" on trip_settings
  for all using (is_admin());

-- ── Courses ───────────────────────────────────────────────────────
create policy "members can read courses" on courses
  for select using (is_trip_member());
create policy "admin can manage courses" on courses
  for all using (is_admin());

-- ── Itinerary ─────────────────────────────────────────────────────
create policy "members can read itinerary" on itinerary_items
  for select using (is_trip_member());
create policy "admin can manage itinerary" on itinerary_items
  for all using (is_admin());

-- ── Rounds ────────────────────────────────────────────────────────
create policy "members can read rounds" on rounds
  for select using (is_trip_member());
create policy "admin can manage rounds" on rounds
  for all using (is_admin());

-- ── Pairings ──────────────────────────────────────────────────────
create policy "members can read pairings" on pairings
  for select using (is_trip_member());
create policy "admin can manage pairings" on pairings
  for all using (is_admin());

-- ── Matches ───────────────────────────────────────────────────────
create policy "members can read matches" on matches
  for select using (is_trip_member());
create policy "members can update matches" on matches
  for update using (is_trip_member());
create policy "admin can manage matches" on matches
  for all using (is_admin());

-- ── Hole results ──────────────────────────────────────────────────
create policy "members can read hole_results" on hole_results
  for select using (is_trip_member());
create policy "members can upsert hole_results" on hole_results
  for all using (is_trip_member());

-- ── Flights ───────────────────────────────────────────────────────
create policy "members can read flights" on flights
  for select using (is_trip_member());
create policy "player can manage own flight" on flights
  for all using (player_id = my_player_id() or is_admin());

-- ── Messages ──────────────────────────────────────────────────────
create policy "members can read messages" on messages
  for select using (is_trip_member());
create policy "member can insert own message" on messages
  for insert with check (author_id = my_player_id());
create policy "member can delete own message" on messages
  for delete using (author_id = my_player_id() or is_admin());

-- ── Photos ────────────────────────────────────────────────────────
create policy "members can read photos" on photos
  for select using (is_trip_member());
create policy "member can insert own photo" on photos
  for insert with check (uploader_id = my_player_id());
create policy "member can delete own photo" on photos
  for delete using (uploader_id = my_player_id() or is_admin());

-- ── Aces ──────────────────────────────────────────────────────────
create policy "members can read aces" on aces
  for select using (is_trip_member());
create policy "admin can manage aces" on aces
  for all using (is_admin());
