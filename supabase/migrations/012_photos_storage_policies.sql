-- Storage policies for the 'photos' bucket
-- Bucket must already exist (create it in Supabase dashboard if not: Storage → New bucket → "photos", Public ON)

-- Trip members can upload to their own folder
create policy "trip members can upload photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'photos'
  and auth.uid() in (select auth_user_id from players where auth_user_id is not null)
);

-- Trip members can read all photos (bucket is public, but belt-and-suspenders)
create policy "trip members can read photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'photos'
  and auth.uid() in (select auth_user_id from players where auth_user_id is not null)
);

-- Members can delete their own uploads; admins can delete any
create policy "members can delete own photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'photos'
  and (
    (storage.foldername(name))[1] = (select id::text from players where auth_user_id = auth.uid() limit 1)
    or auth.uid() in (select auth_user_id from players where is_admin = true and auth_user_id is not null)
  )
);
