# Post-launch hardening plan (v1.7.9)

> **Branch:** implement on `dev` → review → merge to `main` → tag release.  
> **Scope:** security & operations only. Monetization and Playwright E2E deferred.

---

## Out of scope (explicitly deferred)

| Item | When |
|------|------|
| Playwright E2E smoke tests | After first user-feedback cycle |
| WAF enterprise / pentest / SOC2 | Not needed for local-first app |
| Cookie consent banner (heavy) | Privacy policy already covers theme/locale cookies |
| Wasm DRM / obfuscation | Contradicts MIT + verifiable trust |
| Monetization (Sponsors, Ko-fi) | After stability window (~4–8 weeks) |
| Tier 2 formats | Driven by GitHub Issues feedback |

---

## Phase 1 — Repo & GitHub (code + config) `dev`

**Target version:** v1.7.9  
**Effort:** ~1 session  
**Merge gate:** files exist + README links work

| # | Task | Deliverable | Owner |
|---|------|-------------|-------|
| 1.1 | Security policy | `SECURITY.md` at repo root | ✅ this branch |
| 1.2 | Dependabot | `.github/dependabot.yml` (npm + cargo) | ✅ this branch |
| 1.3 | Issue templates | `.github/ISSUE_TEMPLATE/*.yml` (bug, feature, security) | ✅ this branch |
| 1.4 | README links | Security + how to report | ✅ this branch |
| 1.5 | Secret hygiene doc | `docs/SECURITY_CHECKLIST.md` one-time audit steps | ✅ this branch |

### Acceptance

- [ ] GitHub shows **Security policy** tab on repo
- [ ] **Issues → New issue** shows Bug / Feature / Security templates
- [ ] Dependabot opens PRs within 24–48h (after merge to `main`)

---

## Phase 2 — Release discipline (manual + tag) `dev` → `main`

| # | Task | Steps |
|---|------|-------|
| 2.1 | Pre-release audit | Run `docs/SECURITY_CHECKLIST.md` |
| 2.2 | Git tag | `git tag -a v1.7.9 -m "Post-launch hardening"` on `main` |
| 2.3 | GitHub Release | Notes: security policy, issue templates, dependabot; link deploy URL |
| 2.4 | Cloudflare redeploy | Auto on push to `main`; smoke-test 6 tools + legal pages |

### Release notes template

```markdown
## v1.7.9 — Post-launch hardening

- SECURITY.md and responsible disclosure process
- GitHub Issue templates (bug, feature, security)
- Dependabot for npm and Cargo dependencies
- Operations playbook for monitoring (docs/OPERATIONS.md)

**Live:** https://camaleon.<subdomain>.workers.dev
```

---

## Phase 3 — Cloudflare dashboard (manual, no code)

Documented in `docs/DEPLOY.md` § Security & abuse.

| # | Task | Where | Notes |
|---|------|-------|-------|
| 3.1 | Bot Fight Mode | Security → Bots | Optional; enable if scraping spikes |
| 3.2 | Security Level | Security → Settings | Medium default; raise only under attack |
| 3.3 | Email alerts | Notifications | Failed deploys + usage anomalies |
| 3.4 | Custom domain | Workers → Domains | When ready; reduces impersonation risk |

**Not enabling now:** aggressive WAF rules, rate limiting per IP (Workers free tier limits differ).

---

## Phase 4 — Risk monitoring playbook

Full detail: `docs/OPERATIONS.md`

### Risk 1 — Hosting abuse (traffic spike)

**Signal:** Cloudflare Workers analytics → requests/day 10× baseline without user growth.

| Action | Threshold |
|--------|-------------|
| Review referrers | Any single referrer > 50% traffic |
| Enable Bot Fight Mode | Sustained 3+ days elevated traffic |
| Check build minutes | Failed/success ratio in Workers Builds |

**Camaleon advantage:** static assets + edge; no conversion backend to overload.

### Risk 2 — Impersonation / clone sites

**Signal:** users report “Camaleon with ads” or upload-based converters using your name.

| Mitigation | Status |
|------------|--------|
| Official repo URL in app (`SITE_REPO_URL`) | ✅ |
| Legal pages name the project honestly | ✅ |
| Custom domain + link from README | Phase 3 |
| GitHub **Topics** on repo (`image-converter`, `privacy`, `webp`) | Phase 2 manual |

**Do not:** chase every clone legally; document official URL in About.

### Risk 3 — Dependency vulnerabilities

**Signal:** Dependabot alert or GitHub Security tab.

| Cadence | Action |
|---------|--------|
| Weekly | Triage Dependabot PRs (patch = merge fast) |
| Per release | `npm audit` in `frontend/`, `cargo audit` optional in `motor_transmutacion/` |
| Critical CVE | Hotfix branch → `main` within 48h |

CI already runs `cargo test` + `npm run build` on PRs to `main`.

### Risk 4 — Content / liability

**Signal:** user expects Camaleon to “fix” corrupted files or guarantee forensic safety.

| Mitigation | Status |
|------------|--------|
| Terms: no warranty, user responsibility | ✅ `/terms` |
| Privacy: no file upload, local processing | ✅ `/privacy` |
| UI copy: lossless vs lossy honesty | ✅ badges |

**Periodic review:** when adding Tier 2 formats, update Terms if new capabilities (e.g. metadata retention options).

---

## Workflow summary

```
dev     → Phase 1 code (SECURITY, dependabot, templates, OPERATIONS)
        → you review locally + on GitHub dev branch (optional push dev)
main    → merge after approval
        → Phase 2 tag v1.7.9 + GitHub Release
        → Phase 3 Cloudflare manual checklist
        → monitor per OPERATIONS.md
```

### Push strategy

```bash
git checkout dev
# … implement …
git push origin dev          # optional: preview branch on GitHub

# After your approval:
git checkout main
git merge dev
git push origin main         # triggers Cloudflare deploy
git tag v1.7.9 && git push origin v1.7.9
```

---

## Success criteria (4 weeks post-hardening)

- [ ] Zero secret leaks in repo history (checklist completed)
- [ ] ≥1 user issue filed via templates (proves feedback path works)
- [ ] Dependabot enabled with ≥0 merged security updates
- [ ] All 6 transmutators pass manual smoke on production URL
- [ ] No unplanned Cloudflare usage surprises

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-06-07 | Chief Architect | Initial post-launch hardening plan |
