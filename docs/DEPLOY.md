# Deploy Camaleon to Cloudflare

Production hosting uses **Cloudflare Workers** with the [@opennextjs/cloudflare](https://opennext.js.org/cloudflare) adapter (required for Next.js 15 SSR).

**Repository:** https://github.com/dithmarpatpar300-lgtm/camaleon

---

## Prerequisites

- [x] GitHub repo on `main` branch
- [x] Cloudflare account
- [x] OpenNext config in `frontend/` (`wrangler.jsonc`, `open-next.config.ts`)

---

## Local preview (before Cloudflare)

From `frontend/`:

```bash
npm ci
npm run build:wasm    # requires Rust + wasm-pack locally
npm run preview:cf    # builds + serves in Workers runtime
```

Deploy manually (requires `wrangler login`):

```bash
npm run deploy:cf
```

---

## Cloudflare dashboard — Git integration

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Import a repository**
2. Connect **GitHub** → select **`dithmarpatpar300-lgtm/camaleon`**
3. Production branch: **`main`**
4. **Build branches:** limit to **`main` only** (see [Branch builds](#branch-builds-which-branches-should-deploy))

### Build settings

| Field | Value |
|-------|--------|
| **Project name** | `camaleon` |
| **Root directory** | `/` (repo root — leave empty or `.`) |
| **Framework preset** | `None` (manual commands below) |

> **Why repo root?** `package-lock.json` lives in `frontend/`. The build scripts `cd` into `frontend` automatically. If you set Root directory to `frontend` instead, use the alternate commands in [Troubleshooting](#npm-ci--package-lockjson).

**Build command:**

```bash
bash scripts/cloudflare-build.sh
```

**Deploy command:**

```bash
bash scripts/cloudflare-deploy.sh
```

**Alternate build command** (if Root directory is already `frontend`):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable && . "$HOME/.cargo/env" && cargo install wasm-pack --locked && npm ci && npm run build:wasm && npm run build:cf
```

> First build may take 10–15 minutes (Rust toolchain + four Wasm crates). Retry if timeout occurs on Free plan.

### Environment variables

None required for v1.7.9. Add `NEXT_PUBLIC_*` variables under **Build variables** if needed later.

4. **Save and Deploy** → note your `*.workers.dev` URL.

### Branch builds (which branches should deploy?)

| Branch | Deploy to production? | Why |
|--------|----------------------|-----|
| **`main`** | **Yes** | Only branch that should update the live Worker |
| `dev` | **No** | Internal development; avoid overwriting production |
| `contrib` | **No** | Community PR target; not a release channel |
| `dependabot/*` | **No** | Dependency PRs must pass CI on GitHub, not auto-deploy |

In Cloudflare → Workers & Pages → **camaleon** → **Settings** → **Build** → **Branch control**:

- **Production branch:** `main`
- **Uncheck** “Builds for non-production branches”

With that box enabled (Cloudflare’s default for preview URLs), every push to `dev`, `contrib`, or `dependabot/*` runs the full build plus `npx wrangler versions upload` — that is why those rows fail while `main` can still succeed.

Each push to `dev`, `contrib`, or Dependabot currently triggers a full Rust + Wasm + OpenNext build (~10–15 min) and then fails or risks clobbering production. That wastes build minutes and creates noise in Build history.

**Recommended:** only `main` builds and deploys. Validate other branches with GitHub Actions (or manual `npm run preview:cf` locally).

---

## Custom domain

1. Project → **Settings** → **Domains & Routes** → **Add custom domain**
2. If the domain uses Cloudflare DNS, records are created automatically.
3. HTTPS certificate provisions within minutes.

---

## Post-deploy checklist

- [ ] Landing page loads with six tools
- [ ] At least one transmutation completes and downloads
- [ ] `/privacy`, `/about`, `/terms`, `/contact` render in EN and ES
- [ ] DevTools → Network: no file uploads to third parties
- [ ] DevTools → no 404 on `/wasm/transmutador_*/*.wasm`

---

## Security & abuse (Cloudflare dashboard)

Manual steps after first successful deploy. See also [docs/OPERATIONS.md](OPERATIONS.md).

| Task | Path | Recommendation |
|------|------|----------------|
| Bot Fight Mode | Security → Bots | Off initially; enable if scraping/abuse spikes |
| Security Level | Security → Settings | **Medium** default |
| Notifications | Account → Notifications | Email on failed Workers Builds |
| Analytics baseline | Workers → camaleon → Analytics | Note normal requests/day for comparison |
| Custom domain | Workers → Settings → Domains | Reduces impersonation risk when ready |

**Not needed now:** “I’m Under Attack” mode, paid WAF rulesets, per-IP rate limits unless abuse occurs.

---

## Troubleshooting

### `npm ci` — package-lock.json

```
npm error The npm ci command can only install with an existing package-lock.json
```

**Cause:** Build ran from repo root, but `npm ci` expected `frontend/package-lock.json`.

**Fix (pick one):**

1. **Recommended:** Root directory = `/` (empty) + build command `bash scripts/cloudflare-build.sh`
2. **Or:** Root directory = `frontend` + keep the alternate inline build command above
3. **Or:** Inline from repo root: `cd frontend && npm ci && npm run build:wasm && npm run build:cf`

| Issue | Fix |
|-------|-----|
| Wasm 404 | Confirm `build:wasm` runs in build command |
| Build timeout | Retry deployment; consider GitHub Actions deploy |
| `nodejs_compat` error | Verify `compatibility_flags` in `wrangler.jsonc` |
| Wrong repo links in app | Update `SITE_REPO_URL` in `frontend/src/lib/site.ts` |
| `Failed to fetch dynamically imported module: .../wasm/...` | Wasm not in deploy assets — ensure `build:cf` runs `sync-wasm-assets.mjs`; redeploy |
| OpenNext/esbuild: `Could not resolve "/wasm/transmutador_*.js"` | Wasm glue must load via `importWasmGlue()` (`lib/wasm/load-glue.ts`) — literal `import("/wasm/...")` breaks the Cloudflare worker bundle |
| `sync-wasm-assets: missing public/wasm` | Old `build:wasm` wrote to wrong path — use `node scripts/build-wasm.mjs` (fixed in repo) |
| Peso estimado shows `—` | Same root cause — estimate runs in worker after Wasm init |
| `Missing entry-point to Worker script` on deploy | Deploy ran from repo root without `wrangler.jsonc`. **Fix:** set Deploy command to `bash scripts/cloudflare-deploy.sh`, or use root `wrangler.jsonc` (paths under `frontend/.open-next/`). Do **not** leave the default `npx wrangler versions upload` alone unless root config exists. |
| Build succeeds, deploy fails on `dev` / `contrib` / Dependabot | Disable preview builds; only `main` should deploy (see [Branch builds](#branch-builds-which-branches-should-deploy)) |

---

## References

- [Cloudflare Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare)
