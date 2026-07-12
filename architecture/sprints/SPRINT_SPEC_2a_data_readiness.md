# Sprint Spec — Phase 2a: Data Readiness (make groups postable)

**Role split:** Architect (Claude — spec + validation) → Executor (branch, draft PR) → Human (Mark, merges). Nothing auto-posts.
**Repo:** `mark-j-walton/sturij_marketing` · **DB:** Supabase `xscvfzfeepiakudshtod` · **Deploy:** `marketing.sturij.com`.
**Base:** branch off latest `main`, e.g. `claude/2a-data-readiness`. Verified against live DB 12 Jul — re-ground first.

---

## 0. Standing guardrail (applies to every sprint)

**The app prepares; the human posts.** AI may do anything up to the clipboard (draft copy, assemble content, match data). **The physical copy-paste into Facebook is the human handover.** The app never posts, never auto-fires, and no browser automation ever touches Facebook. Any "Posted/Mark posted" control is a **log entry only** — the human asserting they pasted.
**Do NOT change RLS.** Data is locked to `authenticated` + email ∈ (`contact@sturij.com`, `mark.walton@gmail.com`); anon has no access. All writes here are by approved authenticated users to their own working data.

## 1. Why / DoD

A real day breaks for most groups: **28/273 have a FB URL, 1/273 has a posting rule.** This sprint lets Polly fill those gaps fast — in bulk and as-she-goes — so groups become **reachable** (url) and **safe** (rule). Done = URLs and rules can be captured (bulk + inline) and persist to `groups`; a self-emptying Audit page shows what's left; guardrails honour newly-captured rules; RLS untouched.

## 2. Slice A — Audit page (self-emptying gaps worklist)

New **Audit** tab in the rail. Purpose: a burn-down list of groups missing posting-critical data. It audits the two **capturable** fields only: `url` and posting rule (`posting_days` and/or `official_rules`).

**Behaviour:**
- **Only groups with a gap appear.** A group with both url + rule is **not shown** (green = gone).
- Each group = a **collapsible accordion**; header shows group name + a status dot.
- Inside, render **only the missing field(s)** as inline editable inputs:
  - missing `url` → "Add Facebook link" input
  - missing rule → day picker (`posting_days`) + optional rule note (`official_rules`/`posting_note`)
- **Fill + Save → that field disappears.** When the last gap is filled → the **group drops off the list**.
- **3-colour status:**
  - 🔴 **red** = critical gap: no `url` (can't post)
  - 🟠 **amber** = non-critical gap: has `url`, missing rule
  - 🟢 **green** = complete → hidden
- Header count: "N groups need data · X critical".

**Done:** filling a group's url+rule live removes it from the Audit; reds/ambers reflect the gap; count decrements.

## 3. Slice B — Bulk URL import (the 245-URL unlock)

You're a member of every group, so the URLs already exist in your **"Groups you've joined"** list — no browser automation, no per-group hunting.
- A **"Paste group links"** box: paste a block of text/links (e.g. an exported joined-groups list).
- Parse `facebook.com/groups/...` URLs + nearby group names; **auto-match** to existing `groups.name` (fuzzy).
- Show a **review table** — matched name → url, with confidence; unmatched flagged. **Human confirms** before writing.
- On confirm → write `groups.url` for matched rows.

**Done:** pasting a real joined-groups list matches and fills many `groups.url` in one reviewed step (verify `count(url)` jumps); no Facebook automation involved.

## 4. Slice C — Inline rule capture (shared with the Post flow)

The same rule-capture control from the Audit also lives in the **Post cockpit / Group detail**: when you touch a group, set its `posting_days` (+ optional `official_rules`/`posting_note`) in seconds.
- The **existing day-guard/Plan already honour `posting_days`** (that's Boston Spa Grumbler's Tue lock) — so capturing a rule **instantly** rule-locks that group. No new guard logic; just feed it data.

**Done:** setting "Tue only" on a group makes the Post cockpit warn/block off-day and the Plan schedule it only on Tue; persists to DB.

## 5. Acceptance criteria (Architect validates vs DB)

1. Audit shows only incomplete groups, only missing fields; filling url+rule removes the group; colours correct.
2. Bulk import: a reviewed paste raises `count(url)`; matches are correct; nothing written without confirm.
3. Rule capture persists (`posting_days` etc.) and the guard/Plan react immediately.
4. **Lockdown intact:** anon still no access; RLS policies unchanged (two approved emails).
5. Branch + draft PR; nothing merged until validated.

## 6. Notes

- Reach/`fb_views` and enrichment (image, tags) are **out of the Audit** — audit is strictly posting-readiness (url + rule). Reach stays a separate metrics process.
- Writes are direct to `groups` (no propose/approve), same governance as tier edits.
