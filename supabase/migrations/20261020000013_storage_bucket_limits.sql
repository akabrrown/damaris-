-- 013: Storage bucket limits expansion and public read policy
-- Increases file size limit from 2 MB to 10 MB and adds avif/gif support
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
where id = 'media';

-- Ensure public read policy on storage.objects for media bucket
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'media_public_read'
  ) then
    create policy media_public_read on storage.objects
      for select to public
      using (bucket_id = 'media');
  end if;
end $$;
