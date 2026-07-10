-- Group Ledger — initial schema
-- Implements GROUP_LEDGER_SCHEMA_1.md (architect spec, 10 July 2026) verbatim.
-- Matches the in-memory data model in artifacts/group_ledger.html.
-- No demo/[Example] data is seeded — the table starts empty and the real
-- ~325-group export is imported later via the app's existing Import flow.

-- Table: groups
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size text,
  area text,
  tier text not null default 'amber' check (tier in ('green', 'amber', 'red')),
  avoid text[] not null default '{}',
  tags text[] not null default '{}',
  notes text,
  responses integer not null default 0,
  confirmed boolean not null default false,
  is_key boolean not null default false,
  image text,
  image_candidates text[] not null default '{}',
  context_summary text,
  tone integer not null default 50 check (tone between 0 and 100),
  official_rules text,
  rules_updated timestamptz,
  posting_days text[] not null default '{}',
  posting_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index groups_confirmed_idx on groups (confirmed);
create index groups_tier_idx on groups (tier);

-- Table: events
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date,
  created_at timestamptz not null default now()
);

-- RLS — Polly/Mark's own working data, read/written directly through the UI.
-- Standard authenticated-user access. Revisit once there's more than one real
-- user (separate logins vs a shared workspace); don't over-build auth today.
alter table groups enable row level security;
alter table events enable row level security;

create policy "authenticated users full access" on groups
  for all using (auth.role() = 'authenticated');

create policy "authenticated users full access" on events
  for all using (auth.role() = 'authenticated');
