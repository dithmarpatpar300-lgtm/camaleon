# Camaleon — Tool Call Optimization Protocol (SKILLS_TOOLING.md)

> **Audience:** All AI coding agents working on the Camaleon project.
> **Purpose:** Minimize context window waste from tool calls — specifically file reads, searches, commands, edits, and writes.
> **Scope:** This document covers `Read`, `Grep`, `Bash`, `Edit`, and `Write` tool calls. Subagent usage (`Task`) is reserved for `SKILLS_AGENTIC.md` (future document).
> **Authority:** Born from audit of a real 300+-tool-call session. Every rule below is anchored to a verified wasteful or efficient pattern observed in that session.

---

## 1. File Reads (`Read`)

### Rule 1.1 — Never read an entire file unless you need >80% of it

**Session evidence:** `SPEC.md` (2000+ lines) was read in full. Only §6 (module specs, ~300 lines) and §7 (frontend specs, ~200 lines) were relevant to the decoder and batch bugs. The remaining ~1500 lines (metadata policy, WebP science, encoder-swap doctrine, amendment log) consumed context without use.

`BatchTransmutationPanel.tsx` (1041 lines) was read in full. Only 6 specific functions (~150 lines total) were modified: `isTransmutableStatus`, `buildQueue`, `handleSelectAll`, `transmutableSelectedCount`, `readyCount`, and the `FilePrepareGate` rendering block.

**Do this:**

```
# Step 1: Find what you need
Grep: pattern="functionName|otherFunction" path="frontend/src/" include="*.tsx"

# Step 2: Read ONLY those sections
Read: filePath="..." offset=<line-5> limit=<30>

# Step 3: Only if the above isn't enough, expand the window
Read: filePath="..." offset=<line-50> limit=<100>
```

**Exception:** Files under 80 lines (e.g., `formatBytes.ts`, `partition-for-tool.ts`, `batch-limits.ts`) are fine to read in full.

**Exception:** The 6 foundation docs listed in `SKILLS.md` §1.1 (README, ARCHITECTURE, SPEC, ROADMAP, LIMIT_PIPELINE, tier4_plan) are REQUIRED reads at session start — but even these should be skimmed for structure first, then read relevant sections on-demand. `ARCHITECTURE.md` has a table of contents at line 13 — use it.

### Rule 1.2 — Batch-read independent files in parallel

**Session evidence:** 8 Rust crate `lib.rs` files were read sequentially in 8 separate `Read` calls, each blocking on the previous. All 8 were independent.

**Do this:** When you need to read multiple files that don't depend on each other, issue all `Read` calls in a SINGLE message.

```
# Good (parallel):
Read(file1) + Read(file2) + Read(file3) + Read(file4)  ← single message

# Bad (sequential):
Read(file1) → wait → Read(file2) → wait → Read(file3)  ← 3 messages, 3x latency
```

### Rule 1.3 — Delegate multi-file pattern scanning to Grep before reading

**Session evidence:** I read all 8 `transmutador_*/src/lib.rs` files manually to find `.decode()` calls. A single `Select-String "\.decode\(\)"` across `motor_transmutacion/` found all 20+ locations instantly, letting me read ONLY the files that needed changes (and only the relevant lines).

---

## 2. Content Searches (`Grep` / `Select-String`)

### Rule 2.1 — Always scope searches to the smallest relevant directory

**Session evidence:** Two grep calls omitted the `path` parameter and searched the entire workspace. `grep "partitionFilesForTool"` without scope found 9 matches across `src/`, all of which would have been found with `path: frontend/src/` — no non-frontend matches existed.

**Do this:**

```
# Good:
Grep: pattern="..." path="frontend/src/components/transmute/" include="*.tsx"

# Also good (crate-scoped):
Grep: pattern="..." path="motor_transmutacion/transmutador_encode/"

# Bad (whole workspace):
Grep: pattern="..."   ← missing path parameter
```

**When to use whole-workspace:** Only when you genuinely don't know which crate or layer the symbol lives in. Even then, start with `frontend/src/` or `motor_transmutacion/` — these are the two halves of the monorepo.

### Rule 2.2 — Use context lines (`-A`/`-B`/`-C`) in Bash rg, or read the matched file with offset

**Session evidence:** Grep returns file:line references. If the matched line needs surrounding context to understand, don't grep again — use `Read` with the line number as offset.

```
# Step 1: Find the symbol
Grep: pattern="isTransmutableStatus" path="frontend/src/"

# Step 2: Read around it (5 lines before, 15 after)
Read: filePath=".../BatchTransmutationPanel.tsx" offset=<match_line - 5> limit=20
```

### Rule 2.3 — Prefer Grep over Bash rg/Select-String

The `Grep` tool is optimized for context window efficiency (returns structured line-numbered results). `Bash` with `rg` or `Select-String` returns raw terminal output which includes ANSI codes, full paths, and uncontrolled wrapping. Use `Bash` only when `Grep` doesn't support a regex feature you need (PCRE2, negative lookahead, etc.).

---

## 3. Command Execution (`Bash`)

### Rule 3.1 — ALWAYS filter command output to the essential result

**Session evidence:** `cargo test --workspace` produced ~500 lines of output including all 60 test names from `core_utils`, all 23 from `transmutador_png`, etc. Only the final `test result: ok. X passed; Y failed` line mattered. `npm run build:wasm` produced ~200 lines of wasm-pack verbose logs — only `[INFO]: :-) Done` and any `Error:` lines mattered.

**Do this for test runs:**

```bash
# Rust tests — show only result and failures
cargo test --workspace 2>&1 | Select-String "test result:|FAILED|error\["

# Vitest — already summarized by default, no filter needed
npx vitest run

# tsc — filter out pre-existing test mock errors
npx tsc --noEmit 2>&1 | Select-String -NotMatch "\.test\.ts"
```

**Do this for builds:**

```bash
# Wasm build — show only completion or errors
npm run build:wasm 2>&1 | Select-String "Done|Error|error|FAILED"

# Next.js build — show only result
npm run build 2>&1 | Select-Object -Last 5
```

**Exception:** When a command FAILS and you need to diagnose why, raw output is acceptable. But start with the filtered version first — if the failure is clear from the summary, you don't need the full log.

### Rule 3.2 — Never pipe command output through `Select-Object -First` or `-Last` with large offsets

These cmdlets read the ENTIRE stream into memory before truncating, defeating the purpose. Use `Select-String` for content filtering instead.

### Rule 3.3 — Verify file-system state before assuming

**Session evidence:** When the user reported file size mismatches, I spent 15+ tool calls tracing code before checking the actual files on disk with `Get-ChildItem`. A single file-system check would have confirmed that the code logic was correct and the issue was elsewhere (the `FilePrepareGate` hardcoded `files[0].size`).

---

## 4. File Edits (`Edit`)

### Rule 4.1 — Group all edits to a single file into one message

**Session evidence:** `BatchTransmutationPanel.tsx` received 5 separate `Edit` calls across 4 messages. Each `Edit` forces the system to re-read the file to validate `oldString`. If I had planned all 5 changes upfront and sent them in one message, the file would have been read once instead of 5 times.

```
# Good (single message, 3 edits to same file):
Edit(fileA, old1, new1) + Edit(fileA, old2, new2) + Edit(fileA, old3, new3)

# Bad (3 separate messages):
Edit(fileA, old1, new1)
→ wait for response
Edit(fileA, old2, new2)
→ wait for response
Edit(fileA, old3, new3)
```

**Exception:** When edit #2 depends on the result of edit #1 (e.g., `oldString` for edit #2 only becomes known after edit #1 alters the file), sequential is unavoidable. But this is rare — most edits to the same file are independent line-range changes.

### Rule 4.2 — Never use `Edit` when `Write` is more efficient

If you need to replace >60% of a file or restructure it entirely, use `Write` instead of chaining 10+ `Edit` calls.

**Session evidence:** Not violated in this session (all edits were targeted). This rule is preventative.

### Rule 4.3 — Verify the edit target with a read of the specific section first

**Session evidence:** All my edits were preceded by a `Read` (either earlier in the session or immediately before). This is correct — `Edit` fails if `oldString` doesn't match exact content, and the error costs a round-trip.

---

## 5. File Writes (`Write`)

### Rule 5.1 — Write is acceptable for new files; never for modifying existing files

**Session evidence:** 3 `Write` calls used for new files (`docs/releases/v3.5.2.md`, `entries/v3.5.2.ts`, `SKILL.md`). All were appropriate — these files didn't exist before.

### Rule 5.2 — Batch independent writes

Same principle as Rule 1.2: if you need to create multiple new files, send all `Write` calls in one message.

---

## 6. Context Compaction Threshold

### Rule 6.1 — Compact after 30 tool calls or 3000+ accumulated read lines

**Session evidence:** Tool call usage grew monotonically:
- Calls 1-15: Ingesta inicial — **contexto bajo, no compactar**
- Calls 16-35: Investigación (explore + reads secuenciales) — **aquí debió compactarse**
- Calls 36-60: Implementación (edits + verifications) — **contexto alto, compactación urgente**
- Calls 61+: Documentación y release — **ya operando en contexto crítico**

**Do this:** When tool call count exceeds 30 OR cumulative `Read` lines exceed 3000, write a session checkpoint:

1. Open `docs/session-log.md` (or append to existing).
2. Record: decisions made, files modified, open questions, next step.
3. This creates a "save point" — if context is lost or a new agent session starts, the log provides continuity.

**Note:** OpenCode Go does not expose a native sub-context or compaction API as of this writing. The manual checkpoint is the only available mechanism.

### Rule 6.2 — Close the current task's focus before context saturation

If a single task (e.g., "fix the JPEG decoder bug") has consumed >30 tool calls without resolution, pause and report findings to the user. Continuing to search for a bug with diminishing returns wastes context that could be used for the next task.

---

## 7. Quick Reference: Anti-Patterns

| Anti-pattern | Real session example | Fix |
|-------------|---------------------|-----|
| Reading 2000-line `SPEC.md` for a frontend-only bug | Read full file at session start | Grep for relevant § sections, read only those |
| Reading 1041-line component for 6 small functions | `BatchTransmutationPanel.tsx` full read | Grep → offset Read |
| 5 separate Edit calls to same file | `BatchTransmutationPanel.tsx` edits spread across messages | Plan + batch in one message |
| `cargo test` output unfiltered (500 lines) | Every test name printed to context | `Select-String "test result:\|FAILED"` |
| `build:wasm` output unfiltered (200 lines) | wasm-pack verbose logging | `Select-String "Done\|Error"` |
| 8 sequential Read calls for identical patterns | Crate-by-crate manual inspection | Single `Select-String` across `motor_transmutacion/` |
| Searching whole workspace when symbol is known layer | `grep "partitionFilesForTool"` without path | Add `path: "frontend/src/"` |
| Debugging code logic before verifying file-system facts | 15+ tool calls before `Get-ChildItem` to check disk sizes | Check disk first, code second |

---

## 8. Cross-Reference with SKILLS.md

`SKILLS.md` §1 (Session Startup Protocol) must reference this document. The following amendment applies:

> Add to `SKILLS.md` §1.1 after the file table:
>
> | 7 | `SKILLS_TOOLING.md` | Tool call efficiency rules — read before issuing any tool calls |

---

*Last updated: 2026-06-20 · Based on audit of v3.5.2 session (~105 tool calls analyzed).*
