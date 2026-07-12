# Sprint Spec — Phase 2b: Today's Run (the daily driver)

**Role split:** Architect (Claude — spec + validation) → Executor (branch, draft PR) → Human (Mark, merges). Nothing auto-posts.
**Repo:** `mark-j-walton/sturij_marketing` · **DB:** Supabase `xscvfzfeepiakudshtod` · **Deploy:** `marketing.sturij.com`.
**Base:** off latest `main`, e.g. `claude/2b-todays-run`. **Depends on 2a** (groups need url + rule to run). Re-ground first.

---

## 0. Standing guardrail

**The app prepares; the human posts.** AI may draft copy, assemble the run, select images — everything up to the clipboard. **The physical paste into Facebook is the human handover.** The app never posts, never auto-fires; no FB browser automation. **"Posted ✓" is a log entry only** — the human asserting they pasted. **Do NOT change RLS** (authenticated + the two approved emails; anon no access).

## 1. Goal / DoD

Turn the daily plan into a smooth **guided paste queue**: one focused window that walks Polly through today's safe posts, one at a time, with the prepared copy + the group link + its rules right together — so copy→paste→log→next is frictionless. Done = a Run generates from the Plan, each step outputs copy-paste-ready content, "Posted ✓" writes a real `posting_log` row and advances, and the guardrails govern the whole queue. Nothing is posted by the app.

## 2. The Run

New **Run** ("Today's Run") tab in the rail.

**Build the queue from the Plan** — the existing safe today-list: greens-first, under the **12/day cap**, **rule-locked groups only on their allowed day**, groups in **14-day cooldown excluded**. Header: **"N posts today · X of N done"**.

**One group at a time (stepper).** Each step shows:
1. **Candidate drafts (×3) — remix + select.** AI prepares 3 copy drafts for *this* group (DNA + group context/tone; preparation = allowed). **Remix regenerates variations — lock the ones you like, remix the rest (works while ≥1 stays editable).** You **pick one of the 3** when happy; all are **editable**.
2. **Mode toggle — `Post` | `A/B test`:**
   - **Post:** select **one** draft → **Copy** → output the single post.
   - **A/B test:** select **two** → **first = A, second = B** → output both, labelled A/B, for you to set up Facebook's A/B (Facebook runs the test; the app only outputs the two).
3. **Image** (if attached) — preview + a way to grab it. *(Minimal this phase — a single image via URL/attach; full creation = Phase 3.)*
4. **Group + `Open group ↗`** (its real `url`) — you click, paste, post by hand.
5. **Instructions inline** — the group's rule (`posting_days`/`official_rules`) + any `avoid`/`posting_note`, so the paster follows them.
6. **Post preview** — a **simulated Facebook post** (montage + copy as it'll look in-feed: page avatar/name, image, copy, feed chrome). Visual mock only, not connected to FB.
7. **Tweak + `Posted ✓ — next`** → the ad copy stays **editable right up to save**; `Posted ✓` writes `posting_log` and loads the next step.

## 3. Logging & guardrails (the whole point)

- **`Posted ✓` inserts a `posting_log` row:** `group_id, group_name, posted_on=today, variation, content_hash, image_ref, account=<signed-in email>, source='app'`.
- **A/B = ONE posting event → ONE row, counts ONCE** against the cap and starts one cooldown. Record both variants (e.g. `variation='A/B'`, store A+B content/hashes) but **never double-hit a group.**
- **Cap enforced across the run:** each `Posted ✓` decrements remaining/12; if the cap is reached mid-run, the Run **stops** — "12/12 — cap reached, protect the account."
- **Cooldown/off-day:** such groups are never in the queue (Plan already filters); the write path still refuses them as a backstop (`source='app'` scope).
- **Plan vs post — say *why* + *when* (not a dead button).** When a group can't be posted *today* (cooldown, or rule-locked off its day), never show a silently-disabled button — show a message: **"Planning only — can't post until {date}"** + the reason (*"in cooldown until 21 Jul"* / *"Tuesdays only — next Tue 15 Jul"*). The slot is a **planning date**; the post can't be logged until the group is eligible. *(Also fix this in the existing single-group Post cockpit — a greyed button with no reason reads as broken.)*
- **Resumable & honest:** `posting_log` is the source of truth for what's done today — pause/reload and the Run reflects real state. The app asserts nothing on your behalf.

## 3c. Workspace tables — posts created + scheduled (period-filtered)

Two tables on the workspace, **below the current dashboard**, each in a **collapsible accordion** (collapsed by default so the dashboard stays clean; expand to view):

**Table 1 — Posts created** (from `posting_log`). Columns: **group · date created · posting date** (+ variation / account).
- **Default period = last 30 days (rolling)** — *not* the calendar month.
- Dropdown to change: **This week · This month · Last 30 days · Between dates** (custom start–end).

**Table 2 — Scheduled posts** (from a new `scheduled_posts`). Planned posts that **remain here until posted**. Columns: **group · planned date · content**.
- A scheduled post persists (`status='pending'`) until the human posts it. On the Run's **"Posted ✓"** it's logged to `posting_log` and the scheduled row flips to `posted` (leaving this table). Nothing auto-posts — scheduling is *intent*, the human still pastes.

```
scheduled_posts: id uuid pk, group_id uuid, group_name text, planned_on date,
  variation text, content text,
  status text check (status in ('pending','posted','skipped')) default 'pending',
  created_by text, created_at timestamptz default now()
```
RLS: `authenticated` + the two approved emails; anon none.

**Acceptance:** posts-created table filters by week/month/last-30/custom (default last-30); scheduled posts persist until posted, then move to the created table on "Posted ✓"; RLS intact.

## 3d. Testing findings — fix (from live UAT, 12 Jul)

1. **Post-success dead-end + contradictory guard pills.** After "Posted ✓" the write works (verified: real `source='app'` rows landed), but the group's button silently disables (now in cooldown) with no confirmation or next step — and the pills **contradict** (observed: *"COOLDOWN — 14 DAYS LEFT"* shown next to *"OK TO POST TODAY"*). **Fix:** (a) success toast **"Logged ✓ to {group}"** + a path to the **next group**; (b) one clear **net status** — *"Can't post — in cooldown until {date}"* — never three mixed signals beside a dead button.
2. **No Group Detail view.** There is no way to open a Facebook group's detail (official rules, size, reach, `posting_days`, notes, the FB link). **Fix:** a **row/click → Group Detail** panel (per the V1 spec), reachable from **Groups *and* the Post flow**.
3. **Plan shows suggestions, not saved plans.** The current Plan is live read-only suggestions — nothing planned persists. **"Actual planning posts" require the `scheduled_posts` store (§3c)** so a planned post sticks (as `pending`) until posted, then moves to the created table.

## 4. Relationship to the Post cockpit

The single-group **Post cockpit stays** for one-off posts (and gets the collapsed-group accordion there). The **Run is the new daily surface**. Both share the same drafting, the Post/A-B toggle, and the same guarded write path.

## 5. Acceptance criteria (Architect validates vs reality)

1. Run generates from the Plan: only safe-today groups, greens-first, ≤ remaining cap, rule-days respected.
2. `Post` outputs one selected draft; `A/B test` outputs two (A then B) — both copy-paste-ready.
3. `Posted ✓` writes a real `source='app'` `posting_log` row (verify by SQL) and advances.
4. **A/B logs one row, counts once** against the cap; no group is double-posted.
5. Cap **blocks** at 12 mid-run (attempt a 13th → refused, no row written); cooldown groups never appear.
6. Resumable: reload mid-run → progress reflects `posting_log`.
7. Nothing is posted by the app (no network call to Facebook anywhere); RLS unchanged; branch + draft PR.

## 6. Out of scope (later)

- Full **image creation** (montage templates, `cleared_for_public` gate, tag-driven selection) → **Phase 3**.
- AI copy quality tuning beyond DNA-grounded drafts.
