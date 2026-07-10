# Deploying the Group Ledger

The Group Ledger has moved from the self-contained artifact (`window.storage`)
to **Supabase** for storage, per `GROUP_LEDGER_SCHEMA_1.md`. It is no longer a
stand-alone HTML artifact — it needs a database and a host. This doc is the
runbook for standing it up. It matches the main app's convention (Vercel).

There is **no build step** — it's plain HTML/CSS/JS. Vercel serves the static
file and one serverless function.

## 1. Create the Supabase project & schema

1. Create a Supabase project (or use the existing Sturij one).
2. Run the migration in `supabase/migrations/20260710000000_group_ledger.sql`
   against it — via the Supabase SQL editor, or the CLI:
   ```
   supabase db push
   ```
   This creates the `groups` and `events` tables, indexes, and RLS policies.
   The tables start **empty** — no demo data. The real ~325-group export is
   loaded later through the app's own "Import groups" flow (paste → parse →
   insert), exactly as before.
3. From Supabase → Project Settings → API, note the **Project URL** and the
   **anon / public** key. (Do **not** use the `service_role` key anywhere in
   the client — anon only. RLS protects the data.)

## 2. Deploy to Vercel

1. Import this repo into Vercel (no framework preset needed; it's static +
   one function in `/api`). `vercel.json` rewrites `/` to the ledger page.
2. In Vercel → Project Settings → Environment Variables, add:
   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_ANON_KEY` | your Supabase anon/public key |
3. Deploy. The client fetches these from `/api/config` at load — **no key is
   ever committed to the repo** (CLAUDE.md rule 8).

Visit the deployment root; you should see the ledger. If it shows
"Database not connected", the env vars aren't set (or still contain the
`YOUR_...` placeholders).

## 3. Auth note

The RLS policy grants full access to any **authenticated** user. Until you add
Supabase Auth (a login), an anonymous visitor is not `authenticated`, so reads/
writes are denied by RLS. For a one/two-person tool, add a simple Supabase Auth
login (email magic-link is enough) and sign in. Broadening this to per-user
rows is the "revisit once there's more than one real user" note in the schema.

## Local development (optional)

Two ways to run it locally:

- **`vercel dev`** — runs the `/api/config` function too; set the same env vars
  in a local `.env` (gitignored).
- **Standalone** — copy `artifacts/config.example.js` to `artifacts/config.js`
  (gitignored), fill in your URL + anon key, and add
  `<script src="config.js"></script>` just before the `<script type="module">`
  tag in `group_ledger.html`. The app falls back to `window.SUPABASE_CONFIG`
  when `/api/config` isn't reachable.

## What did NOT change

- The area-research call (`api.anthropic.com`) and the image picker (Wikimedia
  Commons) don't touch storage — they're untouched.
- Every UI/interaction pattern is identical to the artifact version. This was a
  storage-layer swap, not a redesign (CLAUDE.md rule 15). The only UI change is
  the removal of the "Just show me an example" demo-seed button, because it
  would have written `[Example]` rows into the real shared database (which the
  schema spec says must never happen) with no in-app way to delete them again.

> **Status:** pending architect review + Mark's sign-off before it goes near any
> real data (CLAUDE.md rule 13). This branch is code only — no Supabase project,
> env vars, or deployment have been created by the AI session.
