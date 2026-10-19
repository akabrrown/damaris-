-- 007: Query Indexes

-- Home: newest published across all kinds
create index if not exists posts_home_idx
  on posts (published_at desc, id desc)
  where status = 'published';

-- Section index and previous/next within a kind
create index if not exists posts_kind_idx
  on posts (kind, published_at desc, id desc)
  where status = 'published';

-- Books page ordering
create index if not exists books_public_idx
  on books (sort_order, published_at desc)
  where status = 'published';
