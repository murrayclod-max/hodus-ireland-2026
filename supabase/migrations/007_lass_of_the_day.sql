-- ── Lass of the Day ─────────────────────────────────────────────────────────

create table if not exists lass_of_the_day (
  id          uuid primary key default gen_random_uuid(),
  day_number  int  not null,
  profession  text not null,
  county      text not null,
  prompt      text,
  image_url   text,
  status      text not null default 'published'
                   check (status in ('published', 'pending', 'failed')),
  created_at  timestamptz not null default now()
);

create index if not exists lass_of_the_day_day_number_idx on lass_of_the_day (day_number);
create index if not exists lass_of_the_day_status_idx     on lass_of_the_day (status, created_at desc);

-- RLS
alter table lass_of_the_day enable row level security;

-- Any authenticated user (or viewer) can read published rows
create policy "read published lass"
  on lass_of_the_day for select
  using (status = 'published');

-- Only service role can insert/update (cron + admin API routes use service client)
-- No insert/update policy needed — service role bypasses RLS

-- ── Storage bucket ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lass-of-the-day',
  'lass-of-the-day',
  true,
  10485760,   -- 10 MB per image
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Public read on the bucket
create policy "public read lass-of-the-day"
  on storage.objects for select
  using (bucket_id = 'lass-of-the-day');
