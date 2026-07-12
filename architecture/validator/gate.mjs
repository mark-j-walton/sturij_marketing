#!/usr/bin/env node
// Sturij V1 Workspace — read-only Merge Gate (the anti-hallucination validator).
//
// Checks the dev's build against REALITY: the live Supabase DB, the deployed page,
// and (guided) the branch/PR. It NEVER writes: DB access is GET-only against
// PostgREST with the anon key; the deploy is fetched, not touched; git/PR state is
// reported as a guided checklist, not mutated.
//
// Each check maps to an acceptance criterion in ../SPRINT_SPEC_V1_workspace.md §10.
// Baselines come from ./baselines.json (pinned from the live DB, not from prose).
//
// Verdict rule:  any FAIL -> DO-NOT-MERGE.  else any HOLD -> HOLD (not safe yet).
//                all PASS/INFO -> SAFE-TO-MERGE.
//
// Usage:
//   node gate.mjs --deploy https://<preview-or-prod> [--page /app.html]
//                 [--html <url-or-local-path>]   # app HTML source if deploy is auth-walled
//                 [--json]
//   Requires Node >= 18 (global fetch). No npm install.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const B = JSON.parse(await readFile(resolve(HERE, "baselines.json"), "utf8"));

// ---- args ------------------------------------------------------------------
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(k);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const has = (k) => argv.includes(k);
const CFG = {
  supabaseUrl: arg("--supabase-url", B.supabase_url),
  anonKey: arg("--anon-key", B.anon_key),
  deploy: arg("--deploy", null),
  page: arg("--page", "/app.html"),
  html: arg("--html", null), // explicit app-HTML source when deploy is auth-walled
  sprintStart: arg("--sprint-start", B.sprint_start),
  json: has("--json"),
};

// ---- tiny read-only Supabase (PostgREST) client ----------------------------
async function rest(path, { count = false } = {}) {
  const headers = { apikey: CFG.anonKey, Authorization: `Bearer ${CFG.anonKey}` };
  if (count) headers.Prefer = "count=exact";
  const res = await fetch(`${CFG.supabaseUrl}/rest/v1/${path}`, { headers });
  const body = await res.text();
  let json = null;
  try { json = JSON.parse(body); } catch { /* non-JSON (error page) */ }
  let total = null;
  const cr = res.headers.get("content-range"); // e.g. "0-25/273"
  if (cr && cr.includes("/")) total = Number(cr.split("/")[1]);
  return { ok: res.ok, status: res.status, json, total, body };
}
const enc = encodeURIComponent;

// ---- result plumbing -------------------------------------------------------
const results = [];
const add = (id, ac, title, status, detail) => results.push({ id, ac, title, status, detail });
const P = "PASS", F = "FAIL", H = "HOLD", I = "INFO";

// ============================================================================
// AC2 — 273 live groups, real tiers/reach, spot-checks
// ============================================================================
async function checkGroups() {
  try {
    const c = await rest("groups?select=id", { count: true });
    if (!c.ok) return add("groups.count", 2, "273 live groups reachable via anon key", F,
      `groups query failed (HTTP ${c.status}). ${trunc(c.body)}`);
    if (c.total !== B.groups.total)
      add("groups.count", 2, "273 live groups", F, `expected ${B.groups.total}, got ${c.total}`);
    else
      add("groups.count", 2, "273 live groups", P, `count = ${c.total}`);

    // tier mix
    const t = await rest("groups?select=tier");
    if (t.ok && Array.isArray(t.json)) {
      const mix = t.json.reduce((m, r) => ((m[r.tier] = (m[r.tier] || 0) + 1), m), {});
      const want = B.groups.tier_mix;
      const okMix = ["green", "amber", "red"].every((k) => (mix[k] || 0) === want[k]);
      add("groups.tiers", 2, "Tier mix matches DB", okMix ? P : F,
        `got ${JSON.stringify(mix)}, baseline ${JSON.stringify(want)}`);
    }

    // spot-checks (exact names — the reason the gate exists: prose said "Crossgates=170"
    // but 4 Crossgates groups exist; only this exact one is 170)
    for (const s of B.groups.spot_checks) {
      const r = await rest(`groups?name=eq.${enc(s.name)}&select=name,fb_views,tier`);
      const row = r.ok && Array.isArray(r.json) ? r.json[0] : null;
      if (!row) add(`groups.spot.${s.name}`, 2, `Spot-check: ${s.name}`, F, "group not found by exact name");
      else if (row.fb_views !== s.fb_views)
        add(`groups.spot.${s.name}`, 2, `Spot-check: ${s.name}`, F,
          `fb_views expected ${s.fb_views}, got ${row.fb_views}`);
      else add(`groups.spot.${s.name}`, 2, `Spot-check: ${s.name}`, P,
        `fb_views ${row.fb_views}, tier ${row.tier}`);
    }
  } catch (e) {
    add("groups", 2, "Groups reachable", F, `error: ${e.message}`);
  }
}

// ============================================================================
// AC3 (data precondition) — Boston Spa Grumbler is the only Tuesday-locked group
// (The Plan's ≤12 behaviour is interactive; see the guided checklist.)
// ============================================================================
async function checkRuleData() {
  try {
    const r = await rest("groups?select=name,posting_days");
    if (!r.ok || !Array.isArray(r.json)) return add("rules.tue", 3, "Tuesday-lock data", H,
      "could not read posting_days; confirm in Plan manually");
    const tue = r.json
      .filter((g) => (g.posting_days || []).some((d) => /^tue/i.test(d)))
      .map((g) => g.name);
    const want = B.groups.tuesday_locked_only;
    const same = tue.length === want.length && want.every((n) => tue.includes(n));
    add("rules.tue", 3, "Only Boston Spa Grumbler is Tue-locked (data precondition for Plan)",
      same ? P : F, `Tue-locked groups in DB: ${JSON.stringify(tue)}`);
  } catch (e) {
    add("rules.tue", 3, "Tuesday-lock data", F, `error: ${e.message}`);
  }
}

// ============================================================================
// AC4 — "Mark posted" writes a REAL posting_log row (app-sourced, has an account)
// ============================================================================
async function checkRealPost() {
  try {
    const r = await rest(
      `posting_log?source=eq.${enc(B.posting_log.app_source)}&posted_on=gte.${enc(CFG.sprintStart)}&select=posted_on,account,group_id,variation&order=posted_on.desc`
    );
    if (!r.ok) return add("post.real", 4, "Real app-written posting_log row", H,
      `query failed (HTTP ${r.status}); re-run after the dev tests "Mark posted"`);
    const rows = Array.isArray(r.json) ? r.json : [];
    if (rows.length === 0)
      return add("post.real", 4, "Real app-written posting_log row (source='app')", H,
        "none yet — the app hasn't written a real post. Do one 'Mark posted' in the build, then re-run.");
    const withAccount = rows.filter((x) => x.account && String(x.account).trim());
    if (withAccount.length === 0)
      add("post.real", 4, "App post carries the signed-in account", F,
        `${rows.length} app row(s) but account is null — sign-in identity not captured`);
    else
      add("post.real", 4, "Real app-written posting_log row with account", P,
        `${rows.length} app row(s); latest ${withAccount[0].posted_on} by "${withAccount[0].account}"`);
  } catch (e) {
    add("post.real", 4, "Real app-written posting_log row", F, `error: ${e.message}`);
  }
}

// ============================================================================
// AC5 — Guardrails HELD: no app-day over cap, no app re-post inside the cooldown.
// (Scoped to app rows only — the reconstructed 23-burst seed is legitimately over.)
// ============================================================================
async function checkGuardrails() {
  try {
    const r = await rest(
      `posting_log?source=eq.${enc(B.posting_log.app_source)}&select=posted_on,group_id&order=posted_on.asc`
    );
    if (!r.ok) return add("guard", 5, "Guardrails held (app rows)", H,
      `query failed (HTTP ${r.status})`);
    const rows = Array.isArray(r.json) ? r.json : [];
    if (rows.length === 0)
      return add("guard", 5, "Guardrails held (cap + cooldown, app rows)", H,
        "no app posts yet to check the invariant. Enforcement is proven by attempting a 13th in-app (see checklist), then re-running here.");

    // cap: no calendar day over the cap
    const perDay = rows.reduce((m, x) => ((m[x.posted_on] = (m[x.posted_on] || 0) + 1), m), {});
    const overCap = Object.entries(perDay).filter(([, n]) => n > B.guardrails.daily_cap);
    // cooldown: same group re-posted within N days
    const byGroup = {};
    const violations = [];
    for (const x of rows) {
      const prev = byGroup[x.group_id];
      if (prev) {
        const gap = (Date.parse(x.posted_on) - Date.parse(prev)) / 86400000;
        if (gap < B.guardrails.cooldown_days) violations.push({ group_id: x.group_id, gap });
      }
      byGroup[x.group_id] = x.posted_on;
    }
    if (overCap.length || violations.length)
      add("guard", 5, "Guardrails held in the data (cap + cooldown)", F,
        `cap breaches: ${JSON.stringify(overCap)}; cooldown breaches: ${JSON.stringify(violations)} — the guard let bad rows through`);
    else
      add("guard", 5, "Guardrails held in the data (cap + cooldown, app rows)", P,
        `${rows.length} app rows, max/day ${Math.max(...Object.values(perDay))} ≤ ${B.guardrails.daily_cap}, no cooldown breach`);
  } catch (e) {
    add("guard", 5, "Guardrails held", F, `error: ${e.message}`);
  }
}

// ============================================================================
// AC6 — DNA persists to the `dna` table
// ============================================================================
async function checkDna() {
  try {
    const r = await rest("dna?select=id,slug,updated_at&limit=5", { count: true });
    if (r.status === 404 || (r.body && /relation .*dna.* does not exist|Could not find the table/i.test(r.body)))
      return add("dna", 6, "`dna` table exists and persists edits", F,
        "table `dna` does not exist yet — DNA section unbuilt or still repo-files-only (§11 open decision)");
    if (!r.ok) return add("dna", 6, "`dna` table reachable", H, `HTTP ${r.status}: ${trunc(r.body)}`);
    const n = r.total ?? (Array.isArray(r.json) ? r.json.length : 0);
    if (!n) add("dna", 6, "`dna` table seeded", F, "table exists but is empty — not seeded from the DNA docs");
    else add("dna", 6, "`dna` table exists and holds rows", P,
      `${n} row(s). To prove persistence: edit one in-app, re-run — updated_at must advance.`);
  } catch (e) {
    add("dna", 6, "`dna` table", F, `error: ${e.message}`);
  }
}

// ============================================================================
// AC1 + AC7 — deploy: no service key leaked, auth wall present, chrome matches
// ============================================================================
async function checkDeploy() {
  const source = CFG.html || (CFG.deploy ? joinUrl(CFG.deploy, CFG.page) : null);
  if (!source)
    return add("deploy", 1, "Deploy checks (auth, no leaked key, chrome)", H,
      "no --deploy/--html given. Pass the PR-preview URL to auto-scan; skipping deploy-side checks.");

  let html, status, protectedWall = false;
  try {
    if (/^https?:\/\//.test(source)) {
      const res = await fetch(source, { redirect: "follow" });
      status = res.status;
      html = await res.text();
      protectedWall = status === 401 || /Authentication Required|vercel.*sso|Deployment.*Protection/i.test(html);
    } else {
      html = await readFile(resolve(process.cwd(), source), "utf8");
      status = 200;
    }
  } catch (e) {
    return add("deploy", 1, "Deploy reachable", F, `could not fetch ${source}: ${e.message}`);
  }

  if (protectedWall) {
    add("deploy.auth", 1, "Page is behind an auth / deployment-protection wall", P,
      `unauthenticated fetch returned a protection wall (HTTP ${status}). Good — but that hides the app HTML.`);
    add("deploy.scan", 1, "Scan app source (leaked key + chrome)", H,
      "deploy is protected, so the app HTML can't be scanned unauthenticated. Re-run with --html pointing at the app HTML source (e.g. saved-from-authenticated-session or the branch file).");
    return;
  }

  // Not walled: we can see the HTML. AC1 says it SHOULD be behind auth.
  const hasSignin = /supabase\.auth|signInWith|sign[\s-]?in|auth-gate|login/i.test(html);
  add("deploy.auth", 1, "Auth gate present (page not wide-open)", hasSignin ? P : H,
    hasSignin
      ? "sign-in / auth markers found in served HTML"
      : "no auth markers and no protection wall — confirm Vercel Deployment Protection is ON at the edge (can't be seen from HTML)");

  // leaked service key — the one thing that must NEVER ship
  const leak = /service_role|sb_secret_[A-Za-z0-9]/.test(html);
  add("deploy.key", 1, "No service-role/secret key in client source", leak ? F : P,
    leak ? "SERVICE KEY PATTERN FOUND IN CLIENT HTML — hard stop" : "only publishable/anon key present");

  // chrome markers (AC7) — presence check; visual match is still a human confirm
  const marks = {
    rail: /class=["'][^"']*\brail\b/.test(html),
    topbar: /class=["'][^"']*\btopbar\b/.test(html),
    themeToggle: /theme-toggle|theme-switch|◐/.test(html),
    fonts: /DM Serif Display/.test(html) && /IBM Plex Mono/.test(html),
  };
  const missing = Object.entries(marks).filter(([, v]) => !v).map(([k]) => k);
  add("deploy.chrome", 7, "Chrome markers match index.html (rail/topbar/theme/fonts)",
    missing.length ? H : P,
    missing.length ? `missing markers: ${missing.join(", ")} — verify against index.html by rendering` : "all chrome markers present (still confirm the render visually)");
}

// ============================================================================
// AC8 + interactive — guided checklist (git/PR + in-app behaviours the gate can't drive)
// ============================================================================
function guidedChecklist() {
  add("plan.cap", 3, "Plan Today ≤ 12, greens first (interactive)", H,
    "Open Plan → Today: assert ≤12 slots, greens first, Boston Spa Grumbler only on a Tuesday.");
  add("post.block", 5, "Over-cap / in-cooldown post is BLOCKED (interactive)", H,
    "In-app, attempt a 13th post today and a re-post to a group posted <14d ago — both must be refused. Then re-run: `guard` must still PASS (no bad row written).");
  add("repo.state", 8, "Repo gate green · local==remote · draft PR open · nothing merged", H,
    "Architect-run: confirm CI/gate green, `git rev-parse HEAD` == remote, a DRAFT PR is open on the dev branch, and nothing is merged to main.");
}

// ---- helpers ---------------------------------------------------------------
function trunc(s, n = 160) { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; }
function joinUrl(base, path) { return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, ""); }

// ---- run --------------------------------------------------------------------
await checkGroups();
await checkRuleData();
await checkRealPost();
await checkGuardrails();
await checkDna();
await checkDeploy();
guidedChecklist();

// ---- verdict ----------------------------------------------------------------
const counts = results.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
const verdict = counts[F] ? "DO-NOT-MERGE" : counts[H] ? "HOLD (not safe yet)" : "SAFE-TO-MERGE";

if (CFG.json) {
  console.log(JSON.stringify({ verdict, counts, results, config: { deploy: CFG.deploy, page: CFG.page } }, null, 2));
  process.exit(counts[F] ? 2 : counts[H] ? 1 : 0);
}

const glyph = { PASS: "✓", FAIL: "✗", HOLD: "⋯", INFO: "·" };
console.log(`\n  STURIJ V1 WORKSPACE — MERGE GATE  (read-only, ${new Date(Date.now()).toISOString().slice(0, 10)})`);
console.log(`  DB ${CFG.supabaseUrl}   deploy ${CFG.deploy || "(not given)"}\n`);
for (const r of results)
  console.log(`  ${glyph[r.status] || "?"} [AC${r.ac}] ${r.status.padEnd(4)} ${r.title}\n        ${r.detail}`);
console.log(`\n  ${counts[P] || 0} pass · ${counts[F] || 0} fail · ${counts[H] || 0} hold`);
console.log(`\n  ==> ${verdict}\n`);
process.exit(counts[F] ? 2 : counts[H] ? 1 : 0);
