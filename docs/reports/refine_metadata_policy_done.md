# Technical Report: Metadata StripAll Verification

**Task ID:** refine_metadata_policy
**Status:** done
**Date:** 2026-06-02
**Agent:** OpenCode
**Model:** deepseek-v4-pro

## 1. Pre-Execution Analysis

### Problem Statement

SPEC §5.10 documents that Camaleon's decode→re-encode pipeline de facto strips source metadata (EXIF, PNG text chunks) because the `image` crate decodes to a pixel raster and re-encodes with fresh encoder state. However, this behavior was not verified by automated tests. Without tests, a future `image` crate upgrade, encoder API change, or contributor could silently reintroduce metadata propagation — violating Principle P7 (metadata strip by default) and P1 (privacy by design).

### Metadata Markers Scanned

| Format | Marker/Chunk | Identifier | Bytes |
|--------|-------------|------------|-------|
| JPEG APP1 EXIF | `FF E1` + "Exif\0\0" | GPS, camera make/model, timestamp | 6-byte header after segment length |
| PNG tEXt | `74 45 58 74` | Author, description, comment | Keyword\0Text |
| PNG iTXt | `69 54 58 74` | International text (UTF-8) | Keyword\0\0\0\0Text |
| PNG eXIf | `65 58 49 66` | Embedded EXIF in PNG | Full EXIF block |
| PNG iCCP | `69 43 43 50` | ICC color profile | Profile name + compressed data |

### Risks

| Risk | Mitigation |
|------|-----------|
| JPEG APP1 scanning could read past buffer | Segment length validated against input bounds before access |
| PNG chunk walking could loop on corrupt length | Each iteration advances `pos += 12 + data_len`; bounds checked each step |
| `image` crate may embed JFIF APP0 in output JPEG | JFIF APP0 is minimal encoder metadata, not EXIF — documented as acceptable |
| Integration tests need `image` in test scope | Both transmutators already have `image` as a regular dependency; no new deps |
| Source text could survive as binary coincidental match | Assertion uses `CamaleonTest` unique string; extremely low false-positive probability |

## 2. Work Performed

### Files Modified

| File | Change |
|------|--------|
| `motor_transmutacion/core_utils/src/lib.rs` | Added `jpeg_contains_exif_app1`, `png_contains_text_chunk`, `png_contains_exif_chunk`, `png_contains_iccp_chunk`, `png_has_chunk`; +7 metadata scanner tests (26 total) |
| `motor_transmutacion/transmutador_jpg/src/lib.rs` | Added module doc comment: StripAll policy per SPEC §5.10 |
| `motor_transmutacion/transmutador_jpg/tests/integration.rs` | Added `source_jpeg_exif_not_in_output_png` test with `insert_exif_app1` helper (5 total) |
| `motor_transmutacion/transmutador_png/src/lib.rs` | Added module doc comment: StripAll policy per SPEC §5.10 |
| `motor_transmutacion/transmutador_png/tests/integration.rs` | Added `source_png_text_not_in_output_jpeg` test with `insert_text_chunk` + `crc32` helpers (5 total) |
| `motor_transmutacion/Cargo.toml` | Version `0.5.1` → `0.5.3` |
| `frontend/package.json` | Version `0.5.1` → `0.5.3` |
| `docs/SPEC.md` | Version `0.5.2` → `0.5.3`; §5.10.7 implemented; §5.8 task marked ✅; §6.2/§6.3 metadata line updated; §11 amendment entry |

### Metadata Scanner Functions (R1)

```rust
pub fn jpeg_contains_exif_app1(bytes: &[u8]) -> bool;

pub fn png_contains_text_chunk(bytes: &[u8]) -> bool;   // tEXt or iTXt

pub fn png_contains_exif_chunk(bytes: &[u8]) -> bool;   // eXIf

pub fn png_contains_iccp_chunk(bytes: &[u8]) -> bool;   // iCCP
```

All functions are:
- **Dependency-free**: pure byte-level parsing using `read_be_u16`/`read_be_u32` helpers already in `core_utils`
- **Bounded**: JPEG scan limited to 64 KB (`JPEG_SCAN_LIMIT`); PNG chunk walk bounded by `bytes.len()`
- **Safe**: all array accesses bounds-checked; no panics on truncated input
- **Public**: exported for use in transmutator integration tests

### Integration Test Strategy (R3)

**transmutador_jpg metadata test:**
1. Generate valid JPEG via `image` crate (16×16 RGB gradient)
2. Insert APP1 EXIF segment after SOI: `FF E1` + length + `"Exif\0\0"` + `"CamaleonTest\x00\x00"`
3. Sanity check: `core_utils::jpeg_contains_exif_app1(&source) == true`
4. Run `transmutar_jpg_a_png_inner(&jpg_with_exif)` → valid PNG
5. Assert `core_utils::png_contains_exif_chunk(&output) == false`
6. Assert output bytes do not contain `"CamaleonTest"`

**transmutador_png metadata test:**
1. Generate valid PNG via `image` crate (16×16 RGBA)
2. Insert `tEXt` chunk after IHDR: keyword `"Author"`, text `"CamaleonTest"`
3. Sanity check: `core_utils::png_contains_text_chunk(&source) == true`
4. Run `transmutar_png_a_jpg_inner(&png_with_text)` → valid JPEG
5. Assert `core_utils::jpeg_contains_exif_app1(&output) == false`
6. Assert output bytes do not contain `"CamaleonTest"`

### Encoder Audit (R4)

| Encoder | API call | Embeds source metadata? | Embeds minimal encoder headers? |
|---------|----------|------------------------|-------------------------------|
| PNG | `img.write_to(&mut cursor, ImageFormat::Png)` | **No** — `image` crate encoder starts with only IHDR, IDAT, IEND | Yes: standard PNG structure only |
| JPEG | `JpegEncoder::new_with_quality(&mut cursor, 85).encode_image(&img)` | **No** — `JpegEncoder` writes JFIF APP0, DQT, SOF, DHT, SOS, EOI only | Yes: baseline JFIF APP0 marker (16 bytes, no EXIF) |

**Conclusion:** The `image` crate (v0.25) uses fresh encoder state for both formats. No source EXIF, XMP, tEXt, eXIf, or iCCP chunks are copied. The JFIF APP0 segment emitted by `JpegEncoder` contains only version/units/density/thumbnail info — not sensitive identification data. No encoder hardening was required.

## 3. Architectural Decisions

| Decision | Rationale | SPEC section affected |
|----------|-----------|----------------------|
| Metadata scanners in `core_utils`, not transmutators | Shared logic principle; both transmutator integration tests import from `core_utils`; avoids code duplication | §6.1 |
| Byte-level parsing only (no EXIF crate) | Keeps `core_utils` zero-dependency; scanners only need to detect presence/absence, not parse EXIF fields | §5.10.7 |
| No output-byte stripping/post-processing | Encoder behavior is sufficient; post-encode byte scanning would add complexity without benefit given current `image` crate guarantees | §5.10.7 |
| JFIF APP0 considered acceptable minimal metadata | JFIF APP0 is a structural requirement for baseline JPEG decoders; contains no PII (version, units, density, thumbnail — all zero/default) | §5.10.6 |
| `tEXt` and `iTXt` grouped as `png_contains_text_chunk` | Both carry human-readable text metadata; treating them uniformly simplifies the StripAll assertion | §5.10.1 |

## 4. Verification Results

| Command | Result | Notes |
|---------|--------|-------|
| `cargo test --workspace` | PASS | 36/36 tests (26 core_utils + 5 transmutador_jpg + 5 transmutador_png) |
| `cargo check --workspace` | PASS | 0 errors, 0 warnings |
| `npm run build` | PASS | Next.js 15.5.19; frontend unchanged |

### Test Summary

| Crate | Tests | New in v0.5.3 |
|-------|-------|---------------|
| `core_utils` | 26 | +7 metadata scanner tests |
| `transmutador_jpg` | 5 | +1 StripAll integration test |
| `transmutador_png` | 5 | +1 StripAll integration test |
| **Total** | **36** | **+9** |

### Metadata Scanner Tests (core_utils)

| Test | Assertion |
|------|-----------|
| `detects_exif_app1_in_jpeg` | Crafted JPEG with APP1 Exif → true |
| `detects_no_exif_in_minimal_jpeg` | Minimal JPEG (APP0 only) → false |
| `detects_text_chunk_in_png` | PNG with tEXt "Author: CamaleonTest" → true |
| `detects_exif_chunk_in_png` | PNG with eXIf chunk → true |
| `minimal_png_no_sensitive_chunks` | IHDR-only PNG → all false |
| `jpeg_exif_scanner_handles_truncated` | SOI + truncated APP1 → false (no crash) |
| `png_scanner_handles_truncated` | Signature only → false (no crash) |

## 5. SPEC Amendments

**Version:** 0.5.2 → 0.5.3 (PATCH bump — verification of existing de facto behavior; no API change).

**Sections updated:**
- Header: version, status
- §5.10.7: Planned → Implemented with checkmarks for all 4 items
- §5.8: `refine_metadata_policy` marked v0.5.3 ✅
- §6.2: Metadata line updated to "StripAll verified by integration test (v0.5.3)"
- §6.3: Metadata line updated to "StripAll verified by integration test (v0.5.3)"
- §11: Amendment log entry for v0.5.3

## 6. Known Gaps / Follow-ups

| Item | Phase | Notes |
|------|-------|-------|
| GPS-specific EXIF scanner | Post-MVP | `jpeg_contains_exif_app1` detects any APP1 EXIF; GPS IFD tag `0x8825` scanning not implemented (would require TIFF IFD parser) |
| ICC profile policy | Future | `png_contains_iccp_chunk` scanner exists but iCCP is not yet classified as sensitive vs. functional |
| PreserveColorProfile opt-in | Post-MVP | SPEC §5.10.4 defines but not yet implemented |
| Encoder behavior change detection | Continuous | If `image` crate v0.26+ changes encoder behavior, these tests will catch regression |
| WebP metadata | Post-MVP | New format = new scanner functions |

## 7. Deviations from Prompt

None. All requirements R1–R8 satisfied. No new dependencies. No UI changes. No Wasm API changes. No PreserveExif or PreserveColorProfile implementation. All source metadata (EXIF, tEXt, eXIf) confirmed not propagated through either transmutation direction.

---

### Self-Check (Exit Gate)

- [x] Source JPEG with EXIF → output PNG without `eXIf`/source EXIF propagation (tested: `source_jpeg_exif_not_in_output_png`)
- [x] Source PNG with `tEXt` → output JPEG without EXIF APP1 / source text string (tested: `source_png_text_not_in_output_jpeg`)
- [x] Helper unit tests pass for detection true/false cases (7 metadata scanner tests)
- [x] All pre-existing workspace tests pass (regression: 36/36)
- [x] SPEC §5.10.7 marked implemented; §5.8 task noted complete
- [x] Report documents minimal encoder output: JFIF APP0 in JPEG, IHDR/IDAT/IEND in PNG

---

## 8. Chief Architect Review (Second Filter)

**Reviewer:** Cursor (Chief Architect)  
**Date:** 2026-06-02  
**Verdict:** **Approved** (with minor corrections applied before merge)

### Validation Summary

| Check | Result |
|-------|--------|
| SPEC §5.10 StripAll verification | Pass |
| Metadata scanners in `core_utils` | Pass — zero deps, bounded scans |
| JPG EXIF → PNG integration test | Pass |
| PNG tEXt → JPG integration test | Pass |
| `cargo test --workspace` | Pass (36 tests) |
| No Wasm API / UI changes | Pass |

### Corrections Applied by Architect

1. **PNG chunk walker:** Safer advance with overflow/bounds guard in `png_has_chunk`.
2. **SPEC §6.1:** Updated capability list and test count (26).
3. **README:** Version aligned to v0.5.3.
