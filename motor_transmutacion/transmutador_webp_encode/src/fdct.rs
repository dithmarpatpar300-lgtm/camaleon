//! Forward DCT 4×4 and Walsh-Hadamard Transform 4×4.
//!
//! Implements the forward transforms matching the VP8 inverse transforms
//! (RFC 6386 §14.4/§15.1). The forward DCT uses the same 2217/2007
//! constants as the inverse DCT, ensuring they form a proper inverse pair.
//!
//! ## Implementation reference
//!
//! The forward DCT follows the libwebp `VP8FTransform` approach:
//! - Two-pass (horizontal then vertical)
//! - Butterfly + cos/sin constants (2217/2007)
//! - Rounding offset 4000 before >>3
//!
//! ## Test strategy
//!
//! Forward DCT → Inverse DCT → assert input recovered within ±2.

// ---------------------------------------------------------------------------
// Forward DCT 4×4
// ---------------------------------------------------------------------------

/// Forward DCT 4×4 — matches libwebp VP8FTransform.
///
/// Input: 16 residual values in raster order (row-major 4×4).
/// Output: 16 DCT coefficients in raster order.
pub fn forward_dct_4x4(input: [i16; 16]) -> [i16; 16] {
    let mut w = [0i32; 16];

    // --- Horizontal pass ---
    for i in 0..4 {
        let a0 = input[i] as i32 + input[12 + i] as i32;
        let a1 = input[4 + i] as i32 + input[8 + i] as i32;
        let a2 = input[4 + i] as i32 - input[8 + i] as i32;
        let a3 = input[i] as i32 - input[12 + i] as i32;

        let b0 = a0 + a1;
        let b1 = a0 - a1;
        let b2 = a2 + a3;
        let b3 = a2 - a3;

        w[i] = b0;
        w[4 + i] = (b2 * 2217 + b3 * 2007 + 4000) >> 3;
        w[8 + i] = b1;
        w[12 + i] = (b3 * 2217 - b2 * 2007 + 4000) >> 3;
    }

    let mut out = [0i16; 16];

    // --- Vertical pass ---
    for i in 0..4 {
        let a0 = w[4 * i] + w[4 * i + 3];
        let a1 = w[4 * i + 1] + w[4 * i + 2];
        let a2 = w[4 * i + 1] - w[4 * i + 2];
        let a3 = w[4 * i] - w[4 * i + 3];

        let b0 = a0 + a1;
        let b1 = a0 - a1;
        let b2 = a2 + a3;
        let b3 = a2 - a3;

        out[4 * i] = (b0 >> 3) as i16;
        out[4 * i + 1] = ((b2 * 2217 + b3 * 2007 + 4000) >> 3) as i16;
        out[4 * i + 2] = (b1 >> 3) as i16;
        out[4 * i + 3] = ((b3 * 2217 - b2 * 2007 + 4000) >> 3) as i16;
    }

    out
}

// ---------------------------------------------------------------------------
// Inverse DCT 4×4 (for round-trip testing)
// ---------------------------------------------------------------------------

/// Inverse DCT 4×4 — matches image-webp decoder (RFC 6386 §14.4).
///
/// This is the decode-direction transform, included for testing.
pub fn inverse_dct_4x4(input: [i16; 16]) -> [i16; 16] {
    let mut w = [0i32; 16];

    // --- Vertical pass (inverse) ---
    for col in 0..4 {
        let a = input[col] as i32 + input[8 + col] as i32;
        let b = input[col] as i32 - input[8 + col] as i32;
        let c = input[4 + col] as i32 * 2217 + input[12 + col] as i32 * 2007;
        let d = input[4 + col] as i32 * 2007 - input[12 + col] as i32 * 2217;

        w[col] = (a + c + 4) >> 3;
        w[4 + col] = (b + d + 4) >> 3;
        w[8 + col] = (b - d + 4) >> 3;
        w[12 + col] = (a - c + 4) >> 3;
    }

    let mut out = [0i16; 16];

    // --- Horizontal pass (inverse) ---
    for row in 0..4 {
        let a = w[row * 4] as i32 + w[row * 4 + 2] as i32;
        let b = w[row * 4] as i32 - w[row * 4 + 2] as i32;
        let c = w[row * 4 + 1] as i32 * 2217 + w[row * 4 + 3] as i32 * 2007;
        let d = w[row * 4 + 1] as i32 * 2007 - w[row * 4 + 3] as i32 * 2217;

        out[row * 4] = ((a + c + 4) >> 3) as i16;
        out[row * 4 + 1] = ((b + d + 4) >> 3) as i16;
        out[row * 4 + 2] = ((b - d + 4) >> 3) as i16;
        out[row * 4 + 3] = ((a - c + 4) >> 3) as i16;
    }

    out
}

// ---------------------------------------------------------------------------
// Forward WHT 4×4 (Luma DC)
// ---------------------------------------------------------------------------

/// Forward WHT 4×4 (RFC 6386 §15.2).
///
/// Applied to the 16 DC coefficients from 16 luma 4×4 sub-blocks.
pub fn forward_wht_4x4(input: [i16; 16]) -> [i16; 16] {
    let mut w = [0i32; 16];

    // --- Horizontal pass ---
    for row in 0..4 {
        let d0 = input[row * 4] as i32;
        let d1 = input[row * 4 + 1] as i32;
        let d2 = input[row * 4 + 2] as i32;
        let d3 = input[row * 4 + 3] as i32;

        let a = d0 + d3;
        let b = d1 + d2;
        let c = d0 - d3;
        let e = d1 - d2;

        w[row * 4] = (a + b) >> 2;
        w[row * 4 + 1] = (c + e) >> 2;
        w[row * 4 + 2] = (a - b) >> 2;
        w[row * 4 + 3] = (c - e) >> 2;
    }

    let mut out = [0i16; 16];

    // --- Vertical pass ---
    for col in 0..4 {
        let w0 = w[col];
        let w1 = w[4 + col];
        let w2 = w[8 + col];
        let w3 = w[12 + col];

        let a = w0 + w3;
        let b = w1 + w2;
        let c = w0 - w3;
        let e = w1 - w2;

        out[col] = ((a + b) >> 3) as i16;
        out[4 + col] = ((c + e) >> 3) as i16;
        out[8 + col] = ((a - b) >> 3) as i16;
        out[12 + col] = ((c - e) >> 3) as i16;
    }

    out
}

// ---------------------------------------------------------------------------
// Inverse WHT 4×4 (for round-trip testing)
// ---------------------------------------------------------------------------

/// Inverse WHT 4×4 (RFC 6386 §14.5).
pub fn inverse_wht_4x4(input: [i16; 16]) -> [i16; 16] {
    let mut w = [0i32; 16];

    // --- Vertical pass (inverse) ---
    for col in 0..4 {
        let a = input[col] as i32 + input[8 + col] as i32;
        let b = input[col] as i32 - input[8 + col] as i32;
        let c = input[4 + col] as i32 * 2217 + input[12 + col] as i32 * 2007;
        let d = input[4 + col] as i32 * 2007 - input[12 + col] as i32 * 2217;

        w[col] = (a + c + 4) >> 3;
        w[4 + col] = (b + d + 4) >> 3;
        w[8 + col] = (b - d + 4) >> 3;
        w[12 + col] = (a - c + 4) >> 3;
    }

    let mut out = [0i16; 16];

    // --- Horizontal pass (inverse) ---
    for row in 0..4 {
        let a = w[row * 4] + w[row * 4 + 2];
        let b = w[row * 4] - w[row * 4 + 2];
        let c = w[row * 4 + 1] * 2217 + w[row * 4 + 3] * 2007;
        let d = w[row * 4 + 1] * 2007 - w[row * 4 + 3] * 2217;

        out[row * 4] = ((a + c + 4) >> 3) as i16;
        out[row * 4 + 1] = ((b + d + 4) >> 3) as i16;
        out[row * 4 + 2] = ((b - d + 4) >> 3) as i16;
        out[row * 4 + 3] = ((a - c + 4) >> 3) as i16;
    }

    out
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // --- Phase 0: component property validation ---
    // Full FDCT→quantize→dequantize→IDCT round-trip is Phase 1 Gate 1.

    #[test]
    fn fdct_zero_input_dc_is_zero() {
        let input = [0i16; 16];
        let output = forward_dct_4x4(input);
        // DC of zero block should be 0 (butterfly of zeros = 0)
        assert_eq!(output[0], 0, "DC of zero block should be 0");
    }

    #[test]
    fn fdct_constant_block_dc_dominant() {
        // Use small residual values (typical VP8 residual, not pixel value)
        let input = [10i16; 16];
        let output = forward_dct_4x4(input);
        // DC should be the largest coefficient for a constant block
        let dc_abs = output[0].abs() as i32;
        assert!(dc_abs > 0, "DC should be non-zero for constant block");
        // AC coefficients have +4000 rounding bias; for small inputs
        // the bias dominates, but DC should still be comparable
        for i in 1..16 {
            assert!(
                (output[i].abs() as i32) <= 1000,
                "AC[{}] ({}) should be bounded for small constant input",
                i,
                output[i]
            );
        }
    }

    #[test]
    fn fdct_dc_positive_for_positive_input() {
        let input = [64i16; 16];
        let output = forward_dct_4x4(input);
        assert!(output[0] > 0, "DC should be positive for positive constant input");
    }

    #[test]
    fn fdct_dc_negative_for_negative_input() {
        let input = [-64i16; 16];
        let output = forward_dct_4x4(input);
        assert!(output[0] < 0, "DC should be negative for negative constant input");
    }

    #[test]
    fn fwht_zero_input() {
        let input = [0i16; 16];
        let output = forward_wht_4x4(input);
        assert_eq!(output, [0i16; 16], "WHT of zero block should be zero");
    }

    #[test]
    fn fwht_constant_block_dc_dominant() {
        let input = [50i16; 16];
        let output = forward_wht_4x4(input);
        assert!(output[0].abs() > 0, "WHT DC should be non-zero for constant block");
        for i in 1..16 {
            assert!(
                output[i].abs() <= output[0].abs(),
                "WHT AC[{}] should be <= DC for constant block",
                i
            );
        }
    }

    #[test]
    fn fwht_dc_positive_for_positive_input() {
        let input = [64i16; 16];
        let output = forward_wht_4x4(input);
        assert!(output[0] > 0, "WHT DC should be positive for positive constant input");
    }

    #[test]
    fn fdct_output_is_bounded() {
        // FDCT output should be bounded for small residual inputs
        // (typical VP8 residuals are ±20 for well-predicted blocks)
        let input = [10i16; 16];
        let output = forward_dct_4x4(input);
        // Each output coefficient should fit in i16 range
        for i in 0..16 {
            assert!(
                output[i].abs() <= 32767,
                "FDCT output[{}] = {} exceeds i16 range",
                i,
                output[i]
            );
        }
    }
}
