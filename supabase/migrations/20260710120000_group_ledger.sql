-- Group Ledger — schema for the sturij-marketing Supabase project.
-- Reflects the LIVE database exactly (applied via MCP 10 Jul 2026):
-- schema + proving-ground access (anon role; the static site talks to the DB
-- with the anon key, and the moat is protected by Vercel deployment protection
-- at the edge). Graduate to an email-allowlist + login when this becomes
-- Polly's real daily tool. No demo/[Example] data — the table starts empty.

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null, size text, area text, url text,
  tier text not null default 'amber' check (tier in ('green','amber','red')),
  avoid text[] not null default '{}', tags text[] not null default '{}',
  notes text, responses integer not null default 0,
  confirmed boolean not null default false, is_key boolean not null default false,
  image text, image_candidates text[] not null default '{}',
  context_summary text, tone integer not null default 50 check (tone between 0 and 100),
  official_rules text, rules_updated timestamptz,
  posting_days text[] not null default '{}', posting_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index groups_confirmed_idx on groups (confirmed);
create index groups_tier_idx on groups (tier);

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null, event_date date, created_at timestamptz not null default now()
);

alter table groups enable row level security;
alter table events enable row level security;
create policy "proving-ground full access" on groups for all to anon, authenticated using (true) with check (true);
create policy "proving-ground full access" on events for all to anon, authenticated using (true) with check (true);
