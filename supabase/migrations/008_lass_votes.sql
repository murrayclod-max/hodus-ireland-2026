-- ── Lass votes ───────────────────────────────────────────────────────────────

create table if not exists lass_votes (
  id         uuid primary key default gen_random_uuid(),
  lass_id    uuid not null references lass_of_the_day(id) on delete cascade,
  user_id    uuid not null references auth.users(id)      on delete cascade,
  vote       smallint not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  unique (lass_id, user_id)
);

create index if not exists lass_votes_lass_id_idx on lass_votes (lass_id);

-- RLS
alter table lass_votes enable row level security;

-- Anyone authenticated can read vote counts
create policy "read lass votes"
  on lass_votes for select
  using (auth.role() = 'authenticated');

-- Users can insert their own vote
create policy "insert own vote"
  on lass_votes for insert
  with check (auth.uid() = user_id);

-- Users can update their own vote
create policy "update own vote"
  on lass_votes for update
  using (auth.uid() = user_id);

-- Users can delete (unvote) their own vote
create policy "delete own vote"
  on lass_votes for delete
  using (auth.uid() = user_id);
