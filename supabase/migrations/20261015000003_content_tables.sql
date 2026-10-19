-- 003: Content tables (site_settings, posts, books)

create table site_settings (
  id smallint primary key default 1 check (id = 1),
  site_title text not null check (length(site_title) between 1 and 120),
  tagline text check (length(tagline) <= 200),
  author_name text not null check (length(author_name) between 1 and 120),
  about_md text not null default '' check (length(about_md) <= 20000),
  about_photo_path text,
  about_photo_alt text,
  contact_email text check (length(contact_email) <= 254),
  social_links jsonb not null default '[]'::jsonb
    check (jsonb_typeof(social_links) = 'array'),
  updated_at timestamptz not null default now(),
  check (about_photo_path is null or about_photo_alt is not null)
);

create trigger site_settings_updated before update on site_settings
for each row execute function set_updated_at();

create table posts (
  id uuid primary key default gen_random_uuid(),
  kind post_kind not null,
  slug text not null
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text check (title is null or length(title) between 1 and 160),
  body_md text not null check (length(body_md) between 1 and 200000),
  excerpt text check (excerpt is null or length(excerpt) <= 300),
  attribution text check (attribution is null or length(attribution) <= 120),
  status publish_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (kind, slug),
  check (kind = 'quote' or title is not null),
  check (kind <> 'quote' or length(body_md) <= 600),
  check (kind = 'quote' or attribution is null),
  check (status = 'draft' or published_at is not null)
);

create trigger posts_stamp before insert or update on posts
for each row execute function stamp_published_at();

create trigger posts_updated before update on posts
for each row execute function set_updated_at();

create table books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(title) between 1 and 160),
  subtitle text check (length(subtitle) <= 200),
  synopsis_md text not null check (length(synopsis_md) <= 20000),
  excerpt_md text check (length(excerpt_md) <= 50000),
  cover_path text,
  cover_alt text,
  progress book_progress not null default 'upcoming',
  purchase_url text check (purchase_url is null or purchase_url ~ '^https://'),
  release_date date,
  sort_order integer not null default 0,
  status publish_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (cover_path is null or cover_alt is not null),
  check (status = 'draft' or published_at is not null)
);

create trigger books_stamp before insert or update on books
for each row execute function stamp_published_at();

create trigger books_updated before update on books
for each row execute function set_updated_at();
