// seed-demo — STAGING ONLY. Loads or resets the shared demo workspace so every
// tester starts from the same known state: ~40 fictional Yorkshire groups,
// placeholder photos, saved adverts, themes, DNA, a plausible posting history
// (including two groups deliberately inside their cooldown) and one restriction.
// Refuses to run anywhere but the staging project, and never touches
// approved_users or templates. Modes: {mode:"seed"} (only when empty),
// {mode:"reset"} (wipe demo tables + re-seed).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const STAGING_REF = "srezefvaahdiiczakadx";
const FALLBACK = ["contact@sturij.com", "mark.walton@gmail.com"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function jwtEmail(token: string): string | null {
  try { const p = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); return p.email || (p.user_metadata && p.user_metadata.email) || null; } catch { return null; }
}
async function isApproved(sb: ReturnType<typeof createClient>, email: string): Promise<boolean> {
  const e = (email || "").toLowerCase();
  try {
    const { data, error } = await sb.from("approved_users").select("email").eq("email", e).eq("active", true);
    if (error) return FALLBACK.includes(e);
    return Array.isArray(data) && data.length > 0;
  } catch { return FALLBACK.includes(e); }
}

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86400000);
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

// [region grouping in the app is inferred from `area`, so areas are real Yorkshire towns]
const GROUPS: Array<[string, string, string, number, boolean, string[] | null]> = [
  // name, area, tier, reach(views; 0 = none), hasLink, posting_days
  ["Harrogate Home & Interiors", "Harrogate", "green", 180, true, null],
  ["York Makers & Trades", "York", "green", 150, true, null],
  ["Leeds Homes & Renovations", "Leeds", "green", 140, true, null],
  ["Wetherby Noticeboard", "Wetherby", "green", 120, true, ["Tue", "Fri"]],
  ["Ilkley Local Living", "Ilkley", "green", 100, true, null],
  ["Ripon Community Hub", "Ripon", "green", 95, true, null],
  ["Skipton & Dales Life", "Skipton", "green", 80, true, ["Mon"]],
  ["Sheffield South Homes", "Sheffield", "green", 75, true, null],
  ["Otley & Wharfedale People", "Otley", "amber", 60, true, null],
  ["Beverley Buy & Sell", "Beverley", "amber", 55, true, null],
  ["Knaresborough Chat", "Knaresborough", "amber", 0, true, null],
  ["Tadcaster Talk", "Tadcaster", "amber", 0, true, null],
  ["Selby District Notices", "Selby", "amber", 0, true, null],
  ["Halifax Homes & DIY", "Halifax", "amber", 0, true, ["Wed", "Sat"]],
  ["Huddersfield House & Garden", "Huddersfield", "amber", 0, true, null],
  ["Wakefield Living", "Wakefield", "amber", 0, false, null],
  ["Bradford Home Improvement", "Bradford", "amber", 0, false, null],
  ["Thirsk & Villages", "Thirsk", "amber", 0, false, null],
  ["Northallerton Noticeboard", "Northallerton", "amber", 0, false, null],
  ["Boston Spa Village Life", "Boston Spa", "amber", 0, false, null],
  ["Pontefract & District", "Pontefract", "amber", 0, false, null],
  ["Castleford Community", "Castleford", "amber", 0, false, null],
  ["Keighley Local", "Keighley", "amber", 0, false, null],
  ["Bingley Bulletin", "Bingley", "amber", 0, false, null],
  ["Guiseley & Yeadon Chat", "Guiseley", "amber", 0, false, null],
  ["Horsforth Hub", "Horsforth", "amber", 0, false, null],
  ["Chapel Allerton Locals", "Leeds", "amber", 0, false, null],
  ["Roundhay Residents", "Leeds", "amber", 0, false, null],
  ["Moortown & Meanwood", "Leeds", "amber", 0, false, null],
  ["Hull Home & Trade", "Hull", "amber", 0, false, null],
  ["Driffield & Wolds", "Driffield", "amber", 0, false, null],
  ["Malton & Norton Notices", "Malton", "amber", 0, false, null],
  ["Pickering Local Life", "Pickering", "amber", 0, false, null],
  ["Richmond & Dales Community", "Richmond", "amber", 0, false, null],
  ["Doncaster House & Home", "Doncaster", "amber", 0, false, null],
  ["Barnsley Home Front", "Barnsley", "red", 0, true, null],
  ["Rotherham Ads Board", "Rotherham", "red", 0, false, null],
  ["Free Ads Yorkshire (anything goes)", "Leeds", "red", 0, false, null],
  ["Yorkshire Bargain Hunters", "York", "red", 0, false, null],
  ["Hull Buy Sell Swap", "Hull", "red", 0, false, null],
];

// Placeholder images are generated at runtime as small SVGs — no binary payloads.
const DEMO_IMAGES = [
  { label: "Oak wardrobe", c1: "#8b6a44", c2: "#d4aa58" },
  { label: "Media wall",   c1: "#5b7a8a", c2: "#20384a" },
  { label: "Kitchen",      c1: "#7a6a55", c2: "#a98d5f" },
  { label: "Home office",  c1: "#4a6c59", c2: "#8fae9b" },
];
function svgBytes(img: { label: string; c1: string; c2: string }): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">` +
    `<rect width="480" height="360" fill="${img.c1}"/>` +
    `<polygon points="0,360 480,120 480,360" fill="${img.c2}"/>` +
    `<rect x="20" y="20" width="440" height="320" fill="none" stroke="#faf8f2" stroke-width="4"/>` +
    `<text x="240" y="188" font-family="Georgia, serif" font-size="28" fill="#faf8f2" text-anchor="middle">${img.label} — demo</text>` +
    `</svg>`;
  return new TextEncoder().encode(svg);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  if (!url.includes(STAGING_REF)) {
    return json({ error: "seed-demo only runs on the staging project — refused." }, 403);
  }
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!key) return json({ error: "service key unavailable" }, 500);
  const sb = createClient(url, key);

  const email = jwtEmail((req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, ""));
  if (!email || !(await isApproved(sb, email))) return json({ error: "unauthorized" }, 401);

  let body: { mode?: string } = {};
  try { body = await req.json(); } catch { /* default */ }
  const mode = body.mode === "reset" ? "reset" : "seed";

  try {
    if (mode === "seed") {
      const { count } = await sb.from("groups").select("id", { count: "exact", head: true });
      if ((count ?? 0) > 0) return json({ error: "Demo data already loaded — use Reset to start fresh." }, 409);
    }

    if (mode === "reset") {
      // wipe demo tables (never approved_users / templates)
      for (const t of ["posting_log", "scheduled_posts", "compositions", "photos", "videos", "themes", "dna", "restrictions", "support_tickets", "groups"]) {
        const { error } = await sb.from(t).delete().gte("created_at", "1970-01-01");
        if (error) throw new Error(`wipe ${t}: ${error.message}`);
      }
      const { data: objs } = await sb.storage.from("photos").list("demo");
      if (objs && objs.length) {
        await sb.storage.from("photos").remove(objs.map((o: { name: string }) => `demo/${o.name}`));
      }
    }

    // ---- storage: 4 placeholder images ----
    const photoPaths: string[] = [];
    for (let i = 0; i < DEMO_IMAGES.length; i++) {
      const path = `demo/demo-${i + 1}.svg`;
      const { error } = await sb.storage.from("photos").upload(path, svgBytes(DEMO_IMAGES[i]), { contentType: "image/svg+xml", upsert: true });
      if (error) throw new Error(`upload ${path}: ${error.message}`);
      photoPaths.push(path);
    }

    // ---- groups ----
    const groupRows = GROUPS.map(([name, area, tier, views, hasLink, days]) => ({
      name, area, tier,
      url: hasLink ? `https://www.facebook.com/groups/demo-${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}` : null,
      posting_days: days ?? [],
      fb_views: views || null,
      fb_impressions: views ? Math.round(views * 0.7) : null,
      fb_source: views ? "demo seed" : null,
      context_summary: `Demo group for testing — ${area} area. Not a real Facebook group.`,
      official_rules: tier === "red" ? "Ads only on Sundays; admins strict — demo rule." : null,
      confirmed: true,
    }));
    const { data: gRows, error: gErr } = await sb.from("groups").insert(groupRows).select("id,name,tier,fb_views");
    if (gErr) throw new Error(`groups: ${gErr.message}`);

    // ---- photos: 8 rows over 4 files (6 cleared, 2 not) ----
    const tagSets = [["wardrobe", "oak"], ["media wall", "living room"], ["kitchen", "shaker"], ["home office", "desk"],
                     ["wardrobe", "walk-in"], ["media wall", "fireplace"], ["kitchen", "island"], ["home office", "shelving"]];
    const photoRows = tagSets.map((tags, i) => ({
      storage_path: photoPaths[i % 4], thumb_path: photoPaths[i % 4],
      width: 480, height: 360, bytes: 7000, mime: "image/svg+xml",
      tags, description: `Demo photo — ${tags.join(", ")}`,
      photo_state: i % 3 === 0 ? "pro" : (i % 3 === 1 ? "retouched" : "raw"),
      cleared_for_public: i < 6,
      cleared_by: i < 6 ? "Demo seed" : null,
      cleared_at: i < 6 ? new Date().toISOString() : null,
      uploader: "Demo seed",
    }));
    const { data: phRows, error: phErr } = await sb.from("photos").insert(photoRows).select("id");
    if (phErr) throw new Error(`photos: ${phErr.message}`);
    const pid = (i: number) => phRows![i].id;

    // ---- compositions (saved adverts) ----
    const cell = (i: number) => ({ photo_id: pid(i), z: 1, fx: 0.5, fy: 0.5, locked: false });
    const { error: coErr } = await sb.from("compositions").insert([
      { title: "Oak wardrobe montage", template_id: "grid2x2", cells: [cell(0), cell(4), cell(1), cell(5)], tags: ["wardrobe"], thumb_path: photoPaths[0], image_path: photoPaths[0], copy: "Floor-to-ceiling oak wardrobe, built for an awkward alcove — demo advert." },
      { title: "Media wall before/after", template_id: "grid2x2", cells: [cell(1), cell(5), cell(2), cell(6)], tags: ["media wall"], thumb_path: photoPaths[1], image_path: photoPaths[1], copy: "Bespoke media wall with hidden cabling — demo advert." },
    ]);
    if (coErr) throw new Error(`compositions: ${coErr.message}`);

    // ---- posting history (source='demo history' passes the guardrail trigger untouched) ----
    const byName = new Map((gRows ?? []).map((g: { name: string; id: string }) => [g.name, g.id]));
    const hist: Array<{ group_id: unknown; group_name: string; posted_on: string; variation: string; content_hash: string; account: string; source: string }> = [];
    const histPlan: Array<[string, number[]]> = [
      ["Harrogate Home & Interiors", [16, 31]], ["York Makers & Trades", [18, 33]],
      ["Leeds Homes & Renovations", [20]], ["Wetherby Noticeboard", [22, 36]],
      ["Ilkley Local Living", [24]], ["Ripon Community Hub", [26]],
      ["Skipton & Dales Life", [15]], ["Sheffield South Homes", [17]],
      ["Otley & Wharfedale People", [19]], ["Beverley Buy & Sell", [21]],
      ["Knaresborough Chat", [5]],   // deliberately IN cooldown — testers see a refusal
      ["Tadcaster Talk", [9]],        // deliberately IN cooldown
    ];
    for (const [name, days] of histPlan) {
      for (const d of days) {
        hist.push({ group_id: byName.get(name), group_name: name, posted_on: daysAgo(d), variation: "A", content_hash: "demo" + d, account: "Demo — personal", source: "demo history" });
      }
    }
    const { error: plErr } = await sb.from("posting_log").insert(hist);
    if (plErr) throw new Error(`posting_log: ${plErr.message}`);

    // ---- plan queue: 3 pending jobs for today ----
    const today = daysAgo(0);
    const { error: spErr } = await sb.from("scheduled_posts").insert(
      ["Harrogate Home & Interiors", "York Makers & Trades", "Leeds Homes & Renovations"].map((n) => ({
        group_id: byName.get(n), group_name: n, planned_on: today, status: "pending", created_by: "Demo seed",
      })));
    if (spErr) throw new Error(`scheduled_posts: ${spErr.message}`);

    // ---- themes, dna, restriction ----
    await sb.from("themes").insert([
      { category: "Media Wall", subcategory: "New Media Wall", description: "A freshly built bespoke media wall — feature fireplace, floating shelves, hidden storage. Emphasise the transformation.", sort: 10 },
      { category: "Wardrobes", subcategory: "Fitted Wardrobe", description: "Floor-to-ceiling fitted wardrobe built into an awkward space — soft-close, made-to-measure.", sort: 20 },
    ]);
    await sb.from("dna").insert([
      { category: "Voice & Personality", title: "Core voice", slug: "demo-core-voice", body: "Direct, fearless, grounded in the material world. Talk to people the way you'd text a mate. Never brochure-speak. (Demo copy.)" },
      { category: "Reference", title: "Credibility guards", slug: "demo-credibility", body: "Speak like a maker, not a catalogue. Real jobs and real photos only — never stock or invented work. (Demo copy.)" },
      { category: "Strategy", title: "Soft call to action", slug: "demo-cta", body: "End with an easy, no-pressure invitation — happy to talk options through, no hard sell. (Demo copy.)" },
    ]);
    await sb.from("restrictions").insert([
      { restricted_on: "2026-06-01", severity: "temp_block", likely_trigger: "burst posting (demo record)", appealed: true, appeal_outcome: "reinstated", account: "Demo — personal" },
    ]);

    return json({
      ok: true, mode,
      seeded: { groups: gRows?.length ?? 0, photos: phRows?.length ?? 0, adverts: 2, history: hist.length, queue: 3, themes: 2, dna: 3, restrictions: 1 },
    });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
