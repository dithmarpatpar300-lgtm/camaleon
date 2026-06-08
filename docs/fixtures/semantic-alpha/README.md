# Semantic Alpha Engine — test fixtures

Fixtures for regression-testing **meaningful** vs **structural** alpha (Semantic Alpha Engine, v1.11).

## Naming convention

| Pattern | Meaning |
|---------|---------|
| `opaque-rgba.{ext}` | Format stores an alpha channel, but every α = 255 (no visible transparency) |
| `real-alpha.{ext}` | At least one pixel with α &lt; 255 (or GIF transparent index in use) |
| `rgb-no-alpha.{ext}` | No alpha channel in container |

## Expected UI behavior (lossy → JPG tools)

| Fixture type | `TransparencyNotice` | Background picker |
|--------------|---------------------|-------------------|
| `opaque-rgba` | Hidden | Hidden |
| `real-alpha` | Shown | Shown |
| `rgb-no-alpha` | Hidden | Hidden |

## Committed fixtures

| File | Format | Type |
|------|--------|------|
| `opaque-rgba.png` | PNG | opaque RGBA |
| `real-alpha.png` | PNG | real alpha |
| `opaque-rgba.webp` | WebP | opaque RGBA |
| `real-alpha.webp` | WebP | real alpha |
| `opaque-gif.gif` | GIF | opaque RGBA |
| `transparent-gif.gif` | GIF | binary transparency |
| `rgb-no-alpha.gif` | GIF | RGB only |
| `opaque-rgba.tiff` | TIFF | opaque RGBA |
| `real-alpha.tiff` | TIFF | real alpha |

Regenerate programmatic fixtures:

```bash
cargo test -p core_utils write_semantic_alpha_fixtures -- --ignored --nocapture
cargo test -p transmutador_gif write_semantic_alpha_gif_fixtures -- --ignored --nocapture
cargo test -p transmutador_tiff write_semantic_alpha_tiff_fixtures -- --ignored --nocapture
```

## External manual QA

| File | Tool | Expect notice |
|------|------|---------------|
| `file_example_TIFF_10MB.tiff` | TIFF→JPG | **No** |

## Contract tests

Per lossy crate: `assess_*().has_meaningful_alpha` must match whether encode performs alpha flatten.

```bash
cargo test -p transmutador_bmp --test semantic_alpha_contract
cargo test -p transmutador_png --test semantic_alpha_contract
cargo test -p transmutador_webp --test semantic_alpha_contract
cargo test -p transmutador_gif --test semantic_alpha_contract
cargo test -p transmutador_tiff --test semantic_alpha_contract
```

See `docs/planning/semantic_alpha_engine_plan.md` §8.2.
