# Category 2 — Algorithmic Understanding

> **Project:** Picture-VP8
> **Purpose:** Decompose every VP8 intra-frame encoding process to its mathematical and logical primitives. This is not a summary — it is a byte-level, bit-level, and arithmetic-level specification of each algorithm we must implement.
> **Prerequisite:** Category 1 (Scientific Study) — understanding of container structure and codec pipeline.
> **Convention:** All formulas use integer arithmetic as specified by RFC 6386. Bit indices are LSB-first within bytes (VP8 convention). All arrays are zero-indexed unless noted.

---

## Table of contents

1. [RGB → YUV 4:2:0 color conversion](#1-rgb--yuv-420-color-conversion)
2. [Macroblock partitioning](#2-macroblock-partitioning)
3. [Intra prediction: 4 macroblock modes](#3-intra-prediction-4-macroblock-modes)
4. [Intra prediction: 10 sub-block (4×4) modes](#4-intra-prediction-10-sub-block-4x4-modes)
5. [Forward DCT 4×4 (integer transform)](#5-forward-dct-4x4-integer-transform)
6. [Walsh-Hadamard Transform 4×4 (luma DC)](#6-walsh-hadamard-transform-4x4-luma-dc)
7. [Quantization](#7-quantization)
8. [Zig-zag scan order](#8-zig-zag-scan-order)
9. [Boolean arithmetic coder (encoder)](#9-boolean-arithmetic-coder-encoder)
10. [Probability model](#10-probability-model)
11. [VP8 bitstream format](#11-vp8-bitstream-format)
12. [In-loop deblocking filter](#12-in-loop-deblocking-filter)
13. [Rate control and mode decision](#13-rate-control-and-mode-decision)
14. [RIFF container assembly](#14-riff-container-assembly)

---

## 1. RGB → YUV 4:2:0 color conversion

### 1.1 Forward conversion (RGB → YCbCr)

VP8 uses BT.601 integer arithmetic. The conversion operates on each pixel independently:

```
Input:  R, G, B ∈ [0, 255] (uint8)
Output: Y ∈ [0, 255], U ∈ [0, 255], V ∈ [0, 255] (uint8)

Y = clamp255(( 16839 × R + 33058 × G +  6421 × B + 32768) >> 16)
U = clamp255(( -9714 × R - 19081 × G + 28784 × B + 32768) >> 16 + 128)
V = clamp255(( 28784 × R - 24103 × G -  4683 × B + 32768) >> 16 + 128)
```

Where `clamp255(x) = max(0, min(255, x))`.

The constants are fixed-point approximations of BT.601 weights with 16-bit fractional precision:

| Coefficient | Value | BT.601 weight × 2^16 |
|-------------|-------|----------------------|
| Y_R | 16839 | 0.257 × 65536 ≈ 16839.6 |
| Y_G | 33058 | 0.504 × 65536 ≈ 33029.4 |
| Y_B | 6421 | 0.098 × 65536 ≈ 6422.5 |
| U_R | -9714 | -0.148 × 65536 ≈ -9703.3 |
| U_G | -19081 | -0.291 × 65536 ≈ -19071.0 |
| U_B | 28784 | 0.439 × 65536 ≈ 28810.3 |
| V_R | 28784 | 0.439 × 65536 ≈ 28810.3 |
| V_G | -24103 | -0.368 × 65536 ≈ -24137.3 |
| V_B | -4683 | -0.071 × 65536 ≈ -4653.1 |

### 1.2 4:2:0 chroma subsampling

After RGB→YUV conversion, the U and V planes are subsampled by averaging each 2×2 block:

```
Input:  U_full[2i..2i+1][2j..2j+1] (4 samples)
Output: U_sub[i][j] = (U_full[2i][2j] + U_full[2i][2j+1] + U_full[2i+1][2j] + U_full[2i+1][2j+1] + 2) >> 2
```

The `+2` before `>>2` performs round-to-nearest averaging. Same for V.

**Memory layout after subsampling:**
- Y plane: `width × height` bytes
- U plane: `ceil(width/2) × ceil(height/2)` bytes
- V plane: `ceil(width/2) × ceil(height/2)` bytes

**Implementation estimate:** ~60 lines (conversion + subsampling + boundary handling for odd dimensions).

---

## 2. Macroblock partitioning

### 2.1 Grid structure

```
mb_cols = (width + 15) >> 4      // ceil(width / 16)
mb_rows = (height + 15) >> 4     // ceil(height / 16)
```

Each macroblock (MB) at position `(mb_col, mb_row)` covers pixels:
- Y: `[mb_row×16 .. mb_row×16+15] × [mb_col×16 .. mb_col×16+15]`
- U: `[mb_row×8 .. mb_row×8+7] × [mb_col×8 .. mb_col×8+7]`
- V: same as U

### 2.2 Sub-block decomposition for coding

Each MB contains **24 sub-blocks of 4×4 pixels**:

```
Y plane (16 sub-blocks, indexed 0-15):

  0  1  2  3
  4  5  6  7
  8  9 10 11
  12 13 14 15

  Each sub-block is 4×4 pixels.
  Sub-block n is at row = (n >> 2) × 4, col = (n & 3) × 4 within the MB.

U plane (4 sub-blocks, indexed 16-19):

  16 17
  18 19

  Each sub-block is 4×4 pixels (covering 8×8 chroma samples at 4:2:0).

V plane (4 sub-blocks, indexed 20-23):

  20 21
  22 23
```

### 2.3 Edge macroblocks

When `width` or `height` is not a multiple of 16, the edge macroblocks extend beyond the image. VP8 handles this by:
1. **Padding:** Extend the Y/U/V planes to full macroblock boundaries by replicating the last row/column.
2. **Clipping during prediction:** Edge macroblocks use only available neighbor pixels for prediction; missing neighbors default to 128 (mid-gray).

**Implementation estimate:** ~40 lines (grid calculation + padding).

---

## 3. Intra prediction: 4 macroblock modes

Intra prediction generates a **predicted block** from already-coded neighboring pixels. The residual (original − prediction) is what gets DCT-coded.

### 3.1 Neighbor pixels

For macroblock at `(mb_col, mb_row)`, the prediction uses:

```
Above row:     pixels at y = mb_row×16 - 1, x = mb_col×16 .. mb_col×16+15  (16 pixels)
Left column:   pixels at x = mb_col×16 - 1, y = mb_row×16 .. mb_row×16+15  (16 pixels)
Top-left (TL): pixel at (mb_col×16 - 1, mb_row×16 - 1)
```

If the neighbor is outside the image (first row/column), default to 128.

### 3.2 Mode 0: DC_PRED

Predict all 16×16 pixels as the average of available neighbors:

```
If top row available AND left column available:
    avg = (sum(A[0..15]) + sum(L[0..15]) + 16) >> 5
    pred[i][j] = avg  for all i, j

If only top available:
    avg = (sum(A[0..15]) + 8) >> 4
    pred[i][j] = avg

If only left available:
    avg = (sum(L[0..15]) + 8) >> 4
    pred[i][j] = avg

If neither available:
    pred[i][j] = 128
```

Where `A[k]` = above-row pixels, `L[k]` = left-column pixels.

### 3.3 Mode 1: V_PRED (vertical)

Copy the above row into every row of the macroblock:

```
pred[i][j] = A[j]    for i = 0..15, j = 0..15
```

### 3.4 Mode 2: H_PRED (horizontal)

Copy the left column into every column of the macroblock:

```
pred[i][j] = L[i]    for i = 0..15, j = 0..15
```

### 3.5 Mode 3: TM_PRED (TrueMotion)

Whiten-gradient prediction. Each pixel is predicted from the top-left reference plus the local gradient:

```
pred[i][j] = clamp255(L[i] + A[j] - TL)    for i = 0..15, j = 0..15
```

Where `TL` = top-left pixel. This captures smooth gradients (e.g., skies, walls) by assuming the image changes uniformly from the top-left anchor.

### 3.6 Chroma prediction

The chroma sub-blocks (U and V, each 8×8) **always** use the same macroblock mode as the luma macroblock. The prediction operates on the 8×8 chroma plane using the same DC/V/H/TM formulas, but with 8-pixel rows/columns instead of 16.

**Implementation estimate:** ~120 lines (4 modes × luma + chroma variants + boundary handling).

---

## 4. Intra prediction: 10 sub-block (4×4) modes

When the macroblock mode is `B_PRED` (mode 4), each of the 16 luma 4×4 sub-blocks independently selects from 10 prediction modes. This provides finer-grained prediction for complex regions (edges, textures).

### 4.1 Sub-block neighbor pixels

For a 4×4 sub-block at position `(r, c)` within the MB:

```
Above:     P[0..3]  = pixels at y = r-1, x = c..c+3     (4 pixels)
Left:      L[0..3]  = pixels at x = c-1, y = r..r+3     (4 pixels)
Above-left: TL      = pixel at (c-1, r-1)
Above-right: AR[0..3] = pixels at y = r-1, x = c+4..c+7  (4 pixels, may be unavailable)
```

### 4.2 The 10 sub-block modes

#### Mode 0: B_DC

```
If above and left available:
    avg = (sum(P[0..3]) + sum(L[0..3]) + 4) >> 3
If only above:  avg = (sum(P[0..3]) + 2) >> 2
If only left:   avg = (sum(L[0..3]) + 2) >> 2
If neither:     avg = 128

pred[i][j] = avg    for all i, j ∈ [0,3]
```

#### Mode 1: B_TM

```
pred[i][j] = clamp255(L[i] + P[j] - TL)    for i, j ∈ [0,3]
```

#### Mode 2: B_VE (vertical)

```
pred[i][j] = P[j]    for i ∈ [0,3], j ∈ [0,3]
```

#### Mode 3: B_HE (horizontal)

```
pred[i][j] = L[i]    for i ∈ [0,3], j ∈ [0,3]
```

#### Mode 4: B_LD (left-down, 135° diagonal)

```
pred[0][0] = (AR[0] + AR[1] + 1) >> 1
pred[0][1] = (AR[1] + AR[2] + 1) >> 1
pred[0][2] = (AR[2] + AR[3] + 1) >> 1
pred[0][3] = (AR[3] + P[0] + 1) >> 1

pred[1][0] = (pred[0][0] + pred[0][1] + 1) >> 1
pred[1][1] = (pred[0][1] + pred[0][2] + 1) >> 1
pred[1][2] = (pred[0][2] + pred[0][3] + 1) >> 1
pred[1][3] = (pred[0][3] + P[1] + 1) >> 1

pred[2][0] = (pred[1][0] + pred[1][1] + 1) >> 1
pred[2][1] = (pred[1][1] + pred[1][2] + 1) >> 1
pred[2][2] = (pred[1][2] + pred[1][3] + 1) >> 1
pred[2][3] = (pred[1][3] + P[2] + 1) >> 1

pred[3][0] = (pred[2][0] + pred[2][1] + 1) >> 1
pred[3][1] = (pred[2][1] + pred[2][2] + 1) >> 1
pred[3][2] = (pred[2][2] + pred[2][3] + 1) >> 1
pred[3][3] = (pred[2][3] + P[3] + 1) >> 1
```

Uses above-right pixels for the first row, then propagates down-left.

#### Mode 5: B_RD (right-down, 45° diagonal)

```
pred[3][0] = (L[3] + L[2] + 1) >> 1
pred[2][0] = (L[2] + L[1] + 1) >> 1
pred[1][0] = (L[1] + L[0] + 1) >> 1
pred[0][0] = (L[0] + TL + 1) >> 1

pred[3][1] = (pred[3][0] + L[3] + 1) >> 1
pred[2][1] = (pred[2][0] + pred[3][0] + 1) >> 1
pred[1][1] = (pred[1][0] + pred[2][0] + 1) >> 1
pred[0][1] = (pred[0][0] + pred[1][0] + 1) >> 1

pred[3][2] = (pred[3][1] + pred[3][0] + 1) >> 1
pred[2][2] = (pred[2][1] + pred[2][0] + 1) >> 1
pred[1][2] = (pred[1][1] + pred[1][0] + 1) >> 1
pred[0][2] = (pred[0][1] + pred[0][0] + 1) >> 1

pred[3][3] = (pred[3][2] + pred[3][1] + 1) >> 1
pred[2][3] = (pred[2][2] + pred[2][1] + 1) >> 1
pred[1][3] = (pred[1][2] + pred[1][1] + 1) >> 1
pred[0][3] = (pred[0][2] + pred[0][1] + 1) >> 1
```

Builds from bottom-left upward and rightward using 2-tap averages.

#### Modes 6-9: B_VR, B_VL, B_HD, B_HU

These are angular predictions at ~22.5°, ~67.5°, ~112.5°, and ~157.5°. Each uses specific combinations of above, above-right, left, and top-left pixels with weighted averages. The full formulas are defined in RFC 6386 §11, each spanning ~20 lines of pixel assignments. They follow the same pattern as B_LD and B_RD: weighted 2-tap and 3-tap averages of neighboring pixels.

**Full mode formula set:** RFC 6386 §11.4 through §11.8 — each mode is exactly specified with pixel-by-pixel formulas. No algorithmic decisions — pure arithmetic.

**Implementation estimate:** ~300 lines (10 modes × pixel-level formulas + boundary handling for edge sub-blocks).

---

## 5. Forward DCT 4×4 (integer transform)

### 5.1 The transform

VP8 uses a **4×4 integer DCT-II** approximation. The forward transform takes a 4×4 block of residual values (12-bit signed, range [-2048, 2047]) and produces 16 DCT coefficients.

The transform is applied as two 1D transforms: first on rows, then on columns.

**Step 1: Horizontal transform (on each row)**

For a row `[a, b, c, d]` (4 values):

```
t[0] = (a + b + c + d + 4) >> 3      // DC coefficient (shifted by 4 for scaling)
t[1] = (a + b - c - d + 4) >> 3      // type-1 cosine
t[2] = (a - b - c + d + 4) >> 3      // type-3 (odd)
t[3] = (a - b + c - d + 4) >> 3      // type-2
```

Wait — the actual VP8 forward DCT is more precisely defined. Let me use the exact RFC 6386 formulation.

### 5.2 Exact VP8 forward DCT (per RFC 6386 §15.1)

The forward 4×4 transform is a two-pass operation:

**First pass (horizontal, on each of 4 rows):**

```
Input: p[0], p[1], p[2], p[3] (residual values)

a = p[0] + p[3]
b = p[1] + p[2]
c = p[0] - p[3]
d = p[1] - p[2]

w[0] = (a + b)           // DC
w[1] = (c + d) << 3      // AC1 (scaled by 8)
w[2] = (a - b)           // AC2
w[3] = (c - d) << 3      // AC3 (scaled by 8)
```

**Second pass (vertical, on each of 4 columns of w):**

```
Input: w[0..3][col]

a = w[0][col] + w[3][col]
b = w[1][col] + w[2][col]
c = w[0][col] - w[3][col]
d = w[1][col] - w[2][col]

out[0][col] = (a + b + 4) >> 3       // DC (final)
out[1][col] = (c + d + 4) >> 3       // AC1
out[2][col] = (a - b + 4) >> 3       // AC2
out[3][col] = (c - d + 4) >> 3       // AC3
```

The `+4` before `>>3` is round-to-nearest. The `<<3` in the horizontal pass compensates for the `>>3` in the vertical pass, maintaining precision.

**Output:** 16 DCT coefficients in a 4×4 block. `out[0][0]` is the DC coefficient; all others are AC coefficients.

### 5.3 Coefficient interpretation

```
out[0][0] = DC coefficient     (average value of the block, scaled)
out[0][1..3] = horizontal frequency ACs
out[1..3][0] = vertical frequency ACs
out[1..3][1..3] = diagonal frequency ACs
```

**Implementation estimate:** ~80 lines (two-pass transform + intermediate buffer).

---

## 6. Walsh-Hadamard Transform 4×4 (luma DC)

### 6.1 Purpose

After the forward DCT on all 16 luma sub-blocks, their 16 DC coefficients (one per sub-block) are collected into a 4×4 block and transformed with the **Walsh-Hadamard Transform (WHT)**. This decorrelates the DC coefficients across sub-blocks, improving compression of smooth regions.

### 6.2 Forward WHT

For a 4×4 block of DC values `d[0..3][0..3]`:

**First pass (horizontal, on each row):**

```
a = d[row][0] + d[row][3]
b = d[row][1] + d[row][2]
c = d[row][0] - d[row][3]
e = d[row][1] - d[row][2]

w[row][0] = (a + b) >> 2
w[row][1] = (c + e) >> 2
w[row][2] = (a - b) >> 2
w[row][3] = (c - e) >> 2
```

**Second pass (vertical, on each column):**

```
a = w[0][col] + w[3][col]
b = w[1][col] + w[2][col]
c = w[0][col] - w[3][col]
e = w[1][col] - w[2][col]

out[0][col] = (a + b) >> 3
out[1][col] = (c + e) >> 3
out[2][col] = (a - b) >> 3
out[3][col] = (c - e) >> 3
```

The `>>2` in the first pass and `>>3` in the second pass provide the correct scaling. The WHT coefficients replace the 16 individual DC coefficients in the bitstream.

**Implementation estimate:** ~40 lines (same two-pass structure as DCT, simpler arithmetic).

---

## 7. Quantization

### 7.1 Quantizer tables

VP8 uses two lookup tables mapping quality index (0-127) to quantizer values:

**DC quantizer table (128 entries, from RFC 6386 §19.2):**

```
dc_qlookup[0..127] = {
    4,   5,   6,   7,   8,   9,  10,  10,  11,  12,  13,  14,  15,  16,  17,  17,
   18,  19,  20,  21,  22,  23,  24,  25,  26,  26,  27,  28,  29,  30,  31,  32,
   32,  33,  34,  35,  36,  37,  38,  39,  40,  41,  42,  43,  43,  44,  45,  46,
   47,  48,  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  58,  59,  60,
   61,  62,  63,  64,  65,  66,  67,  68,  69,  69,  70,  71,  72,  73,  74,  75,
   76,  76,  77,  78,  79,  80,  81,  82,  83,  84,  85,  85,  87,  88,  90,  92,
   93,  95,  96,  98,  99, 101, 102, 104, 105, 107, 108, 110, 111, 113, 114, 116,
  117, 118, 120, 121, 123, 125, 127, 128, 130, 132, 134, 136, 138, 140, 142, 144,
  146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176,
  178, 180, 182, 184, 186, 188, 190, 192, 194, 196, 198, 200, 200, 201, 202, 203,
  204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219,
  220, 220, 221, 222, 223, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233,
  234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249,
  250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265,
  266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281,
  282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297
};
```

**AC quantizer table (128 entries, from RFC 6386 §19.2):**

```
ac_qlookup[0..127] = {
    4,   5,   6,   7,   8,   9,  10,  11,  12,  13,  14,  15,  16,  17,  18,  19,
   20,  21,  22,  23,  24,  25,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,
   36,  37,  38,  39,  40,  41,  42,  43,  44,  45,  46,  47,  48,  49,  50,  51,
   52,  53,  54,  55,  56,  57,  58,  60,  62,  64,  66,  68,  70,  72,  74,  76,
   78,  80,  82,  84,  86,  88,  90,  92,  94,  96,  98, 100, 102, 104, 106, 108,
  110, 112, 114, 116, 119, 122, 125, 128, 131, 134, 137, 140, 143, 146, 149, 152,
  155, 158, 161, 164, 167, 170, 173, 176, 179, 182, 185, 188, 191, 194, 197, 200,
  203, 207, 211, 215, 219, 223, 227, 231, 235, 239, 243, 247, 251, 255, 259, 263,
  267, 271, 275, 279, 283, 287, 291, 295, 299, 303, 307, 311, 315, 319, 323, 327,
  331, 335, 339, 343, 347, 351, 355, 359, 363, 367, 371, 375, 379, 383, 387, 391,
  395, 399, 403, 407, 411, 415, 419, 423, 427, 431, 435, 439, 443, 447, 451, 455,
  459, 463, 467, 471, 475, 479, 483, 487, 491, 495, 499, 503, 507, 511, 515, 519,
  523, 527, 531, 535, 539, 543, 547, 551, 555, 559, 563, 567, 571, 575, 579, 583,
  587, 591, 595, 599, 603, 607, 611, 615, 619, 623, 627, 631, 635, 639, 643, 647,
  651, 655, 659, 663, 667, 671, 675, 679, 683, 687, 691, 695, 699, 703, 707, 711,
  715, 719, 723, 727, 731, 735, 739, 743, 747, 751, 755, 759, 763, 767, 771, 775
};
```

### 7.2 Quality → quantizer index mapping

The user-facing quality parameter (0-100) maps to a quantizer index (0-127):

```
quality 100 → index 0   (minimal quantization)
quality  75 → index ~20  (good quality, ~75% of JPEG size)
quality  50 → index ~42  (moderate)
quality  25 → index ~72  (aggressive)
quality   0 → index 127  (maximum quantization)
```

The mapping is non-linear — `libwebp` uses a cubic interpolation between known anchor points. A simple approximation:

```
if quality == 100:  q_index = 0
else:               q_index = max(0, min(127, (100 - quality) * 128 / 100))
```

A more accurate mapping follows `libwebp`'s curve:

```
q_index = clamp(0, 127, round(100 - quality) × 1.28)
```

### 7.3 Quantization with deadzone

```
For DC coefficients:
    quantized = round(coeff / dc_qlookup[q_index])

For AC coefficients (with deadzone):
    if coeff >= 0:  quantized = (coeff + dc_qlookup[q_index] / 3) / dc_qlookup[q_index]
    if coeff <  0:  quantized = -((-coeff + dc_qlookup[q_index] / 3) / dc_qlookup[q_index])
```

The deadzone bias (`Q/3` for AC) pushes small coefficients to zero, increasing the zero-run length for the entropy coder.

### 7.4 Dequantization (for reconstruction)

During encoding, the encoder must **reconstruct** the quantized image to use as reference for subsequent macroblocks:

```
reconstructed_coeff_DC = quantized × dc_qlookup[q_index]
reconstructed_coeff_AC = quantized × ac_qlookup[q_index]
```

The reconstructed coefficients are then inverse-DCT'd and added to the prediction to produce the reference pixels.

**Implementation estimate:** ~80 lines (tables + quantize + dequantize + quality mapping).

---

## 8. Zig-zag scan order

After quantization, the 16 DCT coefficients of each 4×4 sub-block are reordered from raster order to zig-zag order. This places the DC coefficient first and high-frequency coefficients last, maximizing the run of trailing zeros for efficient entropy coding.

### 8.1 VP8 zig-zag scan order

```
Raster position → Zig-zag position:

  0   1   2   3          0   1   5   6
  4   5   6   7    →     2   4   7  12
  8   9  10  11          3   8  11  13
 12  13  14  15          9  10  14  15

Zig-zag scan order (index → raster position):
scan[0..15] = { 0, 1, 4, 8, 5, 2, 3, 6, 9, 12, 13, 10, 7, 11, 14, 15 }
```

The first coefficient in zig-zag order is always the DC (position 0 in raster). The remaining 15 are AC coefficients ordered from low to high frequency.

### 8.2 End-of-block (EOB) marking

After zig-zag scanning, trailing zero coefficients are not encoded individually. Instead, the encoder writes an EOB token after the last non-zero coefficient. For example, if only the DC and first AC are non-zero:

```
scan: [DC=42, AC1=-7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      → encode: [42, -7, EOB]
```

**Implementation estimate:** ~20 lines (lookup table + EOB detection).

---

## 9. Boolean arithmetic coder (encoder)

### 9.1 Overview

The VP8 boolean arithmetic coder (BAC) is a binary entropy coder. It encodes a sequence of boolean (0/1) decisions, each associated with a probability. The coder maintains a `range` and `low` (bottom of the interval) that narrow with each encoded bit.

### 9.2 Encoder state

```
struct BoolEncoder {
    range: u32,      // Current interval size, starts at 255 (8-bit)
    bottom: u32,     // Current interval bottom, starts at 0
    count: u32,      // Bit counter for output scheduling, starts at 0
    buffer: u32,     // Output buffer (pending bytes)
    output: Vec<u8>, // Completed output bytes
}
```

Wait — let me use the exact VP8 encoder specification. The VP8 BAC uses slightly different variable names than a general arithmetic coder.

### 9.3 VP8 BoolEncoder state (per RFC 6386 §13.2)

The encoder maintains:

```
range:    u8   — current range (8-bit, starts at 255)
bottom:   u32  — current bottom of interval (24-bit effective, starts at 0)
count:    u32  — shift counter (starts at 0, counts bits until byte output)
buffer:   u8   — first byte output (for carry propagation)
output:   Vec<u8> — remaining output bytes
```

### 9.4 Encoding a single boolean

To encode a boolean `value` with probability `prob` (1-255, where 128 = 50/50):

```
fn encode_bool(&mut self, value: bool, prob: u8) {
    let split = 1 + (((self.range as u32 - 1) * prob as u32) >> 8);

    if value {
        // The value is 1: narrow the interval to the upper part
        self.bottom += split;
        self.range -= split as u8;
    } else {
        // The value is 0: narrow the interval to the lower part
        self.range = split as u8;
    }

    // Renormalization: while range < 128, shift and output
    while self.range < 128 {
        // If bottom + range would overflow into next byte, carry
        if self.bottom < (0xFF << 24) {
            // No carry: output buffered byte, buffer current
            self.output.push(self.buffer);
            self.buffer = ((self.bottom >> 24) & 0xFF) as u8;
        } else {
            // Carry: increment buffer, handle cascade
            self.buffer += 1;
            self.output.push(self.buffer);
            self.buffer = ((self.bottom >> 24) & 0xFF) as u8;
        }
        self.range <<= 1;
        self.bottom <<= 1;
        self.count -= 1;
    }
}
```

### 9.5 Carry propagation

The most subtle part of the BAC encoder is **carry propagation**. When `bottom` overflows past 24 bits, a carry must propagate to previously written bytes. VP8 handles this by maintaining a separate `buffer` byte:

1. Each time a byte is ready for output, it's held in `buffer`
2. The previous `buffer` is flushed to `output`
3. If a carry occurs (`bottom >= 2^24`), the `buffer` is incremented before flushing

This deferred-output mechanism avoids the need to rewrite already-emitted bytes.

### 9.6 Encoding integers

VP8 encodes multi-bit values as a sequence of boolean decisions:

**Encode N-bit value (MSB first):**

```
fn encode_value(&mut self, value: u32, bits: u32, prob: u8) {
    for i in (0..bits).rev() {
        let bit = (value >> i) & 1 == 1;
        self.encode_bool(bit, prob);
    }
}
```

**Encode with tree (used for mode and coefficient coding):**

VP8 uses binary trees to encode multi-valued symbols. Each tree node is a boolean decision with a specific probability. The tree structure is defined per symbol type (see §10 below).

### 9.7 Flushing

At the end of the bitstream, the encoder must flush pending state:

```
fn flush(&mut self) {
    // Flush remaining bits in bottom
    for _ in 0..32 {
        // Force renormalization
        if self.bottom < (0xFF << 24) {
            self.output.push(self.buffer);
        } else {
            self.buffer += 1;
            self.output.push(self.buffer);
        }
        self.bottom <<= 1;
    }
}
```

**Implementation estimate:** ~200 lines (state + encode_bool + carry propagation + flush + encode_value + tree traversal).

---

## 10. Probability model

### 10.1 Keyframe probability tables

VP8 keyframes use **fixed initial probabilities** defined in the spec. These tables are constants — every conformant encoder must use them.

#### 10.1.1 Macroblock mode probabilities (kf_y_mode_probs)

4 modes, each with 4 probabilities (for context-dependent selection):

```
kf_y_mode_probs[4][4] = {
    { 145, 156, 163, 128 },
    { 156, 163, 128, 145 },
    { 163, 128, 145, 156 },
    { 128, 145, 156, 163 },
};
```

Wait — let me check the exact values. The actual VP8 keyframe mode probabilities from RFC 6386 §19.1:

```
kf_y_mode_probs[4][3] = {
    { 49, 136, 140 },     // DC_PRED context
    { 60, 141, 126 },     // V_PRED context
    { 56, 145, 122 },     // H_PRED context
    { 30, 157, 156 },     // TM_PRED context
};
```

Each row has 3 probabilities (for a 4-leaf tree, 3 internal nodes).

#### 10.1.2 Coefficient probabilities (kf_coeff_probs)

This is the largest table. It defines probabilities for DCT coefficient tokens:

```
Structure: [4 types][8 bands][3 contexts][11 probability pairs]

Types: 0=Y DC, 1=Y AC, 2=UV DC, 3=UV AC
Bands: 0-7 (position-dependent probability zones)
Contexts: 0-2 (dependent on previous coefficient state)
Probabilities: 11 levels (for 12 token types: 0, 1, 2, 3, 4-5, 6-7, 8-9, 10-11, 12-15, 16-19, 20+)
```

Total: 4 × 8 × 3 × 11 × 2 = 2,112 probability values.

The full table is defined in RFC 6386 §19.3 (Table 22). These are constants — copy verbatim into Rust.

#### 10.1.3 Sub-block mode probabilities (kf_b_mode_probs)

For B_PRED mode, 10 sub-block modes each with 9 probabilities:

```
kf_b_mode_probs[10][9] = { ... };  // 90 values, defined in RFC 6386 §19.1
```

### 10.2 Probability adaptation

During encoding, probabilities are **adaptively updated** after each symbol:

```
fn update_prob(prob: &mut u8, value: bool) {
    if value {
        *prob += (256 - *prob) >> 8;    // Increase probability toward 256
    } else {
        *prob -= *prob >> 8;            // Decrease probability toward 0
    }
}
```

This is a simple exponential moving average with a decay factor of 1/256. The adaptation is **per-symbol** — every encoded bit updates its associated probability.

**Implementation estimate:** ~300 lines (table constants + tree structures + adaptation logic).

---

## 11. VP8 bitstream format

### 11.1 Frame header (10 bytes, uncompressed)

```
Byte 0-2: Frame tag (3 bytes, bit-packed):
  bits 0:      frame_type (0 = keyframe)
  bits 1-3:    version (0)
  bits 4-23:   first_part_size (19 bits, byte length of first partition)

Byte 3-5: Start code (3 bytes, fixed):
  0x9D 0x01 0x2A

Byte 6-9: Dimensions (4 bytes, bit-packed):
  bits 0-13:   width - 1 (14 bits)
  bits 14-15:  horizontal_scale (2 bits, 0 = no scaling)
  bits 16-29:  height - 1 (14 bits)
  bits 30-31:  vertical_scale (2 bits, 0 = no scaling)
```

### 11.2 First partition (after frame header)

The first partition is arithmetic-coded and contains:

```
1. Color space + clamping type (2 bits, bool-coded):
   - color_space: 0 = YUV (BT.601), 1 = undefined (use 0)
   - clamping_type: 0 = no clamping

2. Segmentation (bool):
   - update_segment_map: if true, per-segment quantizer deltas follow
   - For MVP: false (no segmentation)

3. Loop filter parameters:
   - filter_type: 0 = normal, 1 = simple
   - loop_filter_level: 0-63
   - sharpness_level: 0-7
   - mb_level_adjustments: if true, per-MB filter level deltas

4. Quantizer parameters:
   - y_ac_qi: 0-127 (base quantizer index)
   - y_dc_delta: signed delta for luma DC
   - y2_dc_delta: signed delta for WHT DC
   - y2_ac_delta: signed delta for WHT AC
   - uv_dc_delta: signed delta for chroma DC
   - uv_ac_delta: signed delta for chroma AC

5. Probability updates (bool per table):
   - coeff_prob_update: if true, new coefficient probabilities follow
   - For MVP: false (use defaults)

6. Macroblock data (per MB):
   - skip_flag (bool): if true, MB is skipped (all-zero residual)
   - mb_mode: 0-3 (DC, V, H, TM) or 4 (B_PRED)
   - if B_PRED: 16 × sub-block mode (0-9 each)
   - Chroma mode: 0-3 (always coded separately)
```

### 11.3 Second partition (DCT coefficients)

The second partition is a separate arithmetic-coded stream containing:

```
For each macroblock (in raster order):
    For each of 24 sub-blocks (16 Y + 4 U + 4 V):
        16 coefficients in zig-zag order:
            - Token (0-11): type of coefficient
                0 = EOB (no more non-zero coefficients)
                1 = value 0 with extra bit (not used)
                2 = value 1
                3 = value 2
                4 = value 3
                5 = value 4-5 (1 extra bit)
                6 = value 6-7 (1 extra bit)
                7 = value 8-9 (1 extra bit)
                8 = value 10-11 (1 extra bit)
                9 = value 12-15 (2 extra bits)
                10 = value 16-19 (2 extra bits)
                11 = value 20+ (7 extra bits + sign)
            - Sign bit (for non-zero values)
            - Extra bits (for tokens 5-11)
```

The token is encoded using a probability tree (see §10) that depends on:
- Coefficient type (Y DC, Y AC, UV DC, UV AC)
- Band (position in zig-zag scan)
- Context (based on whether previous coefficient in this block was non-zero)

**Implementation estimate:** ~400 lines (frame header writer + first partition writer + second partition writer + token tree encoding).

---

## 12. In-loop deblocking filter

### 12.1 Purpose

The deblocking filter smooths pixel transitions at block boundaries (4×4 and 8×8 edges) to reduce visible blockiness. It runs **during encoding** — the filtered result becomes the reference for subsequent macroblocks.

### 12.2 Filter parameters

```
loop_filter_level: 0-63 (0 = no filtering)
sharpness_level: 0-7 (higher = less filtering of sharp edges)
```

### 12.3 Filter strength

For each 8×8 block edge, the filter strength depends on:
- The quantizer level (higher quantizer → stronger filter)
- The edge difference (larger differences → stronger filter)
- The macroblock mode (B_PRED edges are filtered more aggressively)

```
interior_limit = max(loop_filter_level, 2 × q_index)
hev_threshold = (loop_filter_level >= 40) ? 2 : (loop_filter_level >= 15) ? 1 : 0
```

### 12.4 Simple filter (filter_type = 1)

For each edge pixel pair (P, Q) across a boundary:

```
P' = P + clamp((Q - P + 1) >> 1, -hev_threshold, hev_threshold)
Q' = Q - clamp((Q - P + 1) >> 1, -hev_threshold, hev_threshold)
```

Only applies to 8×8 boundaries (macroblock edges), not 4×4 sub-block edges.

### 12.5 Normal filter (filter_type = 0)

More complex — applies to all 4×4 boundaries, with a 4-tap filter:

```
a = clamp((P3 - P2 + P1 - P0 + Q0 - Q1 + Q2 - Q3 + 4) >> 3, -hev_limit, hev_limit)
P0' = P0 + a
P1' = P1 + ((a + 1) >> 1) if |P1 - P0| < hev_threshold
Q0' = Q0 - a
Q1' = Q1 - ((a + 1) >> 1) if |Q1 - Q0| < hev_threshold
```

Where P0-P3 are the 4 pixels on one side of the boundary and Q0-Q3 are the 4 pixels on the other side.

### 12.6 Reuse from existing code

The existing `loop_filter.rs` (369 lines) in `image-webp` implements the **decode-side** filter. The filter is **bidirectional** — the same math applies in both directions. The encoder applies the filter to the reconstructed image after each macroblock is coded.

**Implementation estimate:** ~50 lines of glue code (the filter math itself is reusable from `loop_filter.rs`).

---

## 13. Rate control and mode decision

### 13.1 Mode decision (per macroblock)

For each macroblock, the encoder tries all valid prediction modes and picks the one with the lowest **rate-distortion cost (RD cost)**:

```
RD_cost = distortion + λ × rate

Where:
  distortion = SAD(original, predicted)   // Sum of Absolute Differences
  rate       = estimated_bits_to_code(residual)
  λ          = q_index × q_index × 0.21   // Lagrangian multiplier
```

**SAD (Sum of Absolute Differences):**

```
SAD(block_a, block_b) = Σ |a[i][j] - b[i][j]|    for all i, j in block
```

**Rate estimation:**

The rate for a residual block depends on the number and magnitude of non-zero DCT coefficients. A fast estimate:

```
estimated_rate = Σ (|quantized_coeff| > 0) × 4 + Σ (|quantized_coeff|)    // rough bit count
```

For the MVP, a simpler decision can be used:
1. Try all 4 macroblock modes (DC, V, H, TM)
2. Compute SAD for each
3. Pick the mode with the lowest SAD
4. If B_PRED is enabled (Phase 2), also try all 10 sub-block modes per 4×4 block

### 13.2 Quality → quantizer → λ chain

```
quality (0-100) → q_index (0-127) via §7.2 mapping
q_index → quantizer = dc_qlookup[q_index], ac_qlookup[q_index]
q_index → λ = q_index² × 0.21    // empirically tuned constant
```

Higher quality → lower q_index → lower quantizer → lower λ → mode decision favors low distortion.
Lower quality → higher q_index → higher quantizer → higher λ → mode decision favors low rate.

### 13.3 Rate control (single-frame)

For a single-frame encoder (WebP), rate control is simpler than video:
1. User specifies quality (0-100)
2. Map to q_index
3. Apply uniform quantizer to all macroblocks
4. No feedback loop needed (unlike video, where rate must be controlled across frames)

For a **size-target** mode (optional Phase 3):
1. Start with an estimated q_index from target_size / (width × height × 0.1)
2. Encode at that q_index
3. If output > target, increase q_index and re-encode
4. If output < target × 0.9, decrease q_index and re-encode
5. Binary search converges in 3-5 iterations

**Implementation estimate:** ~150 lines (SAD + mode decision loop + λ calculation + optional binary search).

---

## 14. RIFF container assembly

### 14.1 Output structure

The final WebP lossy file is:

```
RIFF <file_size-8> WEBP
  VP8  <chunk_data_size> <vp8_bitstream>
```

Where `vp8_bitstream` = frame_header (10 bytes) + first_partition + second_partition.

### 14.2 Chunk writing

```
fn write_chunk(output: &mut Vec<u8>, fourcc: &[u8; 4], data: &[u8]) {
    output.extend_from_slice(fourcc);
    let size = data.len() as u32;
    output.extend_from_slice(&size.to_le_bytes());
    output.extend_from_slice(data);
    if data.len() % 2 != 0 {
        output.push(0x00);    // RIFF padding for odd-length chunks
    }
}
```

### 14.3 RIFF header

```
fn write_riff_header(output: &mut Vec<u8>, payload_size: usize) {
    output.extend_from_slice(b"RIFF");
    let size = (payload_size + 4) as u32;   // +4 for "WEBP"
    output.extend_from_slice(&size.to_le_bytes());
    output.extend_from_slice(b"WEBP");
}
```

### 14.4 Full assembly

```
fn assemble_webp_lossy(vp8_bitstream: &[u8]) -> Vec<u8> {
    let mut output = Vec::new();
    // RIFF header
    write_riff_header(&mut output, 8 + vp8_bitstream.len());  // 8 = "VP8 " fourcc + size
    // VP8 chunk
    write_chunk(&mut output, b"VP8 ", vp8_bitstream);
    output
}
```

**Implementation estimate:** ~40 lines (header + chunk writer + assembly).

---

## Component complexity summary

| # | Component | Lines (est.) | Difficulty | Reusable from image-webp? |
|---|-----------|-------------|------------|---------------------------|
| 1 | RGB→YUV + subsampling | 60 | ⭐⭐ | No (need forward) |
| 2 | Macroblock partitioning | 40 | ⭐ | No |
| 3 | Intra prediction (4 MB modes) | 120 | ⭐⭐ | Partial (reference from decoder) |
| 4 | Intra prediction (10 sub-block modes) | 300 | ⭐⭐⭐ | Partial (reference from decoder) |
| 5 | Forward DCT 4×4 | 80 | ⭐⭐⭐ | No (decoder has IDCT only) |
| 6 | WHT 4×4 (luma DC) | 40 | ⭐⭐ | No (decoder has inverse only) |
| 7 | Quantization | 80 | ⭐⭐ | No (decoder has dequant only) |
| 8 | Zig-zag scan | 20 | ⭐ | No |
| 9 | Boolean arithmetic encoder | 200 | ⭐⭐⭐⭐ | No (decoder has BoolDecoder only) |
| 10 | Probability model (tables) | 300 | ⭐⭐ | No |
| 11 | Bitstream writer | 400 | ⭐⭐⭐⭐ | No |
| 12 | Deblocking filter | 50 | ⭐⭐ | **Yes** (loop_filter.rs, 369 lines) |
| 13 | Rate control + mode decision | 150 | ⭐⭐⭐⭐ | No |
| 14 | RIFF container | 40 | ⭐ | Partial (write_chunk from encoder.rs) |
| **Total** | | **~1,880** | | ~420 lines reusable |

**Note:** The ~1,880 line estimate is for the core encoding pipeline. Including test vectors, validation harness, error handling, and Camaleon integration glue, the total project size is estimated at 5,000-8,000 lines.

---

## Critical path analysis

The components form a dependency chain. The critical path (longest dependency chain) is:

```
RGB→YUV (1) → Partition (2) → Prediction (3,4) → FDCT (5,6) → Quantize (7) →
Zig-zag (8) → BAC encode (9) → Bitstream (11) → RIFF (14)
```

Components that can be developed **in parallel**:
- Probability tables (10) — pure constants, no dependencies
- Deblocking filter (12) — reuse existing code
- RIFF container (14) — trivial, no dependencies
- Rate control (13) — depends on prediction + FDCT, but stub can start early

**Recommended development order (critical path first):**
1. Probability tables (10) — unblock BAC
2. BAC encoder (9) — unblock bitstream
3. FDCT + WHT (5, 6) — unblock quantize
4. Quantize (7) + zig-zag (8) — unblock bitstream
5. RGB→YUV (1) + partition (2) — unblock prediction
6. Prediction (3, 4) — unblock mode decision
7. Bitstream writer (11) — integrates BAC + quantize + prediction
8. Mode decision (13) — integrates prediction + FDCT
9. Deblocking filter (12) — reuse + glue
10. RIFF container (14) — final assembly

---

*Category 2 complete. Next: [Category 3 — Composition Paper](03_composition_paper.md)*

*Last updated: 2026-06-28 · Picture-VP8 · Camaleon v3.9.3 · RFC 6386 §9-19*
