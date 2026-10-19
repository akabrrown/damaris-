-- 010: Audit Logs Table (Append-only security and activity trail)

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text not null check (length(actor_email) <= 254),
  action text not null check (length(action) <= 80),
  resource_type text not null check (resource_type in ('post', 'book', 'subscriber', 'settings', 'notification', 'security')),
  resource_id text check (length(resource_id) <= 100),
  metadata jsonb not null default '{}'::jsonb,
  ip_address text check (length(ip_address) <= 45),
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);
create index if not exists audit_logs_resource_type_idx on audit_logs (resource_type);
create index if not exists audit_logs_action_idx on audit_logs (action);

-- Enable Row Level Security (Append-only: no updates or deletes permitted)
alter table audit_logs enable row level security;

-- Admin read policy
create policy audit_logs_admin_select on audit_logs
  for select to authenticated using (is_admin());

-- Admin/Service insert policy
create policy audit_logs_admin_insert on audit_logs
  for insert to authenticated with check (is_admin());

-- Revoke all permissions from anonymous visitors
revoke all on audit_logs from anon;
