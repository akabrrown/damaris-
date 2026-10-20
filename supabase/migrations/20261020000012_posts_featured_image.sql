-- 012: Add featured image support for posts (poetry, stories, reflections)

alter table posts add column if not exists featured_image_path text;
alter table posts add column if not exists featured_image_alt text;
alter table posts add column if not exists featured_image_caption text;

-- Check constraint for accessibility: alt text required if image is set
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'posts_featured_image_alt_check'
  ) then
    alter table posts add constraint posts_featured_image_alt_check
      check (featured_image_path is null or featured_image_alt is not null);
  end if;
end $$;
