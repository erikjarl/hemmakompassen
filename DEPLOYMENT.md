# Cloudflare deployment

Cloudflare Workers Builds is connected to GitHub `erikjarl/hemmakompassen` on `main`.

**Build command:** `npm run build`
**Deploy command:** `npx wrangler deploy`
**Output directory:** `dist` (set in `wrangler.jsonc`)

The build copies only six allowlisted frontend assets into `dist/`; the Git repository, test files, documentation, and temporary Wrangler files are not deployed. Do not set the asset directory to `.`.

After a successful deploy, verify:
- Homepage loads at https://hemmakompassen.erikbertiljarl.workers.dev
- `/.git/config`, `/ROADMAP.md`, `/tests/smoke.test.cjs` return 404
- `/app.js`, `/styles.css` load normally
- The demo banner remains visible until real auth, family pairing and RLS integration tests pass

Do not commit secret or service-role keys. `backend-config.js` contains only public Supabase connection details and keeps live mode disabled.
