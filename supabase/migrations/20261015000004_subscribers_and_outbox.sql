-- 004: Subscribers and Outbox

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique check (length(email) <= 254),
  status subscriber_status not null default 'pending',
  confirm_token_hash bytea,
  confirm_expires_at timestamptz,
  last_confirm_sent_at timestamptz,
  consented_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text not null default 'web'
    check (source in ('web', 'admin_import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (status <> 'confirmed' or confirmed_at is not null),
  check (status <> 'unsubscribed' or unsubscribed_at is not null),
  check (confirm_token_hash is null or confirm_expires_at is not null)
);

create unique index subscribers_confirm_token_idx
  on subscribers (confirm_token_hash) where confirm_token_hash is not null;
create index subscribers_status_idx on subscribers (status);

create trigger subscribers_updated before update on subscribers
for each row execute function set_updated_at();

create table notifications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid unique references posts (id) on delete cascade,
  book_id uuid unique references books (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (num_nonnulls(post_id, book_id) = 1)
);

create table notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references notifications (id) on delete cascade,
  subscriber_id uuid not null references subscribers (id) on delete cascade,
  status delivery_status not null default 'queued',
  provider_message_id text,
  attempts smallint not null default 0 check (attempts >= 0),
  last_error text check (length(last_error) <= 500),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (notification_id, subscriber_id)
);

create index deliveries_pending_idx
  on notification_deliveries (notification_id, status)
  where status <> 'sent';
create index deliveries_subscriber_idx
  on notification_deliveries (subscriber_id);

create table email_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  type text not null check (length(type) <= 60),
  subscriber_id uuid references subscribers (id) on delete set null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index email_events_subscriber_idx on email_events (subscriber_id);
