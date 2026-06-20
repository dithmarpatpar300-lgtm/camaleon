# Camaleon — AI Agent Working Protocol (SKILL.md)

> **Audience:** All AI coding agents (Cursor, OpenCode, etc.) working on the Camaleon project.
> **Purpose:** Define the mandatory workflow, conventions, and verification gates for ANY task — analysis, bugfix, feature, or release.
> **Scope:** This document is **process-oriented** (how to work), not **context-oriented** (what the project is). For project context, read [ARCHITECTURE.md](ARCHITECTURE.md) first.
> **Authority:** Chief Architect owns this document. Agents MUST follow it. Deviations require explicit Architect acknowledgment.

---

## 1. Session Startup Protocol

Every new agent session MUST begin with:

### 1.1 Context ingestion (read-only phase)

Read these files in order — do NOT write code until all are absorbed:

| # | File | Why |
|---|------|-----|
| 1 | `README.md` | Quick-start, capability snapshot, live URL, stack |
| 2 | `ARCHITECTURE.md` | Full system atlas: routes, providers, crates, flows |
| 3 | `SPEC.md` | Normative requirements, Wasm contracts, NFRs, science doctrine |
| 4 | `ROADMAP.md` | Phased delivery history, current state, next milestones |
| 5 | `docs/LIMIT_PIPELINE.md` | Must read before touching limits, prepare, risk mode, or alpha |
| 6 | `docs/planning/tier4_plan.md` | If working on optimize/edit features |

### 1.2 Confirmation handshake

After reading, confirm assimilation with a 1-3 line technical summary of what Camaleon is and the current milestone.

---

## 2. Task Execution Workflow

Every task follows this sequential pipeline — do NOT skip phases:

```
⊘ Analysis → ☐ Planning → ⚙ Implementation → ✓ Verification → 📝 Documentation → 🔖 Versioning → 📦 Commit
```

### 2.1  Analysis (read-only)

- Read ALL relevant source files before suggesting changes.
- Use multi-agent parallel exploration (`Task` tool with `explore` subagent) for broad searches.
- Map the data flow end-to-end before diagnosing.
- If the user provides screenshots that cannot be read, rely on their textual description and file-system verification.
- Trace the FULL call chain: UI → provider/hook → lib → worker → Wasm → Rust.
- Identify whether the issue is in the shared engine (`motor_transmutacion/`) or the frontend orchestration (`frontend/src/`).

### 2.2  Planning

- Create a `todowrite` list with discrete, verifiable items.
- Mark items with priority: `high | medium | low`.
- Only ONE item `in_progress` at a time.
- Mark `completed` only AFTER verification (tests pass, build succeeds).

### 2.3 ⚙ Implementation

- **Rust (engine):**
  - One transmutator crate per conversion direction — crates MUST NOT depend on each other.
  - Shared logic goes in `core_utils/`.
  - Every new crate needs: `wasm-bindgen` exports + `set_session_input_limit` + `reset_session_input_limit` + `set_risk_mode`.
  - Follow the existing crate's code style: same error patterns, same `validate_input` → decode → encode → `validate_output` pipeline.
  - `default-features = false` on `image` crate always. Never enable `rayon`.

- **TypeScript (frontend):**
  - Follow existing patterns: same component structure, same import conventions, same naming.
  - Use the established `lib/` subsystems — do NOT inline business logic in components.
  - Honor the existing type system: extend types rather than circumventing them.
  - All new tools need: registry entry (`tool-registry.ts`) + worker route + i18n EN/ES.

- **Cross-cutting (both layers):**
  - StripAll metadata policy is the default — never copy source metadata to output.
  - Semantic Alpha Engine must be respected: meaningful alpha vs structural alpha.
  - Limit pipeline: `LIMIT_PIPELINE.md` is authoritative for bytes/pixels/risk mode.
  - `Risk Mode` skips Camaleon's own pixel limits and raises byte caps, but does NOT automatically configure the `image` crate's decoder limits — check `Limits::default()` vs `reader.no_limits()`.

### 2.4 ✓ Verification

Run ALL of these before marking a task complete:

```bash
# Rust — must pass (pre-existing, unrelated failures are OK if documented)
cd motor_transmutacion && cargo check --workspace && cargo test --workspace

# Wasm — rebuild after ANY Rust change
cd frontend && npm run build:wasm

# Frontend — must pass
cd frontend && npx tsc --noEmit && npm test && npm run build
```

- 183 Vitest tests must always pass.
- New pre-existing test failures (e.g. SVG `text_latin_meta_and_render`) must be noted but do not block.
- `tsconfig.tsbuildinfo` must NOT be committed (build artifact).

### 2.5 📝 Documentation sync

After EVERY code change that affects architecture, behavior, or user experience:

| Doc | When to update |
|-----|---------------|
| `SPEC.md` | Any behavioral change, new API, amended contract. Bump version + date + add amendment log entry. |
| `ROADMAP.md` | New feature shipped, milestone reached. Update current snapshot + add changelog entry. |
| `README.md` | Version bump, new capability, updated live URL. Update version badge + "Latest" section. |
| `ARCHITECTURE.md` | Route changes, new provider, new crate, architectural decisions. Update snapshot + tier table. |
| `docs/LIMIT_PIPELINE.md` | Any limit, risk mode, prepare, or alpha engine change. |

**Rule:** If code and docs disagree, SPEC wins until deliberately amended.

### 2.6 🔖 Versioning

| Bump | When |
|------|------|
| `PATCH` (x.y.Z) | Bug fixes, batch UX fixes, decoder fixes — user-noticeable but no new tool/crate. |
| `MINOR` (x.Y.z) | New transmutator crate, new UI capability, new Settings section. |
| `MAJOR` (X.y.z) | Breaking Wasm API, workspace restructure, privacy model change. |

Engine semver (`motor_transmutacion/`) and app semver (`frontend/package.json`) MAY diverge.

#### Release checklist (every PATCH+ release)

1. Bump `frontend/package.json` version.
2. Create `docs/releases/vX.Y.Z.md` with: date, branch, tag, summary, highlights, QA exit gate.
3. Create `frontend/src/lib/releases/entries/vX.Y.Z.ts` with: `ReleaseEntry` including `version`, `date`, `titleKey`, `summaryKey`, `tags`, `highlights[]`, `technicalKey`.
4. Add import + prepend entry in `frontend/src/lib/releases/manifest.ts`.
5. Add i18n keys under `releaseComms.entries.vXYZ.*` in BOTH `en.ts` and `es.ts` with `title`, `summary`, `technical`, `highlights.*`.
6. Update all affected docs to the new version.
7. Commit to `dev` with message: `release: vX.Y.Z — <brief description>`.

### 2.7 📦 Commit & Push Protocol

```
1. Work on `dev` branch         ← ALL implementation happens here
2. Commit to `dev`              ← Atomic commits with descriptive messages
3. User validates on `dev`      ← Manual QA / smoke testing
4. Merge `dev` → `main`        ← Only after user approval
5. Tag `vX.Y.Z` on `main`      ← Annotated tag matching package.json version
6. Push `main` + `--follow-tags`  ← Single push with tags
```

**Commit message format:**
```
<type>: <brief description>

<optional detailed body with bullet points>

App vX.Y.Z · engine vX.Y.Z.
```

Types: `release:`, `fix:`, `feat:`, `docs:`, `chore:`.

**Never commit:**
- `frontend/tsconfig.tsbuildinfo` (build artifact, gitignored — if tracked, remove from tracking)
- `frontend/public/wasm/` (gitignored — Wasm binaries)
- `test/` directory (user's local test fixtures)
- `node_modules/`
- `motor_transmutacion/target/`

---

## 3. Communication & Tone

### 3.1 Language

- **User-facing communication:** Spanish (primary), English for technical terms.
- **Code and commits:** English.
- **Docs:** English.
- **i18n keys:** BOTH English AND Spanish — never ship partial i18n.

### 3.2 Tone

- Direct, concise, technical.
- No unnecessary preamble or postamble.
- Use `file.ts:line` references when discussing code.
- One-word answers are fine when appropriate.
- Do NOT explain what you're about to do — just do it and report the result.

### 3.3 When blocked

- If you cannot view an image, state it clearly and rely on the user's textual description.
- If static analysis cannot find the bug, use file-system verification (check actual file sizes, attributes, etc.).
- Ask for clarification only when the issue description is truly ambiguous after 2+ re-readings.

---

## 4. Architecture-Specific Rules

### 4.1 Rust engine (`motor_transmutacion/`)

| Rule | Detail |
|------|--------|
| **Modular crates** | One crate per conversion direction. Crates do NOT depend on each other. |
| **Shared code** | Lives in `core_utils/` only. |
| **Wasm exports** | Every crate exports `transmutar_*`, `estimate_*`, `set_session_input_limit`, `reset_session_input_limit`, `set_risk_mode`. |
| **Build pipeline** | Canonical: `frontend/scripts/build-wasm.mjs` via `npm run build:wasm`. `scripts/build-wasm.ps1` is stale (6 crates only). |
| **Image decode** | When using `image` crate's `ImageReader`, check `core_utils::risk_mode_enabled()` and call `reader.no_limits()` before `.decode()` when risk mode is on. |
| **Validation** | Always `validate_input()` → decode → encode → `validate_output()`. |
| **Tests** | `cargo test --workspace` must pass. Integration tests per crate. |

### 4.2 Frontend (`frontend/src/`)

| Rule | Detail |
|------|--------|
| **File size display** | Use `item.displaySize` (preserved from handoff) or `item.file.size`. Never hardcode `files[0].size`. |
| **Batch item state** | `BatchItemPatch` cannot modify `displaySize` or `file` — they are immutable. |
| **Batch error handling** | Error items auto-unselect (`selected: false`), checkbox disabled, excluded from `isTransmutableStatus` and `handleSelectAll`. |
| **Batch done re-download** | Normal mode shows "Download Again {x}" button when `selectedDoneCount > 0`. |
| **Risk Mode flow** | Settings S6 → `RiskModeProvider` → `computeLimitContext` → `WorkerRequestMeta` → worker → Wasm `set_risk_mode(true)`. |
| **Provider nesting** | See `ARCHITECTURE.md §5` for the exact order. |
| **Prepare pipeline** | See `docs/LIMIT_PIPELINE.md` for the zone model and phase ordering. |
| **Worker protocol** | Requests are sequential (`pipeline = pipeline.then(...)`), Risk mode applied FIRST, then session limit. Reset in `finally` block. |

### 4.3 Testing doctrine

| Layer | Command | Must pass? |
|-------|---------|-----------|
| Rust | `cargo test --workspace` | ✅ Always |
| Wasm build | `npm run build:wasm` | ✅ After Rust changes |
| TypeScript | `npx tsc --noEmit` | ✅ Always (pre-existing test mock errors OK) |
| Vitest | `npm test` (183 tests) | ✅ Always |
| Next.js build | `npm run build` | ✅ Before release |

---

## 5. Common Task Patterns

### Pattern A: Bug fix (engine)

```
1. Reproduce: understand the exact error and trigger conditions.
2. Trace: follow the data flow from UI → worker → Wasm → Rust.
3. Check: is this a Camaleon limit or an upstream crate limit?
4. Fix: minimal diff, same pattern as sibling crates.
5. Verify: cargo check + cargo test + build:wasm.
6. Docs: update SPEC §6.x if Wasm API changed.
```

### Pattern B: Bug fix (frontend)

```
1. Reproduce: understand the exact UI state and user action.
2. Trace: follow the component hierarchy and data flow.
3. Check: is the bug in display logic, state management, or data derivation?
4. Fix: minimal diff, match existing patterns for derived counts and memoized values.
5. Verify: tsc + vitest.
6. Docs: update SPEC §7.x if UX contract changed.
```

### Pattern C: New feature

```
1. Plan: SPEC amendment + ROADMAP phase entry first (Architect approves).
2. Rust crate: scaffold + Wasm exports + tests.
3. Build: add crate to build-wasm.mjs + wasm-crates.ts.
4. Frontend: registry entry + worker route + prepare hook + notices + i18n EN/ES.
5. Settings: add option specs (S2 defaults if configurable).
6. Precache: tool route auto-included via registry SSG.
7. Release: full checklist (§2.6).
8. ROI: `npm run build:wasm` → `npm run build` → `npm test`.
```

### Pattern D: Release preparation

```
1. Confirm: all changes committed to dev.
2. Create: docs/releases/vX.Y.Z.md.
3. Create: frontend/src/lib/releases/entries/vX.Y.Z.ts.
4. Update: manifest.ts (import + prepend).
5. Update: i18n EN + ES (vXYZ block with title, summary, technical, highlights).
6. Bump: frontend/package.json version.
7. Update: SPEC.md, ROADMAP.md, README.md, ARCHITECTURE.md.
8. Rebuild: npm run build:wasm (if engine changed).
9. Verify: tsc + vitest (183 tests).
10. Commit to dev: `release: vX.Y.Z — <description>`.
```

---

## 6. Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | System atlas — always read first |
| `docs/SPEC.md` | Normative requirements |
| `docs/ROADMAP.md` | Phased delivery history |
| `docs/LIMIT_PIPELINE.md` | Limits, risk mode, prepare pipeline |
| `docs/releases/v*` | Per-version release notes |
| `frontend/package.json` | App version (single source of truth) |
| `frontend/src/lib/tools/tool-registry.ts` | All 25 tools defined here |
| `frontend/src/lib/batch/batch-types.ts` | BatchItem, statuses, factory functions |
| `frontend/src/workers/transmutation.worker.ts` | Worker protocol + Wasm dispatch |
| `frontend/src/lib/releases/manifest.ts` | Release catalog (newest first) |
| `frontend/src/lib/i18n/dictionaries/en.ts`, `es.ts` | All UI strings |
| `motor_transmutacion/core_utils/src/lib.rs` | Shared validation, limits, semantic alpha |
| `frontend/scripts/build-wasm.mjs` | Canonical Wasm build script |

---

*Last updated: 2026-06-20 · v3.5.2 era · Maintained alongside SPEC/ROADMAP promotions.*
