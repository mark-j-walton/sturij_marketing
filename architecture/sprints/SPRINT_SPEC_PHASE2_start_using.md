# Sprint Spec — Sturij Marketing Phase 2: Start Using It (Reach & Rules)

**Role split:** Architect (Claude — this spec + validation) → Executor (builds on a branch, draft PR) → Human (Mark, merges). Nothing auto-posts. Human posts, human merges.

**Repo:** `mark-j-walton/sturij_marketing` · **DB:** Supabase `xscvfzfeepiakudshtod` · **Deploy:** `marketing.sturij.com`.
**Base:** branch off latest `main`, e.g. `claude/phase2-reach-rules`.

> Verified against the live DB on 12 Jul — re-ground before building.

---

## 0. Why this sprint (the gap between "built" and "usable")

The workspace works, but a real posting day breaks for most groups. Live counts:

| To post to a group you need… | Have it | Missing |
|---|---|---|
| A **Facebook URL** (to open the group) | **28 / 273** | 245 |
| Its **posting rule** (don't post on a banned day → report → ban) | **1 / 273** | 272 |
| An **image** on the post | **0 / 273** | 273 |

But the **high-value set is already reachable: 7 of 8 green groups have URLs.** So Polly can start posting the best groups today; this sprint makes the *rest* reachable and *safe* — **as she uses it**, not via a 245-row data marathon.

**Design principle: capture-as-you-go.** The first time you touch a group, you capture its URL and rule inline; it's saved forever and the guardrails immediately get smarter. No big upfront data entry.

## 1. Goal / Definition of Done

Make the app **safely usable day-to-day**: from the Post/Group flow, capture a group's **FB URL** and **posting rule** in seconds, and have the guardrails honour the rule instantly. Done = URLs and rules can be captured inline and persist to the live DB; the day-guard/Plan respect a newly-captured rule; RLS/anon lockdown untouched.

## 2. Slice A — Capture the group's Facebook URL (reach)

Field already exists: `groups.url`.
- In the **Post cockpit** and **Group detail**, when a selected group has **no `url`**, show an inline **"Add Facebook link"** input → paste → **Save** writes `groups.url`.
- When `url` exists, "**Open group ↗**" uses it (already wired); show it as editable.
- Editable in the **Groups** tab too (per-row).
- **Optional bulk-paste** (flag §7): a small "paste links" box that matches pasted `facebook.com/groups/...` URLs to existing group names for a quick batch fill.

**Done:** paste a link on a URL-less group → `groups.url` populated (verify by SQL); "Open group" now works for it.

## 3. Slice B — Capture the group's posting rule (safety)

Fields already exist: `groups.posting_days` (text[]), `groups.official_rules` (text), `groups.posting_note` (text).
- Inline **"Posting rule"** control on the group (Post cockpit + Group detail): pick allowed **days** (→ `posting_days`), optional free-text **rule/note** (→ `official_rules` / `posting_note`).
- **The guard must respect it immediately.** The day-guard + Plan logic already honour `posting_days` (that's how Boston Spa Grumbler is Tue-locked) — so capturing a rule for any group instantly rule-locks it. No new guard logic; just make the existing one general (it already is) and feed it data via this UI.

**Done:** set a group to e.g. "Tue only" → the Post cockpit blocks/warns on other days and the Plan only schedules it on Tue; `posting_days` persisted (verify by SQL).

## 4. Slice C — Attach one image to a post  *(OPTIONAL — see §7)*

Minimal only (full montage/photo system stays a later phase).
- In the Post cockpit, allow attaching **one image** to a post: paste an image URL (or simple upload) → preview → on **Mark posted**, record it in `posting_log.image_ref`.
- Not a media library, no editing — just "this post had this image", so the log is honest and Polly has the picture to hand when she posts by hand.

**Done (if included):** a logged post carries `image_ref` (verify by SQL).

## 5. Guardrails / governance

- These are **writes to `groups` (url, posting_days, official_rules, posting_note)** and optionally `posting_log.image_ref`, by **authenticated approved users** — allowed under current RLS. **Do NOT change RLS.** Anon stays with **no access**.
- Never push/merge to `main` — branch + **draft PR**; Mark merges.
- Capture writes go straight to the live table (Polly's own working data) — no propose/approve step, same as tier edits.
- Verify before "done": show a URL and a rule captured live, and the guard reacting to the rule.

## 6. Acceptance criteria (Architect validates against the DB)

1. **URL capture:** capturing a link raises `count(url)` and the specific group's `url` is set; "Open group" opens it.
2. **Rule capture:** setting days raises `count(*) where array_length(posting_days,1)>0`; the day-guard blocks that group off-day and the Plan schedules it only on allowed days.
3. **Persistence:** both survive reload (written to DB, not just in memory).
4. **Lockdown intact:** anon still has no access; RLS policies unchanged (still the two approved emails).
5. **(If C):** a logged post has `image_ref` populated.
6. Branch + draft PR open; nothing merged until validated.

## 7. Open decisions (Mark)

- **Image (Slice C): in this phase, or defer?** Recommendation: **defer** — keep this phase to the two "safe reach" essentials (URL + rule); do images as their own phase with the montage work. Include only if you want a picture on posts now.
- **Bulk URL paste (Slice A): include, or capture-as-you-go only?** Recommendation: include a lightweight paste box *and* inline capture — you likely have some links to batch in.
- **Sequencing:** Slices A/B touch the **Post view**, same as the V2-polish "accordion" slice. Recommend the executor does the **accordion + URL/rule capture in one Post-page pass** to avoid editing it twice.
