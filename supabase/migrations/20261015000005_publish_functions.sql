-- 005: Transactional Publish Functions

create or replace function publish_post(p_id uuid, p_notify boolean default true)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_notification uuid;
begin
  if not is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update posts set status = 'published'
  where id = p_id and status = 'draft';
  if not found then
    raise exception 'post not found or not a draft' using errcode = 'P0002';
  end if;

  if p_notify then
    insert into notifications (post_id) values (p_id)
    on conflict (post_id) do nothing
    returning id into v_notification;
  end if;

  return v_notification;
end $$;

revoke execute on function publish_post(uuid, boolean) from public, anon;
grant execute on function publish_post(uuid, boolean) to authenticated;

create or replace function publish_book(p_id uuid, p_notify boolean default true)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_notification uuid;
begin
  if not is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update books set status = 'published'
  where id = p_id and status = 'draft';
  if not found then
    raise exception 'book not found or not a draft' using errcode = 'P0002';
  end if;

  if p_notify then
    insert into notifications (book_id) values (p_id)
    on conflict (book_id) do nothing
    returning id into v_notification;
  end if;

  return v_notification;
end $$;

revoke execute on function publish_book(uuid, boolean) from public, anon;
grant execute on function publish_book(uuid, boolean) to authenticated;
