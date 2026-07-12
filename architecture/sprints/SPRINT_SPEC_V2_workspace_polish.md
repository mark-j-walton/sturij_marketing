# Sprint Spec — Sturij Marketing V2: Workspace Polish & Front Door

**Role split:** Architect (Claude — this spec + validation) → Dev/Executor (builds on a branch, draft PR) → Human (Mark, merges). Nothing auto-posts. Human posts, human merges.

**Repo:** `mark-j-walton/sturij_marketing` · **DB:** Supabase `xscvfzfeepiakudshtod`.
**Deploy:** `marketing.sturij.com` (+ `sturij-marketing.vercel.app`), production served from `main`.
**Base:** branch off latest `main`, e.g. `claude/v2-workspace-polish`.

> Ground everything against the LIVE app before editing — this spec's element/URL references were verified on 12 Jul, but re-check.

---

## 0. Context (already true — do NOT undo)

- The workspace is `app.html` — 6 panels: `data-panel=` **Dashboard · Groups · Plan · Post · DNA · Safety**. Live at `/app.html`.
- **Auth is real and enforced:** Google OAuth (`signInWithOAuth('google')`), redirect `location.origin + location.pathname`. App-level `ALLOWED = ['contact@sturij.com','mark.walton@gmail.com']`.
- **RLS is locked** (do not loosen): every table's policy is `to authenticated using ((auth.jwt()->>'email') in ('contact@sturij.com','mark.walton@gmail.com'))`. **Anon has no access.** The app already gates all data reads behind login — keep it that way.
- The Reach Map exists as a standalone page `group_reach_map.html` (Leaflet + OSM tiles), **live (200)** but **not wired into the workspace rail**.
- The hub `index.html` is **stale content**: shows "272", "Coming next / Not yet built", and has **no link to `app.html`**.

## 1. Goal / Definition of Done

Four small, independently-shippable polish slices that make the workspace usable day-to-day. Each: on the app shell + `DESIGN.md` tokens (both themes), pushed as a branch → **draft PR**, no data-policy changes. Done = all four behaviours below verified against the live app, RLS/anon lockdown untouched.

## 2. Slice A — Post page: collapse the selected group into an accordion

**Problem:** In `data-panel="Post"` (`renderPost()`), the selected group's detail/edit block is long, pushing the posting controls (the variation cards with `data-copy` / `data-post="${lab}"` / `data-h`, plus the cap/cooldown guards) to the bottom — scroll required every post.

**Build:**
- When a group is selected, render its detail as a **collapsible accordion**: a one-line **header** (group name + tier chip) that is **auto-collapsed on selection**.
- Expanding the header reveals the full detail + tier edit (`tierPick`) + "Open group ↗".
- The **posting section sits directly below the collapsed header** — variations + "Mark posted (A/B/C)" visible **without scrolling**.
- Keep all existing guards intact: the `CAP = 12` block ("today's 12-post cap is reached"), the 14-day cooldown, `source:'app'` insert. Do **not** change the write path.

**Done:** pick a group → it collapses to a header → variations + Mark-posted are on-screen with no scroll; click header → detail re-expands; posting a 13th is still refused.

## 3. Slice B — Reach Map: wire it in + flat on-brand basemap

**B1 — wire it into the workspace.** The rail's map icon must reach the map (link out to `group_reach_map.html`, or bring it in as a **Reach** panel in the same shell). Pick whichever keeps chrome/theme consistent — no dead icon.

**B2 — flatter, on-brand basemap.** Current tiles are raw OSM (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) — too busy; markers get lost. Swap the Leaflet `tileLayer` for a pale minimal basemap:
```js
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
  subdomains:'abcd', maxZoom:19,
  attribution:'&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);
```
Optional brand tint on the tile pane so it reads as paper, markers still tier-coloured:
```css
.leaflet-tile-pane{ filter: grayscale(1) sepia(.25) hue-rotate(-8deg) brightness(1.03) contrast(.92); }
```
Keep the `L.circleMarker` group points in green/amber/red (tier), sized by reach as now.

**Done:** map reachable from the rail; basemap is pale/flat (not OSM colour); tier markers are the clear focal point; attribution present.

## 4. Slice C — Homepage `index.html`: reflect reality

- Add a primary **Workspace** entry linking `/app.html` (the hub currently has no link to it).
- Flip Post / DNA / "Real database" from "Not yet built" → built/live.
- Fix group count **272 → 273**.
- Keep the design system + both themes.

**Done:** the hub links to the workspace; statuses and the count are true.

## 5. Slice D — Root route → workspace (front door)

**Problem:** `marketing.sturij.com/` serves the old hub. Make the **workspace** the landing page.

**Build:** add `vercel.json` at repo root:
```json
{ "rewrites": [ { "source": "/", "destination": "/app.html" } ] }
```
(Rewrite keeps the clean `/` URL and serves the workspace. If you'd rather the hub stay the landing and just *link* to the workspace, do Slice C only and skip D — Mark's call.)

**Auth note:** the app's `redirectTo` is `location.origin + location.pathname`, so at `/` it returns to `https://marketing.sturij.com/`. Confirm Supabase → Auth → URL Configuration has **Site URL** `https://marketing.sturij.com` and a redirect entry covering `/` (the `https://marketing.sturij.com/**` wildcard does). Test Google login on `/` after deploy.

## 6. Guardrails / governance

- Never push/merge to `main` — branch + **draft PR**; Mark merges.
- **Do not touch RLS or the anon lockdown.** These are UI/routing/tile changes only.
- Verify before "done": show each behaviour working on the live deploy (screenshot), and confirm login + a real `posting_log` insert still work under the locked RLS.

## 7. Acceptance criteria (Architect validates against reality)

1. **Post accordion:** selecting a group collapses detail to a header; variations + Mark-posted visible without scroll; 13th post still blocked; a real `source='app'` row still inserts.
2. **Map wired:** reachable from the workspace rail (no dead icon).
3. **Map look:** basemap is the pale CARTO (not OSM); tier-coloured markers legible; attribution shown.
4. **Homepage:** links to `/app.html`; statuses correct; count = 273.
5. **Routing (if D done):** `marketing.sturij.com/` serves the workspace; Google login succeeds on `/`.
6. **Lockdown intact:** anon still has no data access; RLS policies unchanged (still the two approved emails).
7. Branch + draft PR open; nothing merged until validated.

## 8. Open decisions (flag to Mark)

- **Slice D:** root rewrites to the workspace, **or** keep the hub as landing and just link to the workspace (Slice C only)?
- **Map B1:** link out to `group_reach_map.html`, or absorb it as a 7th **Reach** panel in the shell?
