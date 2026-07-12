# Sprint Spec — Support & Feedback (bugs · feedback · features · backlog)

**Role split:** Architect (Claude — spec + validation) → Executor (branch, draft PR) → Human (Mark, merges). Nothing auto-deploys.
**Repo:** `mark-j-walton/sturij_marketing` · **DB:** Supabase `xscvfzfeepiakudshtod` · **Deploy:** `marketing.sturij.com`.
**Base:** off latest `main`, e.g. `claude/support`. **Recommend building early** — it captures feedback through the whole test phase.

---

## 0. Standing guardrails

- **AI assists; a human gates.** AI may triage and **draft** a fix, but a **human always reviews and merges** — never auto-merge, never auto-deploy. (Same rule as everything else; here it's also a *security* boundary — see §5.)
- **Do NOT change RLS.** `support_tickets` locked to `authenticated` + the two approved emails; anon none.

## 1. Goal / DoD

A **Support** tab where you log **bugs, feedback, feature requests and backlog** items; each has a status and a short report; **contact@sturij.com gets emailed** when a bug is **opened** and **closed**; AI **triages** every ticket and can **draft** a fix (human-gated), escalating to a human when it can't. Done = tickets create/list/close with status + report, emails fire on bug open/close, AI triage populates, escalation works, RLS intact.

## 2. Support page

New **Support** tab in the rail. Two views:
- **New ticket:** kind (**bug · feedback · feature · backlog**), title, description, (bug) optional severity.
- **List:** filter by kind + status; each row shows title, kind, **status chip**, and the short report.

## 3. Ticket model

```
support_tickets:
  id uuid pk,
  kind text check (kind in ('bug','feedback','feature','backlog')),
  title text, description text, severity text,
  status text check (status in ('reported','open','closed')) default 'reported',
  resolution text,              -- short report: what was wrong + what's been fixed (on close)
  reporter text,                -- signed-in account/email
  ai_triage jsonb,              -- AI classification / summary / suggested cause
  ai_fix_ref text,              -- link to a drafted fix (PR), if any
  escalated boolean default false,   -- human-in-the-loop needed
  created_at timestamptz default now(),
  closed_at timestamptz, closed_by text
```
RLS: `authenticated` + email ∈ the two approved accounts; anon none.

**Status lifecycle:** **Reported** (just submitted) → **Open** (acknowledged / being worked) → **Closed** (resolved, with a `resolution` report).

## 4. Short report per entry

Every ticket carries a **short report** (`resolution`): *what the problem was* and *what's been fixed*, written on close (AI can draft it; a human confirms). Visible in the list + detail, so the history reads as a plain-English changelog.

## 5. AI triage + fix (governed)

- **Triage (auto, on create):** a **Vercel serverless function** (`/api`, key in Vercel env vars) calls the LLM to classify the ticket, summarise it, and suggest a likely cause → stored in `ai_triage`. Cheap, always-on.
- **Fix (assisted, human-gated):** for tractable bugs, the AI may **draft a fix as a branch + draft PR** (`ai_fix_ref`). **A human reviews and merges.** Never auto-merge / auto-deploy.
- **Escalate (human-in-the-loop):** if the AI can't produce a confident fix, or the change is non-trivial/architectural, set `escalated=true` → a human takes it.
- **Security:** ticket text is **untrusted user input**. Treat it as data, never instructions (prompt-injection guard). The human merge gate is the backstop — an AI-drafted fix from a malicious report can't reach `main` without a person.

## 6. Email notifications (to contact@sturij.com)

On a **bug** ticket **opened** (status→reported/open) and **closed**, email **contact@sturij.com**:
- open: kind, title, description, severity, AI triage summary.
- close: title + the **resolution report** (what was wrong / what's fixed).
- **Infra (low-level, no new service — default):** send via **`contact@sturij.com`'s own Google Workspace SMTP** (a Gmail **app-password** in Vercel env) from the Vercel function — reuses the mailbox you already have; fine for this tiny volume.
  - *Note: Supabase's built-in email is **auth-only** (magic links etc.) — it cannot send these notifications; don't rely on it.*
  - *Fallback if SMTP is fussy: Resend free tier (100/day).*
- **Always-on baseline:** an **in-app Support inbox** (tickets + status visible in the app) so nothing is missed even if an email fails. Email is the *nudge*; the inbox is the record.
- (Feedback/feature/backlog: email optional — default bug-only.)

## 7. Acceptance criteria (Architect validates vs DB)

1. Create a ticket of each kind → `support_tickets` row with status `reported` (verify by SQL).
2. Status moves reported→open→closed; a closed ticket has a `resolution` report.
3. AI triage populates `ai_triage` on create.
4. Bug **open** and **close** each send an email to contact@sturij.com (verify a real send).
5. An AI-drafted fix appears as `ai_fix_ref` (a draft PR) and **cannot merge without a human**; unfixable → `escalated=true`.
6. RLS intact (anon no access); branch + draft PR; nothing merged until validated.

## 8. Open decisions (Mark)

- **Email provider** (Resend / SendGrid / other) + key for the Edge Function.
- **AI-fix scope:** triage-only to start, or also draft-fix PRs now? (Recommend: **triage + report now; draft-fix later**, once the app's stable.)
- **Email scope:** bug open/close only (recommended), or feedback/features too?
- **Sequencing:** recommend Support ships **early** (right after V2) so it captures feedback across 2a/2b/3 testing.
