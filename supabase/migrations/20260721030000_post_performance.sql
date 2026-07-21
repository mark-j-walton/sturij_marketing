-- Sprint 5: close the learning loop. Two days after a post is logged, the app
-- asks "how did it do?" — the answer lands here and refreshes the group's
-- reach fields, so tiers can be steered by evidence instead of hand-set once.
alter table public.posting_log
  add column if not exists perf_views integer,
  add column if not exists perf_engagement integer,
  add column if not exists perf_checked_at timestamptz;
