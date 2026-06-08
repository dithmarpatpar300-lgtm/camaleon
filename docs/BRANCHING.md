# Branch strategy

Camaleon uses three long-lived branches. Pick the one that matches your goal.

| Branch | Purpose | Who uses it |
|--------|---------|-------------|
| **`main`** | Public releases — what deploys to production and what GitHub visitors see | Everyone (default clone) |
| **`dev`** | Active development — internal planning, prompts, agent reports, experiments | Maintainers only |
| **`contrib`** | Community integration — open PRs from contributors land here first | Contributors |

## Workflow

```
main          ●────────●────────●  tagged releases (v1.7.9, …)
               \      /
contrib         ●────●────●       community PRs reviewed here
                 \  /
dev               ●──●──●──●      daily work + internal docs
```

### Maintainers

1. Day-to-day work happens on **`dev`** (or feature branches off `dev`).
2. When a release is ready, merge `dev` → `main` and tag (e.g. `v1.7.9`).
3. Keep **`contrib`** in sync with `main` after each release so contributors start from a clean base.

### Contributors

1. Fork the repository.
2. Branch from **`contrib`**: `git checkout contrib && git pull && git checkout -b feat/my-change`
3. Open a Pull Request **into `contrib`** (not `main`).
4. After review, maintainers merge `contrib` → `main` on release cadence.

### What lives where

| Content | `main` | `dev` | `contrib` |
|---------|--------|-------|-----------|
| App source (`frontend/`, `motor_transmutacion/`) | ✅ | ✅ | ✅ |
| `docs/SPEC.md`, `docs/ROADMAP.md` | ✅ | ✅ | ✅ |
| `docs/prompts/`, `docs/planning/`, `docs/reports/` | ❌ | ✅ | ❌ |
| `docs/GOVERNANCE.md` (agent workflow) | ❌ | ✅ | ❌ |

## Remote

**https://github.com/dithmarpatpar300-lgtm/camaleon**

```bash
git remote add origin https://github.com/dithmarpatpar300-lgtm/camaleon.git
git push -u origin main
git push -u origin dev
git push -u origin contrib
```

Set **default branch** to `main` in GitHub repository settings.
