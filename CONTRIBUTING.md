# Contributing to Camaleon

Thank you for helping improve Camaleon — a privacy-first, browser-local image transmutator.

## Before you start

1. Read [docs/SPEC.md](docs/SPEC.md) for architecture and contracts.
2. Read [docs/ROADMAP.md](docs/ROADMAP.md) for current priorities.
3. Read [docs/BRANCHING.md](docs/BRANCHING.md) for which branch to target.

## Branch target

**Open Pull Requests against `contrib`**, not `main`.

`main` is the public release line. `contrib` is where community changes are reviewed before they ship.

## Development setup

```bash
# Clone and enter the repo
git clone https://github.com/dithmarpatpar300-lgtm/camaleon.git
cd camaleon
git checkout contrib

# Build Wasm (required after engine changes)
cd frontend && npm run build:wasm

# Install and run
npm install
npm run dev
```

**Verify changes:**

```bash
cd motor_transmutacion && cargo test --workspace
cd ../frontend && npm run build
```

## What to contribute

| Area | How to add value |
|------|------------------|
| **New format** | One Rust crate + ToolRegistry entry + worker route + Wasm build + EN/ES copy |
| **Bug fixes** | Minimal diff; explain repro steps in the PR |
| **UI / i18n** | Match existing design tokens; update both `en.ts` and `es.ts` |
| **Docs** | SPEC amendments when behavior changes |

## Pull request checklist

- [ ] `cargo test --workspace` passes
- [ ] `npm run build` passes (after `build:wasm` if engine changed)
- [ ] EN and ES strings updated when UI copy changes
- [ ] No file bytes sent to any server (privacy model unchanged)
- [ ] SPEC updated if architecture or Wasm contracts change

## Code style

- Match surrounding code — naming, types, and patterns already in the file.
- Keep diffs focused; one logical change per PR when possible.
- Rust: run `cargo fmt` in `motor_transmutacion/`.
- TypeScript: follow existing component and hook conventions.

## Privacy model (non-negotiable)

Camaleon converts files **entirely in the browser**. Do not add:

- Server-side file upload endpoints
- Analytics that track file content or filenames
- Third-party scripts that receive user file data

## Questions

Open a [GitHub Issue](https://github.com/dithmarpatpar300-lgtm/camaleon/issues) for bugs, feature ideas, or questions before large changes.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
