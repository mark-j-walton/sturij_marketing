// Vercel serverless function — serves the PUBLIC Supabase config to the client.
//
// Only the anon (public) key is exposed here. It is designed to be shipped to
// the browser and is protected by row-level security; the service_role key must
// NEVER be sent to the client or placed in these env vars for client use.
//
// Values come from Vercel environment variables (Project Settings → Environment
// Variables), so no key is ever committed to the repo — CLAUDE.md rule 8.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || ''
  });
}
