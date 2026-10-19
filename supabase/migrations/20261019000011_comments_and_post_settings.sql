
-- 011: Comments Table and Post Comments Toggle Setting

-- 1. Add allow_comments column to posts if not already present
alter table posts add column if not exists allow_comments boolean not null default true;

-- 2. Create post_comments table
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_name text not null check (length(trim(author_name)) between 1 and 80),
  author_email text check (author_email is null or length(trim(author_email)) <= 254),
  content text not null check (length(trim(content)) between 1 and 2000),
  status text not null default 'approved' check (status in ('pending', 'approved', 'spam', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Trigger for updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'post_comments_updated'
  ) then
    create trigger post_comments_updated before update on post_comments
    for each row execute function set_updated_at();
  end if;
end $$;

-- 4. Indexes for optimal query speed
create index if not exists idx_post_comments_post_status on post_comments(post_id, status, created_at asc);
create index if not exists idx_post_comments_created_at on post_comments(created_at desc);

-- 5. Row Level Security
alter table post_comments enable row level security;

-- Drop any previous policies if re-running
drop policy if exists comments_public_read on post_comments;
drop policy if exists comments_public_insert on post_comments;
drop policy if exists comments_admin_all on post_comments;

-- Public read: Anyone can read approved comments for published posts where allow_comments is true
create policy comments_public_read on post_comments
  for select to anon, authenticated
  using (
    status = 'approved'
    and exists (
      select 1 from posts
      where posts.id = post_comments.post_id
      and posts.status = 'published'
      and posts.allow_comments = true
    )
  );

-- Public insert: Anyone can submit a comment on a published post with allow_comments = true
create policy comments_public_insert on post_comments
  for insert to anon, authenticated
  with check (
    status in ('pending', 'approved')
    and exists (
      select 1 from posts
      where posts.id = post_comments.post_id
      and posts.status = 'published'
      and posts.allow_comments = true
    )
  );

-- Admin management: Full access to select, update (moderate), delete comments
create policy comments_admin_all on post_comments
  for all to authenticated
  using (is_admin())
  with check (is_admin());
