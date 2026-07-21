import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const API_KEY = Deno.env.get("API_KEY") ?? "";
const MODEL = "gemini-2.5-flash-image";

const FALLBACK = ["contact@sturij.com", "mark.walton@gmail.com"];
// Allowlist lives in the approved_users table (Sprint 2). If the table doesn't
// exist yet (e.g. production before adoption) or the lookup fails, fall back to
// the legacy hardcoded pair — never fail open.
async function isApproved(email: string | null): Promise<boolean> {
  const e = (email || "").toLowerCase();
  if (!e) return false;
  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !key) return FALLBACK.includes(e);
    const r = await fetch(url + "/rest/v1/approved_users?select=email&email=eq." + encodeURIComponent(e) + "&active=is.true",
      { headers: { apikey: key, Authorization: "Bearer " + key } });
    if (!r.ok) return FALLBACK.includes(e);
    const rows = await r.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch { return FALLBACK.includes(e); }
}

// All modes are colour/light-only. They never add, remove, or alter content.
const INSTRUCTIONS: Record<string, string> = {
  enhance:
    "You are a careful photo-retoucher. Improve ONLY the lighting, exposure, white balance, colour " +
    "balance, contrast and clarity of this photograph so it looks cleanly and professionally shot. " +
    "Absolutely do NOT add, remove, move, replace or alter any objects, people, furniture, text, " +
    "logos or surfaces. Do not change the composition, the framing or the crop. Do not invent or " +
    "hallucinate any detail that is not already present. Keep it the same real photograph, just " +
    "better lit and colour-corrected. Return only the improved image.",
  balance:
    "This image is a composite/collage of several photographs arranged in panels or tiles. " +
    "Harmonise them so the whole thing reads as ONE cohesive advert: match the white balance, " +
    "exposure, brightness, contrast and colour temperature across the panels so no tile looks warmer, " +
    "cooler, darker or lighter than the others, and gently balance the overall lighting. " +
    "Absolutely do NOT add, remove, move, replace or alter any objects, people, furniture, text or " +
    "logos. Do not change the layout, the panel boundaries, the framing or the crop. Colour and " +
    "light only. Return only the balanced image.",
};

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
function findImagePart(data: any): { mime: string; b64: string } | null {
  const cands = data && data.candidates;
  if (!Array.isArray(cands)) return null;
  for (const c of cands) {
    const parts = c && c.content && c.content.parts;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      const inl = p.inline_data || p.inlineData;
      if (inl && inl.data) return { mime: inl.mime_type || inl.mimeType || "image/png", b64: inl.data };
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const email = jwtEmail((req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, ""));
  if (!(await isApproved(email))) return json({ error: "unauthorized" }, 401);
  if (!API_KEY) return json({ error: "image enhance is not configured (no key)" }, 500);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad request" }, 400); }
  const b64 = typeof body.image_base64 === "string" ? body.image_base64 : "";
  const mime = typeof body.mime_type === "string" && body.mime_type.startsWith("image/") ? body.mime_type : "image/jpeg";
  const mode = body.mode === "balance" ? "balance" : "enhance";
  if (!b64) return json({ error: "no image supplied" }, 400);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const payload = {
    contents: [{ role: "user", parts: [ { text: INSTRUCTIONS[mode] }, { inline_data: { mime_type: mime, data: b64 } } ] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], temperature: 0.2 },
  };

  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) { const t = await r.text(); return json({ error: `model error ${r.status}`, detail: t.slice(0, 400) }, 502); }
    const data = await r.json();
    const img = findImagePart(data);
    if (!img) {
      const fb = data && data.promptFeedback ? JSON.stringify(data.promptFeedback).slice(0, 300) : "";
      return json({ error: "no image returned", detail: fb }, 502);
    }
    return json({ image_base64: img.b64, mime_type: img.mime });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
