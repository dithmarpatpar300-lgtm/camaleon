# Operations playbook

Lightweight monitoring for Camaleon in production. No backend, no PII — focus on **availability**, **abuse**, and **dependencies**.

**Live repo:** https://github.com/dithmarpatpar300-lgtm/camaleon

---

## Weekly check (5 minutes)

1. Open production URL → confirm landing loads.
2. Spot-check one transmutation (e.g. JPG → PNG) end-to-end.
3. GitHub → **Security** tab → triage new Dependabot alerts.
4. Cloudflare → Workers & Pages → **camaleon** → Analytics → note request count trend.

---

## Monthly check (15 minutes)

1. Run manual smoke on all six tools.
2. Review open GitHub Issues; label `wontfix` / `help wanted` as needed.
3. `cd frontend && npm audit` — address moderate+ if fix is non-breaking.
4. `cd motor_transmutacion && cargo audit` (install: `cargo install cargo-audit`) if available.
5. Confirm `SITE_REPO_URL` and deploy URL in README still correct.

---

## Incident responses

### Site down (5xx or blank)

1. Cloudflare → Deployments → last build status.
2. If build failed: read log (Wasm sync, `npm ci`, OpenNext).
3. Retry deployment or revert `main` to last good tag.
4. Post mortem in GitHub Issue if user-visible > 1 hour.

### Wasm 404 / transmutation fails

1. Browser DevTools → Network → `/wasm/transmutador_*/*.js` must be 200.
2. Verify build log contains `sync-wasm-assets: copied`.
3. See `docs/DEPLOY.md` troubleshooting.

### Traffic spike (possible abuse)

| Symptom | Action |
|---------|--------|
| Requests 10× normal, site still fast | Monitor 48h; check referrers |
| Cloudflare billing / quota warnings | Enable Bot Fight Mode; consider rate limits |
| DDoS symptoms | Cloudflare Security Level → “I’m Under Attack” temporarily |

Camaleon does not bill per conversion — worst case is edge bandwidth and your time.

### Impersonation report

1. Do not engage clone operators unless legal advice obtained.
2. Update README / About with **official URL** and repo link.
3. Optional: GitHub Issue pinned “Official sites”.

### Security vulnerability report

Follow `SECURITY.md`. Do not discuss details publicly until patched.

---

## What we do not monitor

- Per-user behavior (no analytics by design)
- File content (never reaches our servers)
- Conversion success rates server-side (impossible — local only)

User feedback via [GitHub Issues](https://github.com/dithmarpatpar300-lgtm/camaleon/issues) is the primary product signal.

**Limit / astro / AVIF pipeline (regression reference):** [docs/LIMIT_PIPELINE.md](LIMIT_PIPELINE.md)
