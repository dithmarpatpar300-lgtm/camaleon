# Category 1 — Scientific Study of the WebP Format

> **Project:** Picture-VP8
> **Purpose:** Establish a complete theoretical understanding of the WebP format — container, codecs, color science, and compression theory — before attempting any implementation.
> **Audience:** Engineers building the VP8 lossy encoder.
> **Principle:** You cannot build what you do not understand. This document exists to ensure every architectural decision in later phases is grounded in format science, not guesswork.

---

## Table of contents

1. [WebP format history and evolution](#1-webp-format-history-and-evolution)
2. [RIFF container architecture](#2-riff-container-architecture)
3. [VP8L lossless codec (what exists today)](#3-vp8l-lossless-codec-what-exists-today)
4. [VP8 lossy codec (what we will build)](#4-vp8-lossy-codec-what-we-will-build)
5. [VP8X extended format](#5-vp8x-extended-format)
6. [Color space science](#6-color-space-science)
7. [Compression theory fundamentals](#7-compression-theory-fundamentals)
8. [WebP vs other image formats](#8-webp-vs-other-image-formats)
9. [Current Rust/Wasm ecosystem state](#9-current-rustwasm-ecosystem-state)
10. [Standards and references](#10-standards-and-references)

---

## 1. WebP format history and evolution

### 1.1 Origins

| Date | Event |
|------|-------|
| **2001** | On2 Technologies releases VP3, later open-sourced as Theora |
| **2005** | On2 releases VP6 (used by Flash Video) |
| **2008** | On2 releases VP7 and VP8 codecs |
| **2010-02** | Google acquires On2 Technologies for $124.6M |
| **2010-09-30** | Google announces **WebP** — "a new image format for the web" based on VP8 intra-frame coding |
| **2010-10** | WebP lossy support ships in Chrome 9 (behind flag) |
| **2011-05** | WebP lossless (VP8L) announced — separate codec, not related to VP8 |
| **2011-11** | Extended format (VP8X) proposed — alpha, animation, metadata |
| **2012-03** | Animated WebP spec published |
| **2014-12** | Chrome 32+ enables WebP by default |
| **2019-05** | Firefox 65 ships WebP support (lossy + lossless) |
| **2020-09** | Safari 14 (iOS 14 / macOS 11) ships WebP support |
| **2026** | WebP has >97% browser support globally (caniuse) |

### 1.2 Design goals

WebP was designed to address three limitations of existing web image formats:

| Limitation of existing formats | WebP solution |
|-------------------------------|---------------|
| JPEG has no alpha channel | WebP lossy supports alpha (via ALPH chunk or VP8X) |
| PNG is large for photographs | WebP lossy is 25-35% smaller than JPEG at equivalent quality |
| No single format supports both lossy and lossless | WebP supports both via VP8 (lossy) and VP8L (lossless) codecs |

### 1.3 What "VP8 intra-frame" means

VP8 is fundamentally a **video codec**. A VP8 video stream consists of keyframes (intra-coded) and inter-frames (predicted from previous frames). WebP uses **only the keyframe (intra-frame) encoding** — a single standalone frame with no temporal prediction.

This distinction is critical for Picture-VP8:

| VP8 video | WebP (VP8 lossy) |
|-----------|-------------------|
| Multiple frames | Single frame |
| Inter-frame prediction (motion vectors) | **Not used** |
| Temporal entropy adaptation | **Not used** |
| Rate control across frames | Rate control for single frame only |
| Frame header includes frame type | Frame header is always keyframe (type 0) |

**Implication:** We only need to implement the intra-frame subset of VP8. This eliminates motion estimation, motion vector coding, reference frame management, and temporal scalability — roughly 40% of the full VP8 spec is irrelevant.

---

## 2. RIFF container architecture

### 2.1 What RIFF is

RIFF (Resource Interchange File Format) is a generic chunk-based container format developed by Microsoft and IBM in 1991. It is the same container used by WAV (audio) and AVI (video). WebP adopted RIFF because it provides a simple, extensible structure for embedding different codec payloads.

### 2.2 RIFF byte-level structure

Every WebP file begins with a RIFF header:

```
Offset  Bytes  Field          Value
------  -----  -----------    ---------------------------------
0       4      FourCC         "RIFF" (0x52 0x49 0x46 0x46)
4       4      File size      uint32 LE (file size - 8)
8       4      WebP type      "WEBP" (0x57 0x45 0x42 0x50)
12      ...    chunks         One or more RIFF chunks follow
```

Each chunk within the file follows this structure:

```
Offset  Bytes  Field          Value
------  -----  -----------    ---------------------------------
0       4      Chunk FourCC   e.g. "VP8 ", "VP8L", "VP8X"
4       4      Chunk size     uint32 LE (chunk data size, NOT including FourCC + size fields)
8       ...    Chunk data     Payload bytes
8+N     0-1    Padding        0x00 if chunk data size is odd (RIFF alignment rule)
```

**Critical detail:** The chunk size field does **not** include the 8-byte header (FourCC + size). The actual bytes consumed by a chunk on disk are `8 + chunk_size + (chunk_size % 2)`.

### 2.3 WebP chunk types

| FourCC | Name | Purpose | Required? |
|--------|------|---------|-----------|
| `"VP8 "` | Lossy bitstream | VP8 intra-frame encoded image data | One of VP8/VP8L required |
| `"VP8L"` | Lossless bitstream | VP8L lossless encoded image data | One of VP8/VP8L required |
| `"VP8X"` | Extended header | Flags + canvas dimensions; enables alpha, animation, metadata | Required for extended features |
| `"ALPH"` | Alpha plane | Pre-multiplied or non-pre-multiplied alpha for VP8 lossy | Only with VP8X + alpha flag |
| `"ANIM"` | Animation header | Global animation parameters (loop count, background) | Only for animated WebP |
| `"ANMF"` | Animation frame | Single animation frame (can contain VP8/VP8L + ALPH) | One per animation frame |
| `"EXIF"` | EXIF metadata | Camera metadata (GPS, orientation, etc.) | Optional |
| `"XMP "` | XMP metadata | Adobe XMP metadata | Optional |
| `"ICCP"` | ICC profile | Color management profile | Optional |

### 2.4 Simple vs Extended profile

**Simple profile** (no VP8X chunk):
```
RIFF <size> WEBP
  VP8  <size> <lossy bitstream>        ← lossy, no alpha, no metadata
  -- OR --
  VP8L <size> <lossless bitstream>     ← lossless, no metadata
```

**Extended profile** (with VP8X chunk):
```
RIFF <size> WEBP
  VP8X <size> <flags(1) + reserved(3) + canvas_width_24(3) + canvas_height_24(3)>
  [ICCP <size> <icc_data>]             ← if ICC flag set, BEFORE VP8/VP8L
  [ALPH <size> <alpha_data>]           ← if alpha flag set, BEFORE VP8
  VP8  <size> <lossy bitstream>        ← OR VP8L
  [EXIF <size> <exif_data>]            ← if EXIF flag set, AFTER VP8/VP8L
  [XMP  <size> <xmp_data>]             ← if XMP flag set, AFTER EXIF
```

### 2.5 VP8X flags byte

The VP8X chunk's first byte is a flags field:

| Bit | Flag | Meaning when set |
|-----|------|------------------|
| 0 | Reserved | Must be 0 |
| 1 | Animation | File is animated |
| 2 | XMP | XMP metadata present |
| 3 | EXIF | EXIF metadata present |
| 4 | Alpha | Alpha channel present |
| 5 | ICC | ICC profile present |
| 6-7 | Reserved | Must be 0 |

### 2.6 Dimension encoding in VP8X

VP8X stores canvas dimensions as 24-bit values (width-1 and height-1):

```
Byte 4-6:  [width-1]  (24-bit LE, stored as 3 bytes)
Byte 7-9:  [height-1] (24-bit LE, stored as 3 bytes)
```

Maximum WebP dimensions: 16383 × 16383 (24-bit max value + 1).

**Camaleon implication:** The RIFF container writer is the simplest part of Picture-VP8. The existing `image-webp` `encoder.rs` already has a `write_chunk()` function (line 607) that handles FourCC + size + padding. Adapting it to write `"VP8 "` instead of `"VP8L"` is a ~30-line change. The hard part is the VP8 bitstream payload inside that chunk.

---

## 3. VP8L lossless codec (what exists today)

### 3.1 Overview

VP8L is a **completely separate codec** from VP8. It shares the RIFF container but has no algorithmic relationship to VP8 lossy. VP8L was designed by Google as a PNG alternative — typically 25-35% smaller than PNG for the same image.

### 3.2 VP8L encoding pipeline

```
Input pixels (ARGB)
  │
  ├── 1. Transform: Subtract-green (R -= G, B -= G)
  ├── 2. Transform: Predictor (per-block prediction from neighbors)
  ├── 3. Transform: Color cache (hash table of recent colors)
  ├── 4. Transform: Cross-color (subtracts predicted color)
  │
  ├── 5. Frequency scan: count symbol frequencies per channel
  ├── 6. Huffman tree construction: canonical, length-limited to 15 bits
  ├── 7. Huffman tree serialization: code-length coding with run-length
  │
  └── 8. Pixel data: interleave Huffman codes (G → R → B → A order)
            with inline LZ77 run-length (symbols 256-279, max run 4096)
```

### 3.3 VP8L bitstream header

```
Bit 0-15:   Signature byte 0x2F (3 bits) + width-1 (14 bits)
Bit 16-29:  height-1 (14 bits)
Bit 30:     alpha-used (1 bit)
Bit 31-33:  version (3 bits, must be 0)
Bit 34+:    transforms + huffman trees + pixel data
```

### 3.4 Current state in `image-webp` v0.2.4

The `encoder.rs` (855 lines) implements VP8L with these limitations:

| Feature | Status |
|---------|--------|
| Subtract-green transform | ✅ Always applied |
| Predictor transform | ✅ Configurable (`usepredictor_transform` flag) |
| Color cache | ❌ Hardcoded OFF (0x0) |
| Cross-color transform | ❌ Not implemented |
| Meta-Huffman | ❌ Not implemented |
| LZ77 run-length | ✅ Implemented (symbols 256-279) |
| Multi-tree (2-codec mode) | ❌ Single Huffman tree per channel |

**Implication for Picture-VP8:** VP8L is **not a stepping stone** to VP8 lossy. They are entirely different algorithms. The VP8L encoder shares zero code with what we need to build. The only shared component is the RIFF container writer.

---

## 4. VP8 lossy codec (what we will build)

### 4.1 Overview

VP8 lossy is the original WebP codec (2010). It is based on the VP8 video codec's intra-frame (keyframe) encoding path. The algorithm is a classic block-based hybrid video codec:

```
Input pixels (RGB)
  │
  ├── 1. Color convert: RGB → YUV 4:2:0
  ├── 2. Partition: image into 16×16 macroblocks
  ├── 3. Intra prediction: predict each macroblock from neighbors
  ├── 4. Residual: original - prediction = residual
  ├── 5. Forward DCT: 4×4 DCT on each residual sub-block
  ├── 6. Quantization: divide DCT coefficients by Q table
  ├── 7. Zig-zag scan: reorder coefficients (DC first, high-freq last)
  ├── 8. Entropy coding: boolean arithmetic coder with adaptive probabilities
  ├── 9. In-loop deblocking: smooth block edges to reduce artifacts
  │
  └── 10. Bitstream: pack into VP8 frame format inside RIFF "VP8 " chunk
```

### 4.2 VP8 frame header

The VP8 lossy bitstream starts with a 10-byte uncompressed frame header:

```
Offset  Bits  Field              Description
------  ----  ----------------   ------------------------------------------
0       1     frame_type         0 = keyframe, 1 = inter-frame (always 0 for WebP)
1       3     version            0-3 (affects deblocking, typically 0)
4       19    first_part_size    Size in bytes of the first partition (header + MB modes)
3       1     show_frame         1 = display frame (always 1 for WebP)
4       19    first_part_size    Byte length of the first data partition
5       8     width (low 8)      Image width (14 bits total, 1-based)
6       8     width (high 6) +   Width bits 8-13 in low 6 bits, then
              horizontal scale   2-bit horizontal scale (0 = no scaling)
7       8     height (low 8)     Image height (14 bits total, 1-based)
8       8     height (high 6) +  Height bits 8-13 in low 6 bits, then
              vertical scale     2-bit vertical scale (0 = no scaling)
9       1     color_space        0 = YUV (BT.601), 1 = reserved (undefined)
10      1     clamping_type      0 = no clamping, 1 = clamp to [0, 255]
```

After the 10-byte header, the first partition contains:
- Probability table updates (optional, can use defaults)
- Macroblock mode data (prediction modes for all MBs)

After the first partition, the second partition contains:
- DCT coefficient data (residuals for all MBs)

### 4.3 Macroblock structure

The image is divided into **macroblocks (MB)** of 16×16 pixels. For a W×H image:

```
MB columns = ceil(W / 16)
MB rows    = ceil(H / 16)
Total MBs  = MB_columns × MB_rows
```

Each macroblock contains:
- **Luma (Y):** 4 sub-blocks of 4×4 pixels (16×16 total)
- **Chroma (U):** 1 sub-block of 8×8 pixels (subsampled 4:2:0 → 4×4 for coding)
- **Chroma (V):** 1 sub-block of 8×8 pixels (subsampled 4:2:0 → 4×4 for coding)

For coding purposes, each 16×16 macroblock is processed as **24 sub-blocks of 4×4**:
- 16 luma sub-blocks (Y0-Y15, arranged 4×4)
- 4 chroma-U sub-blocks (U, arranged 2×2 at 4×4 each)
- 4 chroma-V sub-blocks (V, arranged 2×2 at 4×4 each)

### 4.4 Intra prediction modes

VP8 has two levels of intra prediction:

**Macroblock level (16×16)** — 4 modes:

| Mode | Name | Description |
|------|------|-------------|
| `DC_PRED` (0) | DC | Average of all pixels above and to the left |
| `V_PRED` (1) | Vertical | Copy the row above the macroblock |
| `H_PRED` (2) | Horizontal | Copy the column to the left of the macroblock |
| `TM_PRED` (3) | TrueMotion | Whiten gradient: pred = L + A - TL (per pixel) |

When `B_PRED` (4) is selected at MB level, each of the 16 luma 4×4 sub-blocks can independently choose from **10 sub-block modes**:

| Mode | Name | Description |
|------|------|-------------|
| `B_DC` (0) | DC | Average of top and left neighbors |
| `B_TM` (1) | TrueMotion | Whiten gradient (same as TM_PRED but 4×4) |
| `B_VE` (2) | Vertical | Copy column above |
| `B_HE` (3) | Horizontal | Copy row to the left |
| `B_LD` (4) | Left-Down | 135° diagonal prediction |
| `B_RD` (5) | Right-Down | 45° diagonal prediction |
| `B_VR` (6) | Vertical-Right | ~67.5° prediction |
| `B_VL` (7) | Vertical-Left | ~112.5° prediction |
| `B_HD` (8) | Horizontal-Down | ~157.5° prediction |
| `B_HU` (9) | Horizontal-Up | ~22.5° prediction |

**Chroma sub-blocks** always use one of the 4 MB-level modes (DC, V, H, TM), regardless of the luma mode selection.

### 4.5 Transform: Forward DCT 4×4

After prediction, the **residual** (original - prediction) is transformed using a 4×4 Discrete Cosine Transform (DCT-II). VP8 uses an integer approximation of the DCT:

The forward transform takes 4×4 residual values (12-bit signed, range [-2048, 2047]) and produces 16 DCT coefficients.

For the luma DC coefficients (one per 4×4 sub-block, 16 total per MB), an additional **4×4 Walsh-Hadamard Transform (WHT)** is applied to the 16 DC values, producing 4×4 WHT coefficients.

### 4.6 Quantization

DCT coefficients are divided by a quantizer value derived from the quality parameter:

```
quantized_coeff = round(coeff / Q)
```

VP8 uses two quantizer tables:
- `dc_qlookup[128]` — for DC coefficients
- `ac_qlookup[128]` — for AC coefficients

The quality parameter (0-100) maps to a quantizer index (0-127) via a non-linear curve:
- Quality 100 → index 0 (lossless-like, minimal quantization)
- Quality 50 → index ~42 (moderate)
- Quality 0 → index 127 (maximum quantization, heavy loss)

Each macroblock can optionally apply a per-segment quantizer delta (segment-based adaptive quantization).

### 4.7 Entropy coding: Boolean arithmetic coder

VP8 uses a **boolean arithmetic coder** (BAC) — a binary entropy coder that encodes one bit at a time using a probability model. This is different from Huffman coding (used in JPEG and VP8L).

Key properties:
- Encodes binary decisions (0 or 1) with associated probabilities
- Probabilities are **adaptively updated** during encoding
- Uses 256-entry probability tables (values 1-255, never 0 or 256)
- Range and code register are 16-bit, with periodic byte output

The coder maintains two registers:
- `range` (16-bit): current interval size, starts at 32768
- `value` / `low` (16-bit): current interval bottom

For each bit encoded with probability `p`:
```
split = (range × p) >> 8
if bit == 0:  range = split
if bit == 1:  range -= split; low += split
while range < 128:  range <<= 1; low <<= 1;  // renormalization, output byte
```

### 4.8 Probability model

VP8 keyframes use **fixed initial probability tables** (defined in RFC 6386 §19). There are multiple tables:

| Table | Elements | Purpose |
|-------|----------|---------|
| `kf_y_mode_probs` | 4×4 | Luma macroblock mode probabilities |
| `kf_uv_mode_probs` | 4×4 | Chroma macroblock mode probabilities |
| `kf_coeff_probs` | 4×8×3×11 | DCT coefficient probabilities (4 types, 8 bands, 3 contexts, 11 levels) |
| `kf_b_mode_probs` | 10×9 | 4×4 sub-block mode probabilities |

These are **constants of the spec** — hard-coded values that every conformant VP8 encoder must use as starting probabilities.

### 4.9 In-loop deblocking filter

VP8 applies a deblocking filter **during encoding** (in-loop, not post-process). The filter smooths block edges to reduce visible blockiness, especially at low quality.

The filter operates on 8×8 block boundaries (both horizontal and vertical) with adjustable strength:
- `loop_filter_level` (0-63): controls filter strength
- `sharpness_level` (0-7): controls filter sharpness

The existing `loop_filter.rs` (369 lines) in `image-webp` implements this filter for decode. The same logic applies during encode — the encoder must apply the filter to the reconstructed image and use the filtered result as the reference for subsequent macroblocks.

### 4.10 VP8 partitions

VP8 splits the bitstream into two partitions:

| Partition | Contents | Coded with |
|-----------|----------|------------|
| **First partition** | Frame header + probability updates + macroblock modes | Boolean arithmetic coder |
| **Second partition** | DCT coefficients (residuals) for all macroblocks | Boolean arithmetic coder (separate instance) |

The first partition size is stored in the frame header (3-bit version + 19-bit size field). The second partition follows immediately after.

**Camaleon implication:** The encoder must produce both partitions sequentially. The first partition can be built in a single pass over all macroblocks (collecting mode decisions). The second partition requires the residuals (which depend on the prediction modes chosen in the first partition).

---

## 5. VP8X extended format

### 5.1 Alpha channel (ALPH chunk)

VP8 lossy does not natively support alpha. The extended format adds alpha via a separate `ALPH` chunk that precedes the `VP8 ` chunk:

```
RIFF <size> WEBP
  VP8X <flags: alpha=1> <width> <height>
  ALPH  <size> <alpha_data>
  VP8   <size> <lossy_bitstream>
```

The alpha data itself can be:
- **Uncompressed** (raw alpha plane)
- **VP8L lossless** (same VP8L codec, single channel)
- **Custom filter** (gradient, horizontal/vertical cache)

**Picture-VP8 scope:** Alpha encoding is **Phase 2** (post-MVP). The initial encoder will produce opaque VP8 lossy only. Alpha support requires either reusing the existing VP8L encoder for the alpha plane or implementing the ALPH compression path.

### 5.2 Animation (ANIM/ANMF chunks)

Animated WebP uses VP8X with the animation flag:

```
RIFF <size> WEBP
  VP8X <flags: animation=1> <canvas_width> <canvas_height>
  ANIM  <background_color(4)> <loop_count(2)>
  ANMF  <frame_offset_x(3)> <frame_offset_y(3)> <frame_width(3)> <frame_height(3)>
        <frame_duration(3)> <dispose_flag(1)> <blend_flag(1)>
        [ALPH <alpha_data>]
        VP8  <lossy_bitstream>   (or VP8L)
  ANMF  ... (repeat per frame)
```

**Picture-VP8 scope:** Animation is **out of scope**. Camaleon already rejects animated WebP input (`transmutador_optimize` checks `WebPDecoder::has_animation()`). The encoder will only produce single-frame VP8 lossy.

### 5.3 Metadata (EXIF, XMP, ICCP)

Per Camaleon's **StripAll policy** (SPEC §5.10), the encoder will **not** emit EXIF, XMP, or ICCP chunks. Output contains pixel data and minimal RIFF structure only. This is a deliberate privacy decision, not a technical limitation.

---

## 6. Color space science

### 6.1 RGB vs YUV

RGB represents color as three primary channels (Red, Green, Blue). YUV separates **luma** (brightness, Y) from **chroma** (color difference signals, U and V):

```
Y =  0.299·R + 0.587·G + 0.114·B     (luma, BT.601)
U = -0.169·R - 0.331·G + 0.500·B     (Cb, blue-yellow axis)
V =  0.500·R - 0.419·G - 0.081·B     (Cr, red-cyan axis)
```

**Why YUV for lossy compression:** Human vision is more sensitive to **luma** (brightness detail) than **chroma** (color detail). VP8 exploits this via **chroma subsampling** — the U and V channels are stored at half resolution horizontally and vertically (4:2:0 subsampling), reducing chroma data by 75% with minimal perceptual quality loss.

### 6.2 VP8's YCbCr conversion

VP8 uses BT.601 color space with integer arithmetic. The exact integer conversion from RGB to YUV (as used in `libwebp`):

```
Y = ( 16839·R + 33058·G +  6421·B + 32768) >> 16   (range: 0-255)
U = (-9714·R - 19081·G + 28784·B + 32768) >> 16    (range: -128 to 127, +128 for storage)
V = ( 28784·R - 24103·G -  4683·B + 32768) >> 16   (range: -128 to 127, +128 for storage)
```

The reverse (YUV → RGB, for reconstruction during encode):

```
R = Y + 1.402 × (V - 128)
G = Y - 0.344 × (U - 128) - 0.714 × (V - 128)
B = Y + 1.772 × (U - 128)
```

**Implementation note:** The existing `yuv.rs` (402 lines) in `image-webp` implements the YUV→RGB conversion for decode. The encoder needs the **forward** RGB→YUV conversion, which is not present. This is ~50 lines of integer arithmetic.

### 6.3 4:2:0 chroma subsampling

In 4:2:0 subsampling:
- **Y channel:** Full resolution (W × H)
- **U channel:** Half resolution (W/2 × H/2) — each U sample covers a 2×2 block of Y samples
- **V channel:** Half resolution (W/2 × H/2) — same as U

For a 16×16 macroblock:
- Y: 16×16 = 256 samples (4 sub-blocks of 4×4 = 16 sub-blocks total)
- U: 8×8 = 64 samples (but stored as 4 sub-blocks of 4×4 for coding)
- V: 8×8 = 64 samples (same as U)

The subsampling is performed by averaging each 2×2 block of chroma samples. This is a **lossy** operation — the full-resolution chroma is discarded. This is why VP8 lossy cannot be lossless even at quality 100.

**Camaleon doctrine:** SPEC §5.5.4 notes that `4:2:0` is "correct for photographic content." VP8 lossy is designed for photographic content, so 4:2:0 is the correct (and only) subsampling mode.

---

## 7. Compression theory fundamentals

### 7.1 Why compression works: information redundancy

Image data contains three types of redundancy that compression exploits:

| Redundancy type | Exploited by | VP8 mechanism |
|----------------|-------------|---------------|
| **Spatial redundancy** | Prediction | Intra prediction (neighboring pixels predict current block) |
| **Spectral redundancy** | Transform | DCT concentrates energy in low-frequency coefficients |
| **Statistical redundancy** | Entropy coding | Arithmetic coder assigns fewer bits to common symbols |

### 7.2 Rate-distortion theory

Lossy compression is a trade-off between **rate** (file size, in bits) and **distortion** (quality loss, measured as MSE or SSIM). The rate-distortion function R(D) gives the minimum bits needed to achieve distortion D.

VP8's rate control operates on this principle:
- **Quality parameter** (0-100) → target distortion level
- **Quantizer** → controls the rate-distortion trade-off per coefficient
- **Mode decision** → choose the prediction mode that minimizes RD cost

The RD cost function used in mode decision:

```
cost = distortion + λ × rate
```

Where `λ` is the Lagrangian multiplier derived from the quantizer. Lower `λ` (high quality) favors low distortion; higher `λ` (low quality) favors low rate.

### 7.3 DCT and energy concentration

The Discrete Cosine Transform converts spatial-domain data to frequency-domain data. For natural images, most energy concentrates in the DC and low-frequency AC coefficients:

```
Typical 4×4 DCT coefficient energy distribution (after quantization):

  DC    AC1   AC2   AC3
  AC4   AC5   AC6   AC7
  AC8   AC9   AC10  AC11
  AC12  AC13  AC14  AC15

Energy:  85% in DC + AC1 + AC4 + AC5
         12% in remaining low-freq
          3% in high-freq (often quantized to 0)
```

This is why the zig-zag scan orders DC first — the arithmetic coder can efficiently represent the long run of zeros at the end (high-frequency coefficients that quantized to zero).

### 7.4 Arithmetic coding vs Huffman coding

| Property | Huffman (JPEG, VP8L) | Arithmetic (VP8, H.264, AV1) |
|----------|---------------------|-------------------------------|
| Bits per symbol | Integer (1+ bits) | Fractional (sub-bit) |
| Adaptivity | Static (rebuild tree) | Per-symbol adaptive |
| Probability precision | Power-of-2 only | Any 8-bit probability |
| Compression ratio | Good | 5-15% better than Huffman |
| Implementation complexity | Moderate | Higher (range/carry management) |
| Patent risk | Expired | Expired (VP8 BAC is royalty-free) |

VP8's choice of arithmetic coding over Huffman is one reason WebP lossy achieves better compression than JPEG at equivalent quality.

### 7.5 Quantization and deadzone

VP8 uses uniform quantization with a **deadzone** — coefficients near zero are quantized to zero more aggressively than larger coefficients:

```
quantized = round(coeff / Q)   // for most coefficients
quantized = (coeff + Q/3) / Q  // deadzone bias for AC coefficients
```

The deadzone biases the quantizer toward zero, which increases the number of zero coefficients (improving compression) at the cost of slight detail loss in flat regions.

---

## 8. WebP vs other image formats

### 8.1 Comparison matrix

| Format | Codec | Lossy | Lossless | Alpha | Animation | Max bits/pixel | Typical photo size |
|--------|-------|-------|----------|-------|-----------|----------------|-------------------|
| **JPEG** | DCT + Huffman | ✅ | ❌ | ❌ | ❌ | 8 | Baseline (100%) |
| **PNG** | DEFLATE + filters | ❌ | ✅ | ✅ | ❌ | 32 | 500-900% of JPEG |
| **WebP (VP8)** | DCT + BAC | ✅ | ❌ | ✅ (ALPH) | ✅ | 8 | **65-75% of JPEG** |
| **WebP (VP8L)** | Predictor + Huffman | ❌ | ✅ | ✅ | ✅ | 32 | 70-80% of PNG |
| **AVIF** | AV1 + BAC | ✅ | ✅ | ✅ | ✅ | 12 | **35-50% of JPEG** |
| **HEIC** | HEVC | ✅ | ✅ | ✅ | ✅ | 12 | ~50% of JPEG |

### 8.2 WebP lossy vs JPEG

| Aspect | JPEG | WebP (VP8 lossy) |
|--------|------|-------------------|
| Transform | 8×8 DCT | 4×4 DCT + 4×4 WHT for DC |
| Entropy coder | Huffman | Arithmetic (BAC) |
| Block size | 8×8 | 16×16 MB → 4×4 sub-blocks |
| Intra prediction | None (DC-only) | 14 modes (4 MB + 10 sub-block) |
| Chroma subsampling | 4:2:0, 4:2:2, 4:4:4 | 4:2:0 only |
| Alpha | No | Yes (ALPH chunk) |
| Typical savings vs JPEG | — | 25-35% smaller at same SSIM |

**Why WebP wins:** The 4×4 block size reduces blockiness artifacts, the arithmetic coder saves 5-15% over Huffman, and the 14 intra prediction modes reduce residual energy compared to JPEG's no-prediction approach.

### 8.3 WebP vs AVIF

| Aspect | WebP (VP8) | AVIF (AV1) |
|--------|-----------|------------|
| Codec generation | 2008 (VP8) | 2018 (AV1) |
| Block size | 4×4 to 16×16 | 4×4 to 128×128 |
| Prediction modes | 14 | 50+ (directional + complex) |
| Transform | DCT 4×4 + WHT | DCT/ADST 4×4 to 64×64 |
| Entropy coder | BAC (8-bit prob) | Multi-symbol BAC |
| Compression ratio | 25-35% better than JPEG | 50%+ better than JPEG |
| Encode speed | Fast | Slow (10-100x slower) |
| Wasm feasibility | Tractable (5-8 KLOC) | Very hard (AV1 is ~100K+ LOC) |

**Why Camaleon targets VP8, not AV1:** AV1 is an order of magnitude more complex. A pure-Rust AV1 encoder is not feasible for a small team. VP8's intra-frame subset is tractable. Camaleon already has AVIF **decode** (via `transmutador_avif` using the `ravif` crate), but AVIF **encode** uses `transmutador_avif_encode` which wraps the `ravif` crate — a pure-Rust AV1 encoder that took years to build.

---

## 9. Current Rust/Wasm ecosystem state

### 9.1 `image-webp` v0.2.4

| Component | Lines | Direction | Reusable for encode? |
|-----------|-------|-----------|---------------------|
| `encoder.rs` | 855 | VP8L encode | ❌ Different codec |
| `vp8.rs` | 2,897 | VP8 decode | Partial — prediction modes, loop filter logic |
| `vp8_arithmetic_decoder.rs` | 541 | BAC decode | ❌ Need encoder (mirror) |
| `transform.rs` | 67 | IDCT decode | ❌ Need FDCT (forward) |
| `loop_filter.rs` | 369 | Deblock (decode) | ✅ Reusable as-is |
| `yuv.rs` | 402 | YUV→RGB | Need RGB→YUV (forward) |
| `huffman.rs` | ~400 | VP8L only | ❌ Not used in VP8 |
| `lossless.rs` | ~300 | VP8L only | ❌ Not used in VP8 |
| `extended.rs` | ~200 | VP8X parse | Partial — chunk structure reference |

**Total reusable:** ~1,100 lines (loop_filter + yuv reverse + vp8 prediction reference)
**Total to build from scratch:** ~5,000-8,000 lines (FDCT, quantizer, BAC encoder, mode decision, bitstream writer, probability tables, rate control)

### 9.2 Other Rust WebP crates

| Crate | Type | VP8 lossy encode? | Wasm compatible? |
|-------|------|-------------------|------------------|
| `image-webp` | Pure Rust | ❌ VP8L only | ✅ |
| `webp` | C wrapper (`libwebp-sys`) | ✅ | ❌ (requires `cc`) |
| `libwebp` | C (Google) | ✅ | ❌ (not Rust) |
| `webp-encoder` | C wrapper | ✅ | ❌ (requires `cc`) |

**There is no pure-Rust VP8 lossy encoder anywhere.** Picture-VP8 would be the first.

### 9.3 Pure-Rust codec precedents

| Codec | Crate | Lines | Status |
|-------|-------|-------|--------|
| AV1 | `rav1e` | ~100,000 | Production (used by Mozilla) |
| AV1 | `ravif` | ~15,000 (wrapper) | Production (used by Camaleon) |
| H.262 (MPEG-2) | `mpeg2_codec` | ~30,000 | Experimental |
| Ogg Theora | `theora_decode` | ~20,000 | Decode only |
| Dirac | `dirac` | ~15,000 | Experimental |

**Precedent conclusion:** Pure-Rust codecs exist and work in production. `rav1e` proves that even AV1 (far more complex than VP8) can be implemented in pure Rust. VP8 intra-frame is a subset of VP8, which is simpler than AV1 by an order of magnitude.

---

## 10. Standards and references

### 10.1 Normative references

| Document | What it defines |
|----------|----------------|
| **RFC 6386** | VP8 bitstream specification — the authoritative spec for all VP8 encoding/decoding |
| **WebP Container Specification** | RIFF chunk structure, VP8X flags, ALPH format (Google developers.google.com) |
| **VP8 Data Format and Decoding Guide** | RFC 6386 companion guide with examples |
| **BT.601** | ITU-R color space standard for YUV conversion |

### 10.2 Informative references

| Source | Use |
|--------|-----|
| `libwebp` C source | Reference implementation for validation (not integration) |
| `image-webp` v0.2.4 source | Existing VP8L encoder + VP8 decoder (code structure reference) |
| `rav1e` source | Pure-Rust codec architecture patterns |
| `docs/planning/tier4a_2_matrix_expand_investigation.md` | Camaleon investigation that confirmed VP8 lossy blocker |
| `docs/SPEC.md` §5.12 | Camaleon WebP format science doctrine |

### 10.3 Key spec sections for implementation

| RFC 6386 section | Content | Priority |
|-------------------|---------|----------|
| §9 | Frame header format | Phase 1 |
| §10 | Macroblock parsing | Phase 1 |
| §11 | Macroblock modes | Phase 1 |
| §13 | Boolean entropy coder | Phase 1 |
| §14 | Transform coefficients | Phase 1 |
| §15 | DCT and WHT transforms | Phase 1 |
| §16 | Prediction modes (16×16) | Phase 2 |
| §17 | Prediction modes (4×4) | Phase 2 |
| §18 | Loop filter | Phase 2 |
| §19 | Probability tables | Phase 1 |
| §20 | Segment-based features | Phase 3 (optional) |

---

## Summary

WebP is a RIFF container wrapping one of two codecs: VP8L (lossless, exists in Rust) or VP8 (lossy, does not exist in Rust). VP8 lossy is a block-based hybrid codec using YUV 4:2:0 color space, 4×4 DCT, boolean arithmetic coding, and 14 intra prediction modes. The VP8 video spec (RFC 6386) covers the full video codec, but WebP only uses the intra-frame (keyframe) subset — eliminating 40% of the spec's complexity.

The `image-webp` crate has a VP8 **decoder** (2,897 lines) that provides partial reference material for prediction modes, loop filter, and YUV conversion. The **encoder** must be built from scratch: forward DCT, quantizer, arithmetic encoder (mirror of decoder), mode decision, probability tables, and bitstream writer. Estimated effort: 5,000-8,000 lines of pure Rust.

No pure-Rust VP8 lossy encoder exists anywhere. Picture-VP8 would be the first — benefiting Camaleon, the `image-webp` crate, and the broader Rust/Wasm ecosystem.

---

*Category 1 complete. Next: [Category 2 — Algorithmic Understanding](02_algorithmic_understanding.md)*

*Last updated: 2026-06-28 · Picture-VP8 · Camaleon v3.9.3*
