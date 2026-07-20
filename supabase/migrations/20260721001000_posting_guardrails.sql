-- Sprint 1: move the posting guardrails into the database (review findings C1-C5).
-- Until now the 12/day cap, 14-day cooldown and posting-day rules lived only in
-- client JavaScript computed from state loaded at page-open — breachable by two
-- tabs, two devices, a double-click, or a tab left open past midnight. From this
-- migration on, the database has the final word on every app-sourced insert.
--
-- Rules enforced here (app-sourced rows only; historical imports pass through):
--   1. posted_on must be "today" in Europe/London (kills stale-tab wrong-date logs)
--   2. hard cap: 12 app posts per London day
--   3. 14-day per-group cooldown counting ALL posting_log sources (incl. reconstructed)
--   4. group posting-day rules respected
--   5. one app post per group per day (unique index — double-click protection)
-- Plus log_posted(): the transactional "Posted ✓" path (posting_log insert +
-- scheduled_posts flip + composition use_count in one statement).

create or replace function public.london_today()
returns date language sql stable as
$$ select (now() at time zone 'Europe/London')::date $$;

create or replace function public.enforce_posting_guardrails()
returns trigger
language plpgsql
as $$
declare
  g record;
  cap_used integer;
  last_post date;
  dow text;
begin
  -- Guard only live app posts; imports/reconstructions are historical records.
  if new.source is distinct from 'app' then
    return new;
  end if;

  -- 1. Date must be today in Europe/London.
  if new.posted_on is distinct from public.london_today() then
    raise exception 'Refused: the app''s date (%) is stale — today is %. Reload the app and try again.',
      new.posted_on, public.london_today();
  end if;

  -- 2. Daily cap (app posts only).
  select count(*) into cap_used
  from public.posting_log
  where source = 'app' and posted_on = public.london_today();
  if cap_used >= 12 then
    raise exception 'Refused: 12/12 posts already logged today — cap reached, protect the account.';
  end if;

  if new.group_id is not null then
    -- 3. 14-day cooldown, counting every source (real history counts).
    select max(posted_on) into last_post
    from public.posting_log
    where group_id = new.group_id;
    if last_post is not null and (new.posted_on - last_post) < 14 then
      raise exception 'Refused: this group was posted to on % — % more day(s) of the 14-day cooldown left.',
        last_post, 14 - (new.posted_on - last_post);
    end if;

    -- 4. Posting-day rule.
    select name, posting_days into g from public.groups where id = new.group_id;
    if found and g.posting_days is not null and array_length(g.posting_days, 1) > 0 then
      dow := trim(to_char(new.posted_on, 'Dy'));  -- 'Mon', 'Tue', ...
      if not exists (
        select 1 from unnest(g.posting_days) pd
        where lower(pd) like lower(dow) || '%'
      ) then
        raise exception 'Refused: % only allows posting on % — today is %.',
          g.name, array_to_string(g.posting_days, '/'), dow;
      end if;
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists posting_guardrails on public.posting_log;
create trigger posting_guardrails
  before insert on public.posting_log
  for each row execute function public.enforce_posting_guardrails();

-- 5. One app post per group per day: double-click / racing-tab protection.
create unique index if not exists posting_log_one_per_group_day
  on public.posting_log (group_id, posted_on)
  where group_id is not null and source = 'app';

-- Transactional "Posted ✓": all three writes succeed or none do (fixes the
-- swallowed partial-failure that stranded queue jobs as pending forever).
-- posted_on is set server-side — the client cannot supply a stale date.
create or replace function public.log_posted(
  p_group_id uuid,
  p_group_name text,
  p_variation text,
  p_content_hash text,
  p_image_ref text default null,
  p_account text default null,
  p_scheduled_id uuid default null,
  p_composition_ids uuid[] default null
) returns public.posting_log
language plpgsql
as $$
declare
  r public.posting_log;
begin
  insert into public.posting_log
    (group_id, group_name, posted_on, variation, content_hash, image_ref, account, source)
  values
    (p_group_id, p_group_name, public.london_today(), p_variation, p_content_hash,
     p_image_ref, p_account, 'app')
  returning * into r;

  if p_scheduled_id is not null then
    update public.scheduled_posts set status = 'posted' where id = p_scheduled_id;
  end if;

  if p_composition_ids is not null and array_length(p_composition_ids, 1) > 0 then
    update public.compositions
    set use_count = use_count + 1
    where id = any(p_composition_ids);
  end if;

  return r;
end
$$;
