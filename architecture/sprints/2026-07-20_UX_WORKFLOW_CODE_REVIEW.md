# Sturij Marketing — UX, Workflow & Code Review

**Date:** 20 July 2026 · **Reviewer:** Claude (Cowork) · **Scope:** UX/workflow + code-level review
**Evidence base:** live app source (app.html, 231KB, fetched from the production Vercel deployment), all three Edge Functions (draft-copy v4, triage-ticket v2, enhance-image v2), the live Supabase database (schema, RLS policies, row counts, posting history), the User Handbook, the Technical Specification, and the ten screenshots supplied.

---

## 1. Executive summary

This is a strong MVP with an unusually clear governing idea — *"the app prepares, you post"* — and the foundations are better than most MVPs I see: RLS is genuinely enforced on every table (verified against the live database), the client code is disciplined about HTML escaping (no exploitable XSS found), secrets are server-side only, and the AI functions treat external text as data with injection guards.

But the agile, feature-by-feature build has left three problems that matter for UAT:

1. **The safety guardrails are a promise the code doesn't fully keep.** The 12/day cap, 14-day cooldown and day rules are enforced *only* in client-side JavaScript, computed from state loaded once at page load. Two browser tabs, two devices, a double-click, or a tab left open past midnight can all breach the cap or cooldown — the exact failure the product exists to prevent. The cooldown also ignores your 26 reconstructed historical posts entirely, so groups you genuinely posted to recently show as safe.

2. **There are three parallel posting workflows where there should be one.** Plan, Run and Today's Post are ~450 lines of triplicated logic with divergent features: tone slider and themes exist only in Post; the floating paste window exists only in Plan; Plan's queue drafts 1 variant while Run drafts 3; copy drafted in Plan is saved but Run never reads it; Run lets you log "Posted ✓" with empty copy. The operator has to learn three subtly different ways to do the same job.

3. **The product's real bottleneck right now is data readiness, and the UX doesn't lead with it.** Only 27 of 273 groups have a Facebook link and only **1 group in the entire database has a posting rule**. Until that's fixed, Plan and Run can barely operate — yet Audit is buried mid-rail and nothing on the Dashboard says "your next job is to fix links, here's the fastest path."

The recommendation in one sentence: **collapse the twelve tabs into a single daily loop ("Today") backed by one shared post composer, move the guardrails into the database, and make data-completion a first-class guided task until it's done.**

---

## 2. The workflow as built vs. the workflow the product wants

### 2.1 What the operator faces today

Polly signs in and sees a rail of twelve tabs: Dashboard, Groups, Audit, Plan, Run, Post, DNA, Safety, Photos, Montage, Themes, Support. To do her actual daily job she must know that:

- The Dashboard is read-only; work starts in **Plan** (build a queue) *or* **Run** (guided queue) *or* **Post** (one-off) — three doors to the same room.
- Photos must be uploaded, tagged and cleared in **Photos**, composed in **Montage**, and the result ("advert"/"composition"/"saved advert" — three names in the UI) can only be scheduled from the Saved Adverts gallery, not from the save action itself.
- Brand steering lives in two places (**DNA** and **Themes**), and the Themes page claims themes apply in "Post & Run" when the code only wires them into Post.
- The **Videos/Reel** feature is hidden as a third chip inside Photos and its output can't be attached to any post at all.

The code confirms the fragmentation: there are exactly **two** programmatic tab-to-tab handoffs in the whole app (Post→Montage and planned-drawer→Run). Every other transition is prose: "clear some in the Photos tab first", "build one in the Montage tab". Each of those is a dead end where the user must remember where to go next.

### 2.2 The natural shape of this product

The domain workflow is a **single daily loop** plus three supporting activities:

```
DAILY LOOP (the job):
  Check status → work a safe queue → per group: draft → paste → log → next
  → stop at cap

SUPPORTING (occasional):
  • Prepare content   (photos → clear → montage → advert library)
  • Maintain data     (links, rules, tiers, reach — until complete)
  • Steer & protect   (DNA/themes, safety history, support)
```

### 2.3 Recommended information architecture

Reduce the rail from twelve items to six:

| New tab | Absorbs | Rationale |
|---|---|---|
| **Today** | Dashboard + Plan + Run | One landing page: cap meter, restriction status, and *the queue itself* — greens first, eligible only. "Plan mode" (browse/add) and "Run mode" (step through) are two views of the same queue, not two tabs. |
| **Post** | Post (one-off cockpit) | Kept, but as a thin entry point into the *same shared composer* used by Today — pick any group, same drafting, same guardrails. |
| **Library** | Photos + Adverts + Videos + Montage | One content library with sub-sections. "Make an advert" (Montage) is an action inside the library, and saving an advert offers **Schedule now / Post now / Done** instead of dead-ending. |
| **Groups** | Groups + Audit | Audit is not a destination, it's a filter: "groups missing data". Put it as a permanent banner + filter inside Groups, and surface the count on Today until it reaches zero. |
| **Brand** | DNA + Themes | Both exist to steer the AI writer. One page, two sections. |
| **Safety & Support** | Safety + Support | Both are "trust" surfaces, visited rarely. |

This isn't just tidier — it fixes real behaviour, because merging Plan/Run/Post forces the **one shared composer** (§3) that eliminates the triplicated logic and its divergent guardrails.

### 2.4 The one composer

Every posting surface should call the same component with the same capabilities:

- 3 AI drafts + remix/lock, **tone slider, theme picker, image/advert attach** (today these exist only in Post)
- Live Facebook-style preview (today only in Run)
- Floating paste window (today only in Plan's queue)
- "Posted ✓" that: requires non-empty selected copy, disables itself while writing, stores `image_ref` and correct variation, and re-checks the guardrails server-side (§4)
- Drafted copy persists to `scheduled_posts.content` and **is read back** wherever the job is next opened (today Plan saves it and Run ignores it)

---

## 3. Critical findings — safety & correctness

These are ordered by risk to the thing the product cares most about: the Facebook account.

### C1 — Guardrails are client-side only and computed from stale state *(High)*

`appPostsToday()` counts rows in an in-memory `state.posts` array loaded once at sign-in (app.html L871, L894). There is no database constraint, trigger or RPC enforcing the cap or cooldown. Consequences, all verified in code:

- **Two devices / two tabs:** each counts its own state; both can log 12 posts (24 total). With Polly's restriction history showing three temp-blocks for "burst posting / high-frequency posting", this is not theoretical.
- **Double-click:** "Posted ✓" handlers (`postPosted` L1260, `runPosted` L2518, `rpPosted` L2668) don't disable the button before `await`; two rapid clicks both pass the cap check and both insert.
- **Fix:** enforce cap + cooldown + day rule in a Postgres trigger (or route the insert through an RPC that checks inside a transaction), add a unique index on `(group_id, posted_on)`, and disable the button while the write is in flight. Keep the client checks for UX, but stop trusting them.

### C2 — "Today" is frozen at page load, in UTC *(High)*

`const TODAY = new Date().toISOString().slice(0,10)` (L772) is computed once, in UTC. During British Summer Time, 00:00–01:00 local is still "yesterday"; worse, a tab left open past midnight keeps yesterday's date forever — the cap never resets, day-of-week rules check the wrong weekday, and posts are logged with the wrong date. Fix: compute the date per-use in Europe/London (`toLocaleDateString('en-CA', {timeZone:'Europe/London'})`).

### C3 — Cooldown ignores your real posting history *(High)*

`cooldownOk` and `lastAppPost` (L1088, L1164) filter `source==='app'`, so the 26 rows reconstructed from your Content Library are invisible, and the `v_group_last_post` view exists but is never queried. Any group whose only history is reconstructed shows "OK to post today" even if you genuinely posted there last week. Fix: cooldown should use `MAX(posted_on)` across **all** sources (the cap can stay app-only).

### C4 — `select('*')` with no limit will silently corrupt the maths *(High, latent)*

Every table is loaded with unlimited `select('*')`. Supabase's default row cap is 1,000; once `posting_log` passes it (~3 months at full pace), older rows silently vanish from the client and cooldown/cap calculations go quietly wrong with no error. Fix now while tables are small: fetch only the window the maths needs (e.g. posting_log for the last 30 days) or use count queries.

### C5 — Partial failure on "Posted ✓" strands the queue *(Medium)*

After inserting `posting_log`, the update flipping `scheduled_posts` to `posted` is wrapped in an empty `catch{}` (L1271, 2531, 2678). If it fails, the post is logged but the job stays "pending" forever — and cooldown now blocks it, so it appears as permanently stuck un-posted work. Fix: do both writes in one RPC, or surface the failure with a retry.

### C6 — AI failure is invisible; canned drafts are silently substituted *(Medium)*

If the `draft-copy` function errors, every caller silently falls back to hardcoded template copy (L1192, 2441, 2664). The operator cannot tell the difference between "Claude wrote this for this group" and "generic fallback" — and could post template copy repeatedly across groups, which is precisely the repetitive-content pattern Facebook flags. Fix: badge fallback drafts visibly ("offline template — AI unavailable") and warn before logging one as posted.

### C7 — Run can log "Posted ✓" with empty copy *(Medium)*

`postPosted` requires a selected draft; `runPosted` and `rpPosted` don't — `rpPosted` will happily log `content_hash: phash('')` with variation hardcoded to `'A'` and no `image_ref` (L2527, L2673–2675). Fix in the shared composer: non-empty selected copy is a precondition of logging everywhere.

### C8 — The deployed build appears older than the source *(Medium, process)*

Your Run screenshot shows "**()** of 12 posts done today". The current source cannot produce that string (L2539–2540 renders a number), so production at screenshot time was serving an older build. Also, the string labels a planned *target* as "posts done today" — misleading even when it renders. Fix: confirm Vercel is deploying `main`'s head, and change the copy to "N of 12 posts done today".

---

## 4. UX findings — friction, dead ends, inconsistency

### U1 — Three posting surfaces, divergent behaviour *(the headline UX issue)*

| Capability | Plan queue | Run | Post |
|---|---|---|---|
| AI drafts | 1 | 3 | 3 |
| Tone slider | — | — | ✔ |
| Theme picker | — | — (despite Themes page claiming "Post & Run") | ✔ |
| Image attach + logged `image_ref` | partial (dropped on log) | — (stale "add in Phase 3" placeholder) | ✔ |
| FB-style preview | — | ✔ | — |
| Floating paste window | ✔ | — | — |
| A/B variant | — (hardcoded 'A') | ✔ | ✔ |
| Blocks empty-copy logging | ✔ (button disabled) | ✘ | ✔ |
| Reads copy drafted elsewhere | saves it | **ignores it** | n/a |

Every row of that table is an operator-facing inconsistency. The single composer (§2.4) erases the table.

### U2 — Dead ends verified in code

- Montage "Save advert" → toast only; Schedule exists only from the Saved Adverts gallery.
- Clearing a photo → no path onward to Montage/Reel; Montage's empty state says "clear some in the Photos tab first" with no link.
- Audit bulk-import success ("Wrote N links") → no onward suggestion, though Run's empty state points *into* Audit.
- Reel videos can be built and saved but attached to nothing.
- Empty states are good prose but none is a button — make every "go to X tab" string a click.

### U3 — Data readiness isn't treated as the main quest

Live numbers: 246/273 groups missing links (red), only 21 amber groups have links, **1 posting rule saved in total**, reach data on 26 groups. The handbook's premise — "green groups prioritised, safe days only" — can't function on this data. Recommendations:

- Put a progress bar on Today: "134/273 groups ready" with a **Fix next →** button that deep-links into the bulk importer.
- The bulk importer (paste "Groups you've joined") is your highest-leverage feature right now; promote it from a box inside Audit to the primary first-run experience.
- Consider making posting rules **default to "Any day" explicitly confirmed**, so "no rule" (unknown) is distinguishable from "checked — any day is fine". Today one un-reviewed group and a reviewed any-day group look identical.

### U4 — Terminology drift

"Advert" / "composition" / "montage" / "saved advert" (one artefact); "Add to Run" puts things in **Plan's** queue, which Dashboard calls "Planned adverts" and cards call "jobs"; tab "Run" vs heading "Today's Run"; four variants of the Posted button label. Pick one noun per concept — suggested: **advert** (image), **post** (a drafted+logged unit), **queue** (today's list) — and sweep the strings.

### U5 — Tier language

Green/amber/red is presented colour-only in several pickers (a bare dot with no text — L1183, L2757) and never explained in-app. Add a one-line legend ("Green = proven reach, post freely · Amber = untested · Red = restricted/risky") and text labels beside dots. This is also an accessibility fix (colour-blind users, screen readers).

### U6 — Mobile and accessibility (quick pass)

- Below 860px the rail becomes a bottom bar of 12 fixed 44px icon buttons ≈ 528px wide — overflows a phone with no scroll rule, tooltips hidden, so 12 unlabeled icons. The 6-tab IA (§2.3) mostly fixes this by itself.
- No `role="dialog"`, no focus trap or focus-restore on any drawer/lightbox; the schedule drawer can't be closed with Escape; accordions and chip toolbars are click-only `div`s (not keyboard reachable). Worth a half-day sweep before wider rollout.

### U7 — Per-account velocity is undefined

`posting_log.account` records "Mark Walton" and "Sturij Contact", and the restriction history is specifically about *Polly's personal account* — but the 12/day cap is global and the app never asks **which Facebook account is doing the pasting**. If two people post on the same day, the app can't tell whether one account did all 12. Decide the model (cap per FB account vs per business) and capture the posting account explicitly in the composer.

---

## 5. Gaps and drift

- **Docs vs reality:** the Technical Spec says AI image enhancement is "blocked, awaiting Google API key" — but `enhance-image` v2 is deployed, ACTIVE and Gemini-backed. The handbook doesn't mention the Videos/Reel studio at all. The Themes page's own description is wrong about Run. Refresh both docs before UAT so testers aren't testing against stale promises.
- **Privacy note on enhance-image:** photos are "private, never public, signed URLs only" — but the enhance path sends the image bytes to Google's Generative Language API. That's a reasonable trade-off, but it should be a documented, deliberate one (and arguably the operator should see "sends to Google for processing" the first time).
- **`events` table (0 rows) is dead** — either wire it up (it would be the natural place for an audit trail of skips/cap-hits) or drop it.
- **No performance feedback loop:** reach metrics (`fb_views` etc.) are static imports on 26 groups; `posting_log` stores what went out but nothing records how posts performed. Even a manual "how did it do?" prompt 48h after posting (likes/comments count) would let the tier system learn instead of being hand-set.
- **Notifications:** ticket-lifecycle email is scaffolded but keyless; low priority, but the *useful* notification is different — "you have 12 safe posts available today" as a morning nudge.
- **Supabase advisors** flag `v_daily_velocity` and `v_group_last_post` as SECURITY DEFINER views (linter ERROR). Since the client never queries them anyway (C3), either use them properly with `security_invoker = on`, or drop them.

## 6. Security posture (good news, mostly)

Verified against the live database and source:

- **RLS: solid.** Every table carries the approved-email policy on both read and write paths (checked in `pg_policies`). The client-side allowlist is cosmetic, but the server-side one is real — this is the single most important thing and it's right.
- **XSS: no exploitable sink found.** The `esc()` helper is applied with unusual discipline across ~300 interpolation sites. Two latent items: `esc()` doesn't escape single quotes (fine today, fragile tomorrow), and `g.tier` is interpolated raw into class attributes — safe only while tier values are UI-constrained. Cheap to harden both.
- **Secrets: clean.** Only the anon key ships to the client; AI keys live in Edge Function secrets; all three functions re-check the email allowlist server-side.
- Minor: Edge Function CORS is `*` (could pin to marketing.sturij.com); leaked-password protection is off in Supabase Auth (moot with Google OAuth only, but free to enable).

## 7. Prioritised recommendations

**P0 — before UAT starts** *(the account-safety cluster; roughly 2–3 days of work)*
1. Move cap/cooldown/day-rule enforcement into the database (trigger or RPC) — C1
2. Fix `TODAY` to per-call Europe/London — C2
3. Count all posting_log sources in cooldown — C3
4. Disable Posted ✓ while in flight; unique index `(group_id, posted_on)` — C1
5. Verify the production deploy matches `main` (the "()" build) — C8
6. Badge AI-fallback drafts and block empty-copy logging — C6, C7

**P1 — during UAT** *(the workflow cluster)*
7. Build the shared composer; retire the three divergent implementations — U1
8. Collapse the rail to ~6 tabs around the daily loop — §2.3
9. Make data-readiness the guided main quest with a progress bar and deep-linked bulk import — U3
10. Turn every dead-end toast/empty-state into a button — U2
11. Add query limits / date-windowed fetches — C4; surface partial-write failures — C5
12. One noun per concept; sweep the strings — U4

**P2 — after UAT**
13. Per-account velocity model and posting-account capture — U7
14. Post-performance capture and tier learning — §5
15. Accessibility sweep (dialogs, keyboard, tier labels) and mobile bottom-bar fix — U5, U6
16. Docs refresh, `events` decision, SECURITY DEFINER cleanup, CORS pinning — §5, §6

---

### Closing note

The instinct behind this product — encode the safety rules so a human never has to hold them in their head — is exactly right, and the manual-paste architecture is a moat, not a limitation. The gap is that the rules currently live in the browser tab rather than the database, and the workflow asks the operator to learn three tools instead of one. Fix those two things and the MVP's story ("the app prepares, you post — and it's impossible to post unsafely") becomes true end to end.
