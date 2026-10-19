-- 006: Row Level Security and Storage Configuration

alter table site_admins enable row level security;
alter table site_settings enable row level security;
alter table posts enable row level security;
alter table books enable row level security;
alter table subscribers enable row level security;
alter table notifications enable row level security;
alter table notification_deliveries enable row level security;
alter table email_events enable row level security;

-- Public content policies
create policy posts_public_read on posts
  for select to anon, authenticated using (status = 'published');
create policy posts_admin_all on posts
  for all to authenticated using (is_admin()) with check (is_admin());

create policy books_public_read on books
  for select to anon, authenticated using (status = 'published');
create policy books_admin_all on books
  for all to authenticated using (is_admin()) with check (is_admin());

create policy settings_public_read on site_settings
  for select to anon, authenticated using (true);
create policy settings_admin_update on site_settings
  for update to authenticated using (is_admin()) with check (is_admin());

-- Private operational data: admin only; anon has no policy and no grant.
create policy subscribers_admin on subscribers
  for all to authenticated using (is_admin()) with check (is_admin());
create policy notifications_admin on notifications
  for select to authenticated using (is_admin());
create policy deliveries_admin on notification_deliveries
  for select to authenticated using (is_admin());
create policy events_admin on email_events
  for select to authenticated using (is_admin());

revoke all on subscribers, notifications, notification_deliveries, email_events, site_admins from anon;

-- Storage configuration
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy media_admin_write on storage.objects
for all to authenticated
using (bucket_id = 'media' and public.is_admin())
with check (bucket_id = 'media' and public.is_admin());
