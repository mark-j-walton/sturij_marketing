-- Baseline schema replicated from production (project xscvfzfeepiakudshtod) on 2026-07-20.
-- Purpose: bring a fresh project (staging) to the exact live schema. Production already
-- has all of this via its 20 applied migrations; this file is the consolidated snapshot
-- and also serves as the repo's canonical schema record (the repo previously held only
-- the first of the 20 migrations).
-- Views are created WITH (security_invoker = on) — fixes the SECURITY DEFINER linter
-- errors present in production (they run with RLS of the querying user, as intended).

-- ============ TABLES ============

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size text,
  area text,
  url text,
  tier text not null default 'amber' check (tier = any (array['green','amber','red'])),
  avoid text[] not null default '{}',
  tags text[] not null default '{}',
  notes text,
  responses integer not null default 0,
  confirmed boolean not null default false,
  is_key boolean not null default false,
  image text,
  image_candidates text[] not null default '{}',
  context_summary text,
  tone integer not null default 50 check (tone >= 0 and tone <= 100),
  official_rules text,
  rules_updated timestamptz,
  posting_days text[] not null default '{}',
  posting_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fb_views integer,
  fb_viewers integer,
  fb_impressions integer,
  fb_engagement integer,
  fb_measured_at timestamptz,
  fb_source text,
  url_candidates text[] default '{}',
  archived_at timestamptz
);
create index if not exists groups_confirmed_idx on public.groups (confirmed);
create index if not exists groups_tier_idx on public.groups (tier);

create table if not exists public.posting_log (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete set null,
  group_name text,
  posted_on date not null,
  variation text,
  content_hash text,
  campaign text,
  image_ref text,
  source text,
  created_at timestamptz not null default now(),
  account text
);
create index if not exists posting_log_group_idx on public.posting_log (group_id);
create index if not exists posting_log_date_idx on public.posting_log (posted_on);

create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid,
  group_name text,
  planned_on date,
  variation text,
  content text,
  status text not null default 'pending' check (status = any (array['pending','posted','skipped'])),
  created_by text,
  created_at timestamptz not null default now(),
  image_ref text,
  composition_id uuid,
  area text
);
create index if not exists scheduled_posts_status_idx on public.scheduled_posts (status, planned_on);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  uploader text,
  storage_path text not null,
  thumb_path text,
  width integer,
  height integer,
  bytes integer,
  mime text,
  tags text[] not null default '{}',
  description text,
  photo_state text not null default 'raw' check (photo_state = any (array['raw','retouched','pro'])),
  cleared_for_public boolean not null default false,
  cleared_by text,
  cleared_at timestamptz,
  use_count integer not null default 0
);
create index if not exists photos_created_idx on public.photos (created_at desc);
create index if not exists photos_use_idx on public.photos (use_count desc);
create index if not exists photos_tags_idx on public.photos using gin (tags);

create table if not exists public.templates (
  id text primary key,
  name text not null,
  kind text not null,
  cols integer not null,
  "rows" integer not null,
  width integer not null,
  height integer not null,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  cells jsonb
);

create table if not exists public.compositions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author text,
  title text,
  template_id text references public.templates(id),
  cells jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  thumb_path text,
  image_path text,
  use_count integer not null default 0,
  "copy" text,
  enhanced_path text
);
create index if not exists compositions_created_idx on public.compositions (created_at desc);
create index if not exists compositions_tags_idx on public.compositions using gin (tags);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text,
  kind text not null default 'reel' check (kind = any (array['reel','upload'])),
  storage_path text not null,
  thumb_path text,
  source_photo_ids uuid[] default '{}',
  tags text[] default '{}',
  duration_ms integer,
  width integer,
  height integer,
  bytes bigint,
  mime text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  subcategory text,
  description text,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dna (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  slug text not null unique,
  tone boolean default false,
  body text,
  updated_at timestamptz default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kind text not null default 'bug' check (kind = any (array['bug','feedback','feature','backlog'])),
  title text not null,
  detail text,
  status text not null default 'open' check (status = any (array['open','in_progress','closed'])),
  reporter text,
  resolution text,
  closed_at timestamptz,
  triage_severity text,
  triage_summary text,
  triage_cause text,
  triaged_at timestamptz
);
create index if not exists support_tickets_status_idx on public.support_tickets (status);
create index if not exists support_tickets_created_idx on public.support_tickets (created_at desc);

create table if not exists public.restrictions (
  id uuid primary key default gen_random_uuid(),
  restricted_on date not null,
  severity text not null default 'temp_block' check (severity = any (array['temp_block','24_72h','7_day','14_day','30_day','permanent'])),
  duration_days integer,
  likely_trigger text,
  appealed boolean not null default false,
  appeal_outcome text check (appeal_outcome = any (array['reinstated','pending','denied'])),
  notes text,
  created_at timestamptz not null default now(),
  account text
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date,
  created_at timestamptz not null default now()
);

-- ============ VIEWS (security_invoker) ============

create or replace view public.v_daily_velocity with (security_invoker = on) as
  select posted_on, count(*) as posts, count(distinct group_id) as groups
  from public.posting_log group by posted_on order by posted_on desc;

create or replace view public.v_group_last_post with (security_invoker = on) as
  select g.id, g.name, g.tier, g.fb_views, max(pl.posted_on) as last_posted,
         current_date - max(pl.posted_on) as days_since
  from public.groups g join public.posting_log pl on pl.group_id = g.id
  group by g.id, g.name, g.tier, g.fb_views;

-- ============ RLS ============

do $$
declare t text;
begin
  foreach t in array array['groups','posting_log','scheduled_posts','photos','templates',
    'compositions','videos','themes','dna','support_tickets','restrictions','events']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$
      create policy "approved accounts" on public.%I
      as permissive for all to authenticated
      using ((auth.jwt() ->> 'email') = any (array['contact@sturij.com','mark.walton@gmail.com']))
      with check ((auth.jwt() ->> 'email') = any (array['contact@sturij.com','mark.walton@gmail.com']))
    $p$, t);
  end loop;
end $$;

-- ============ STORAGE ============

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos','photos', false, 220200960,
        array['image/jpeg','image/png','image/webp','video/webm','video/mp4','video/quicktime'])
on conflict (id) do nothing;

create policy "photos bucket approved select" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (auth.jwt() ->> 'email') = any (array['contact@sturij.com','mark.walton@gmail.com']));
create policy "photos bucket approved insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (auth.jwt() ->> 'email') = any (array['contact@sturij.com','mark.walton@gmail.com']));
create policy "photos bucket approved update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (auth.jwt() ->> 'email') = any (array['contact@sturij.com','mark.walton@gmail.com']))
  with check (bucket_id = 'photos' and (auth.jwt() ->> 'email') = any (array['contact@sturij.com','mark.walton@gmail.com']));
create policy "photos bucket approved delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (auth.jwt() ->> 'email') = any (array['contact@sturij.com','mark.walton@gmail.com']));
