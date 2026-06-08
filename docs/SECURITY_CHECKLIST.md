# Security checklist — one-time & per-release

Run before tagging a public release (`v1.7.x`).

---

## Repository secrets

- [ ] No `.env`, `.env.local`, or API keys committed (search: `git log -p --all -S 'API_KEY'`)
- [ ] `.gitignore` covers `.env*`, `frontend/public/wasm/`, `motor_transmutacion/public/wasm/`
- [ ] GitHub → Settings → Secrets and variables → Actions: only CI needs (none today)
- [ ] GitHub → Settings → Security → **Secret scanning** enabled (default for public repos)

## Cloudflare

- [ ] Deploy uses build command with `cd frontend` or `scripts/cloudflare-build.sh`
- [ ] No secrets in Cloudflare build variables (none required for v1.7.x)
- [ ] Worker name matches `wrangler.jsonc` (`camaleon`)
- [ ] Production branch = `main` only

## Application privacy model

- [ ] No `fetch()` uploads file bytes to third-party URLs in `frontend/src`
- [ ] No third-party analytics scripts in `layout.tsx` or `page.tsx`
- [ ] Legal pages match behavior (`/privacy`, `/terms`)

## Dependencies

- [ ] `npm ci && npm run build` passes in `frontend/`
- [ ] `cargo test --workspace` passes in `motor_transmutacion/`
- [ ] Dependabot enabled (`.github/dependabot.yml`)

## Release

- [ ] Version bumped in `frontend/package.json` if user-facing changes
- [ ] Tag matches version: `git tag v1.7.x`
- [ ] GitHub Release notes mention security-relevant changes
- [ ] Smoke test on production URL after deploy

---

## Quick secret scan (local)

```powershell
# From repo root — search tracked files for common patterns
git grep -iE '(api[_-]?key|secret|password|token)\s*[:=]' -- ':!*.md' ':!package-lock.json'
```

Empty output = good. Investigate any hits before release.
