-- Sprint 2: the allowlist becomes data, not code.
-- approved_users drives RLS on every table, the storage bucket, and the Edge
-- Functions. Adding a tester is now a row insert from the Testers panel — no
-- migration, no redeploy. Roles: owner (manages testers), operator, tester.
-- The two founding accounts are seeded and every existing policy is re-pointed
-- at is_approved(). The helper functions are SECURITY DEFINER so the allowlist
-- lookup itself never recurses through RLS.

create table if not exists public.approved_users (
  email text primary key,
  role text not null default 'tester' check (role in ('owner','operator','tester')),
  active boolean not null default true,
  added_by text,
  created_at timestamptz not null default now()
);

insert into public.approved_users (email, role, added_by) values
  ('contact@sturij.com',    'owner', 'migration'),
  ('mark.walton@gmail.com', 'owner', 'migration')
on conflict (email) do nothing;

create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.approved_users
                 where lower(email) = lower(coalesce(auth.jwt()->>'email','')) and active) $$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.approved_users
                 where lower(email) = lower(coalesce(auth.jwt()->>'email','')) and active and role = 'owner') $$;

alter table public.approved_users enable row level security;
drop policy if exists "approved can read allowlist" on public.approved_users;
create policy "approved can read allowlist" on public.approved_users
  for select to authenticated using (public.is_approved());
drop policy if exists "owners manage allowlist" on public.approved_users;
create policy "owners manage allowlist" on public.approved_users
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Re-point every table policy from the hardcoded email array to the table.
do $$
declare t text;
begin
  foreach t in array array['groups','posting_log','scheduled_posts','photos','templates',
    'compositions','videos','themes','dna','support_tickets','restrictions','events']
  loop
    execute format('drop policy if exists "approved accounts" on public.%I', t);
    execute format($p$
      create policy "approved accounts" on public.%I
      as permissive for all to authenticated
      using (public.is_approved()) with check (public.is_approved())
    $p$, t);
  end loop;
end $$;

-- Storage bucket policies likewise.
drop policy if exists "photos bucket approved select" on storage.objects;
drop policy if exists "photos bucket approved insert" on storage.objects;
drop policy if exists "photos bucket approved update" on storage.objects;
drop policy if exists "photos bucket approved delete" on storage.objects;
create policy "photos bucket approved select" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_approved());
create policy "photos bucket approved insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_approved());
create policy "photos bucket approved update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.is_approved())
  with check (bucket_id = 'photos' and public.is_approved());
create policy "photos bucket approved delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_approved());
