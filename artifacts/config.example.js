// LOCAL DEV ONLY — do not commit real keys.
//
// In production the app fetches its config from /api/config (backed by Vercel
// env vars), so you normally don't need this file. It exists only for running
// the ledger locally without `vercel dev`.
//
// To use: copy this file to `config.js` (which is gitignored), fill in your
// project's URL and PUBLIC anon key, and add this line to group_ledger.html
// just before the <script type="module"> tag:
//
//   <script src="config.js"></script>
//
// Never put the service_role key here — only the public anon key.
window.SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_PUBLIC_ANON_KEY'
};
