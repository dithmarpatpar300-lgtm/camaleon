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

None required for v1.7.8. Add `NEXT_PUBLIC_*` variables under **Build variables** if needed later.

4. **Save and Deploy** → note your `*.workers.dev` URL.

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
| Peso estimado shows `—` | Same root cause — estimate runs in worker after Wasm init |

---

## References

- [Cloudflare Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare)
