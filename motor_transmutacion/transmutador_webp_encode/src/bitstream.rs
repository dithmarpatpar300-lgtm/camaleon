//! VP8 bitstream writer.
//!
//! Writes the three components of a VP8 keyframe:
//! 1. Uncompressed frame header (10 bytes)
//! 2. First partition (BAC-encoded): frame parameters + macroblock modes
//! 3. Second partition (BAC-encoded): chroma modes + DCT coefficients
//!
//! ## Coefficient encoding
//!
//! DCT coefficients are encoded using a binary token tree with
//! 11 leaves (10 internal nodes). Each internal node uses a
//! probability from KF_COEFF_PROBS. For Phase 1 (uniform
//! probability), all nodes use prob=128.

use crate::bac::BoolEncoder;
use crate::fdct::{forward_dct_4x4, forward_wht_4x4};
use crate::prediction::YMode;
use crate::probabilities::KF_Y_MODE_PROBS;
use crate::zigzag::{find_eob, zigzag_scan};

// ---------------------------------------------------------------------------
// Frame header (uncompressed, 10 bytes)
// ---------------------------------------------------------------------------

/// Write the uncompressed VP8 frame header.
///
/// Returns 10 bytes that precede the first partition.
pub fn write_frame_header(
    width: u32,
    height: u32,
    first_part_size: u32,
) -> [u8; 10] {
    let mut header = [0u8; 10];

    // Frame tag (bytes 0-2): keyframe, version 0, show_frame=1, first_part_size
    let frame_tag: u32 = 0  // keyframe
        | (0 << 1)           // version 0
        | (1 << 4)           // show_frame
        | (first_part_size << 5); // first partition size (19 bits)
    header[0] = (frame_tag & 0xFF) as u8;
    header[1] = ((frame_tag >> 8) & 0xFF) as u8;
    header[2] = ((frame_tag >> 16) & 0xFF) as u8;

    // Start code (bytes 3-5): 0x9D 0x01 0x2A
    header[3] = 0x9D;
    header[4] = 0x01;
    header[5] = 0x2A;

    // Width (bytes 6-7): 14-bit width, 2-bit horizontal_scale
    let width_field: u16 = (width as u16) | (0 << 14);
    header[6] = (width_field & 0xFF) as u8;
    header[7] = ((width_field >> 8) & 0xFF) as u8;

    // Height (bytes 8-9): 14-bit height, 2-bit vertical_scale
    let height_field: u16 = (height as u16) | (0 << 14);
    header[8] = (height_field & 0xFF) as u8;
    header[9] = ((height_field >> 8) & 0xFF) as u8;

    header
}

// ---------------------------------------------------------------------------
// Quality → quantizer index
// ---------------------------------------------------------------------------

/// Map Camaleon quality parameter (0-100) to VP8 quantizer index (0-127).
///
/// Higher quality → lower q_index → less quantization.
/// Uses a linear approximation of the libwebp curve.
pub fn quality_to_q_index(quality: u8) -> u8 {
    let q = quality.clamp(0, 100);
    if q >= 100 {
        0
    } else if q == 0 {
        127
    } else {
        // Linear mapping: quality 75 → q_index ~20
        let qi = ((100u32 - q as u32) * 128) / 100;
        qi.min(127) as u8
    }
}

// ---------------------------------------------------------------------------
// First partition writer (BAC-encoded)
// ---------------------------------------------------------------------------

/// Write the first partition: frame parameters only (no MB modes).
///
/// RFC 6386 §10.4 — MB modes go in the second partition.
pub fn write_first_partition(
    _mb_cols: usize,
    _mb_rows: usize,
    q_index: u8,
    filter_level: u8,
) -> Vec<u8> {
    let mut enc = BoolEncoder::new();

    // Color space and clamping type
    enc.encode_bool(false, 128); // color_space = 0 (YUV)
    enc.encode_bool(false, 128); // clamping_type = 0

    // Segmentation: disabled
    enc.encode_bool(false, 128); // segmentation_enabled = false

    // Loop filter
    enc.encode_bool(false, 128); // filter_type = 0 (normal)
    enc.encode_value(filter_level as u32, 6); // loop_filter_level
    enc.encode_value(0, 3); // sharpness_level = 0
    enc.encode_bool(false, 128); // mb_lf_adjustments = false

    // Quantizer parameters
    enc.encode_value(q_index as u32, 7); // y_ac_qi
    enc.encode_bool(false, 128); // y_dc_delta_present
    enc.encode_bool(false, 128); // y2_dc_delta_present
    enc.encode_bool(false, 128); // y2_ac_delta_present
    enc.encode_bool(false, 128); // uv_dc_delta_present
    enc.encode_bool(false, 128); // uv_ac_delta_present

    // Refresh golden frame
    enc.encode_bool(false, 128);

    // Refresh alt reference frame
    enc.encode_bool(false, 128);

    // Probability updates: use defaults (no update)
    enc.encode_bool(false, 128); // coeff_prob_update_flag
    enc.encode_bool(false, 128); // mb_probs_update_flag

    // Skip mode: disabled
    enc.encode_bool(false, 128);

    // Note: MB modes (y_mode) are in the second partition per RFC 6386 §10.5

    enc.finish()
}

// ---------------------------------------------------------------------------
// Second partition writer (BAC-encoded)
// ---------------------------------------------------------------------------

/// Write the second partition: y_mode + uv_mode + DCT coefficients.
///
/// RFC 6386 §10.5: macroblock modes and residual data are in the second partition.
pub fn write_second_partition(
    y_ac_blocks: &[[i16; 16]],
    wht_coeffs: &[[i16; 16]],
    uv_blocks_u: &[[i16; 16]],
    uv_blocks_v: &[[i16; 16]],
    mb_modes: &[YMode],
    mb_cols: usize,
    mb_rows: usize,
) -> Vec<u8> {
    let mut enc = BoolEncoder::new();

    for mb_row in 0..mb_rows {
        for mb_col in 0..mb_cols {
            let mb_idx = mb_row * mb_cols + mb_col;
            let mode = mb_modes[mb_idx];

            // y_mode — luma prediction mode
            let above_mode = if mb_row > 0 {
                mb_modes[(mb_row - 1) * mb_cols + mb_col]
            } else {
                YMode::DcPred
            };
            let left_mode = if mb_col > 0 {
                mb_modes[mb_row * mb_cols + (mb_col - 1)]
            } else {
                YMode::DcPred
            };
            let prob_row = if above_mode == left_mode { 0 } else { 1 };
            let prob = KF_Y_MODE_PROBS[prob_row];

            match mode {
                YMode::DcPred => {
                    enc.encode_bool(false, prob[2]); // not TM
                    enc.encode_bool(true, prob[0]);  // is DC
                }
                YMode::VPred => {
                    enc.encode_bool(false, prob[2]);
                    enc.encode_bool(false, prob[0]);
                    enc.encode_bool(true, prob[1]);
                }
                YMode::HPred => {
                    enc.encode_bool(false, prob[2]);
                    enc.encode_bool(false, prob[0]);
                    enc.encode_bool(false, prob[1]);
                }
                YMode::TmPred => {
                    enc.encode_bool(true, prob[2]);
                }
            }

            // uv_mode — chroma prediction mode (same tree, same probs)
            // Phase 1: all UV modes are DC_PRED
            enc.encode_bool(false, prob[2]); // not TM
            enc.encode_bool(true, prob[0]);  // is DC

            // WHT coefficients (one 4×4 block = 16 coeffs)
            encode_coeff_block(&mut enc, &wht_coeffs[mb_idx], 0); // type=0 (Y2_DC)

            // 16 Y AC blocks
            for blk in 0..16 {
                let blk_idx = mb_idx * 16 + blk;
                encode_coeff_block(&mut enc, &y_ac_blocks[blk_idx], 1);
            }

            // 4 U blocks
            for blk in 0..4 {
                let blk_idx = mb_idx * 4 + blk;
                encode_coeff_block(&mut enc, &uv_blocks_u[blk_idx], 2);
            }

            // 4 V blocks
            for blk in 0..4 {
                let blk_idx = mb_idx * 4 + blk;
                encode_coeff_block(&mut enc, &uv_blocks_v[blk_idx], 3);
            }
        }
    }

    enc.finish()
}

// ---------------------------------------------------------------------------
// Coefficient token encoding
// ---------------------------------------------------------------------------

/// Encode a 4×4 block of DCT coefficients (16 values in raster order)
/// using the VP8 token tree.
///
/// `coeffs`: 16 coefficients in 4×4 raster order.
/// `coeff_type`: 0=Y2_DC, 1=Y_AC, 2=UV_DC, 3=UV_AC (determines probability context).
fn encode_coeff_block(enc: &mut BoolEncoder, coeffs: &[i16; 16], _coeff_type: usize) {
    // Zig-zag scan
    let scan = zigzag_scan(*coeffs);
    let eob = find_eob(&scan);

    // Encode each coefficient up to EOB
    for pos in 0..=eob {
        let coeff = scan[pos];
        let abs = coeff.abs() as u32;
        let is_last = pos == eob;

        if is_last && abs == 0 {
            // EOB with only zeros — encode EOB token
            encode_eob(enc);
            break;
        }

        // Determine token based on absolute value
        // Token encoding tree (uniform prob=128 for Phase 1):
        // root: node0 → node1
        // node1: node3 or node4
        // node2: node5 or node6
        // node3: ZERO(1) or ONE(2)
        // node4: TWO(3) or THREE(4)
        // node5: node7 or node8
        // node6: node9 or EOB(0)
        // node7: FOUR(5) or CAT1(6)
        // node8: CAT2(7) or CAT3(8)
        // node9: CAT4(9) or CAT5(10)
        encode_token(enc, abs);

        // Sign
        if abs > 0 {
            enc.encode_bool(coeff < 0, 128);
        }

        // Extra bits for category tokens
        match abs {
            0 | 1 | 2 | 3 => {} // no extra bits
            4..=5 => {
                let extra = abs - 4;
                enc.encode_bool(extra != 0, 128); // 1 bit
            }
            6..=8 => {
                let extra = abs - 6;
                enc.encode_value(extra, 2); // 2 bits
            }
            9..=11 => {
                let extra = abs - 9;
                enc.encode_value(extra, 2);
            }
            12..=15 => {
                let extra = abs - 12;
                enc.encode_value(extra, 2);
            }
            16..=19 => {
                let extra = abs - 16;
                enc.encode_value(extra, 2);
            }
            _ => {
                // CAT5: abs >= 20, 3 extra bits for base, rest as binary
                if abs <= 27 {
                    let extra = abs - 20;
                    enc.encode_value(extra, 3);
                } else {
                    // Large values: encode 7 bits of magnitude
                    let extra = abs & 0x7F;
                    enc.encode_value(extra, 7);
                }
            }
        }
    }
}

/// Encode the EOB (end of block) token.
fn encode_eob(enc: &mut BoolEncoder) {
    // Tree path to EOB (token 0):
    // node0 → node2 (right, false)
    // node2 → node6 (right, false)
    // node6 → EOB (right, false)
    enc.encode_bool(false, 128); // go to node2
    enc.encode_bool(false, 128); // go to node6
    enc.encode_bool(false, 128); // EOB
}

/// Encode a coefficient token based on absolute value.
fn encode_token(enc: &mut BoolEncoder, abs: u32) {
    // We use a simplified binary tree with uniform probabilities.
    // The tree structure matches the VP8 spec token tree.

    if abs <= 3 {
        // Left branch: small values (tokens 1-4)
        enc.encode_bool(true, 128);  // go to node1 (left)
        if abs <= 1 {
            // node3: ZERO or ONE
            enc.encode_bool(true, 128);  // go to node3 (left)
            if abs == 0 {
                enc.encode_bool(true, 128);  // ZERO (left of node3)
            } else {
                enc.encode_bool(false, 128); // ONE (right of node3)
            }
        } else {
            // node4: TWO or THREE
            enc.encode_bool(false, 128); // go to node4 (right)
            if abs == 2 {
                enc.encode_bool(true, 128);  // TWO (left of node4)
            } else {
                enc.encode_bool(false, 128); // THREE (right of node4)
            }
        }
    } else {
        // Right branch: larger values (tokens 5-10)
        enc.encode_bool(false, 128); // go to node2 (right)

        if abs <= 5 {
            // node5 → node7: FOUR(5) or CAT1(6)
            enc.encode_bool(true, 128);  // go to node5 (left)
            enc.encode_bool(true, 128);  // go to node7 (left)
            if abs <= 5 {
                enc.encode_bool(true, 128);  // FOUR (left of node7)
            } else {
                enc.encode_bool(false, 128); // CAT1 (right of node7)
            }
        } else if abs <= 11 {
            // node5 → node8: CAT2(7) or CAT3(8)
            enc.encode_bool(true, 128);  // go to node5 (left)
            enc.encode_bool(false, 128); // go to node8 (right)
            if abs <= 8 || abs <= 11 && abs > 8 {
                // Need to distinguish CAT2 vs CAT3
                if abs <= 8 {
                    enc.encode_bool(true, 128);  // CAT2
                } else {
                    enc.encode_bool(false, 128); // CAT3
                }
            } else {
                unreachable!()
            }
        } else {
            // node6 → node9: CAT4(9) or CAT5(10)
            enc.encode_bool(false, 128); // go to node6 (right)
            enc.encode_bool(true, 128);  // go to node9 (left)
            if abs <= 19 {
                enc.encode_bool(true, 128);  // CAT4 (left of node9)
            } else {
                enc.encode_bool(false, 128); // CAT5 (right of node9)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Full MB encoding helpers
// ---------------------------------------------------------------------------

/// Process a macroblock: FDCT on all sub-blocks, WHT on luma DC.
///
/// Returns:
/// - `wht`: 16 WHT coefficients (from the 16 luma DC values)
/// - `y_ac`: 16 arrays of 15 AC coefficients (no DC) for the 16 Y sub-blocks
/// - `u_blocks`: 4 arrays of 16 coefficients for U sub-blocks
/// - `v_blocks`: 4 arrays of 16 coefficients for V sub-blocks
pub fn process_macroblock(
    y_residual: &[i16; 256],
    u_residual: &[i16; 64],
    v_residual: &[i16; 64],
) -> ([i16; 16], [[i16; 16]; 16], [[i16; 16]; 4], [[i16; 16]; 4]) {
    // FDCT on 16 Y sub-blocks (each 4×4 = 16 values)
    let mut y_dct: [[i16; 16]; 16] = [[0; 16]; 16];
    for i in 0..16 {
        let mut block = [0i16; 16];
        let sub_row = i / 4;
        let sub_col = i % 4;
        for r in 0..4 {
            for c in 0..4 {
                block[r * 4 + c] = y_residual[(sub_row * 4 + r) * 16 + sub_col * 4 + c];
            }
        }
        y_dct[i] = forward_dct_4x4(block);
    }

    // Extract 16 DC values from Y sub-blocks
    let mut dc_values = [0i16; 16];
    for i in 0..16 {
        dc_values[i] = y_dct[i][0];
    }

    // WHT on DC values
    let wht = forward_wht_4x4(dc_values);

    // Y AC blocks (no DC — replace DC with 0)
    let mut y_ac: [[i16; 16]; 16] = [[0; 16]; 16];
    for i in 0..16 {
        y_ac[i] = y_dct[i];
        y_ac[i][0] = 0; // DC is in WHT
    }

    // FDCT on 4 U sub-blocks (each 2×2 of 4×4 = 8×8 total)
    let mut u_blocks: [[i16; 16]; 4] = [[0; 16]; 4];
    for i in 0..4 {
        let mut block = [0i16; 16];
        let sub_row = i / 2;
        let sub_col = i % 2;
        for r in 0..4 {
            for c in 0..4 {
                block[r * 4 + c] = u_residual[(sub_row * 4 + r) * 8 + sub_col * 4 + c];
            }
        }
        u_blocks[i] = forward_dct_4x4(block);
    }

    // FDCT on 4 V sub-blocks
    let mut v_blocks: [[i16; 16]; 4] = [[0; 16]; 4];
    for i in 0..4 {
        let mut block = [0i16; 16];
        let sub_row = i / 2;
        let sub_col = i % 2;
        for r in 0..4 {
            for c in 0..4 {
                block[r * 4 + c] = v_residual[(sub_row * 4 + r) * 8 + sub_col * 4 + c];
            }
        }
        v_blocks[i] = forward_dct_4x4(block);
    }

    (wht, y_ac, u_blocks, v_blocks)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frame_header_correct_start_code() {
        let header = write_frame_header(3000, 4000, 0);
        assert_eq!(header[3], 0x9D);
        assert_eq!(header[4], 0x01);
        assert_eq!(header[5], 0x2A);
    }

    #[test]
    fn frame_header_width_height() {
        let header = write_frame_header(3000, 4000, 0);
        let w_lo = header[6] as u16;
        let w_hi = header[7] as u16;
        let width = w_lo | ((w_hi & 0x3F) << 8);
        assert_eq!(width, 3000);

        let h_lo = header[8] as u16;
        let h_hi = header[9] as u16;
        let height = h_lo | ((h_hi & 0x3F) << 8);
        assert_eq!(height, 4000);
    }

    #[test]
    fn quality_to_q_index_mapping() {
        assert_eq!(quality_to_q_index(100), 0);
        assert_eq!(quality_to_q_index(0), 127);
        let q75 = quality_to_q_index(75);
        assert!(q75 >= 10 && q75 <= 40, "Q75 q_index should be ~32, got {}", q75);
    }

    #[test]
    fn first_partition_produces_output() {
        let bytes = write_first_partition(2, 2, 32, 20);
        assert!(!bytes.is_empty(), "first partition should produce output");
        assert!(bytes.len() >= 2, "first partition should have >=2 bytes");
    }

    #[test]
    fn process_mb_constant_residual() {
        // Constant residual of 0 → all DCT coefficients should be ~0
        let y = [0i16; 256];
        let u = [0i16; 64];
        let v = [0i16; 64];
        let (wht, _y_ac, _u_blk, _v_blk) = process_macroblock(&y, &u, &v);
        // WHT of zero DC values should be ~0
        assert_eq!(wht[0], 0, "WHT DC should be 0 for zero residual");
    }
}
