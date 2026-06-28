//! VP8 bitstream writer — Phase 3 spec-compliant.
//!
//! Writes the three components of a VP8 keyframe:
//! 1. Uncompressed frame header (10 bytes)
//! 2. First partition: frame params + MB modes (y_mode + uv_mode per MB)
//! 3. Second partition: DCT coefficients
//!
//! The encoding order EXACTLY matches the image-webp decoder
//! (`vp8.rs` `read_frame_header` + `read_macroblock_header`).

use crate::bac::BoolEncoder;
use crate::fdct::{forward_dct_4x4, forward_wht_4x4};
use crate::prediction::{SubMode, YMode};
use crate::probabilities::{get_coeff_prob, get_coeff_update_prob, KEYFRAME_YMODE_PROBS, KEYFRAME_UV_MODE_PROBS};
use crate::zigzag::{find_eob, zigzag_scan};

// ---------------------------------------------------------------------------
// Frame header (uncompressed, 10 bytes)
// ---------------------------------------------------------------------------

pub fn write_frame_header(width: u32, height: u32, first_part_size: u32) -> [u8; 10] {
    let mut header = [0u8; 10];

    let frame_tag: u32 = 0 | (0 << 1) | (1 << 4) | (first_part_size << 5);
    header[0] = (frame_tag & 0xFF) as u8;
    header[1] = ((frame_tag >> 8) & 0xFF) as u8;
    header[2] = ((frame_tag >> 16) & 0xFF) as u8;

    header[3] = 0x9D;
    header[4] = 0x01;
    header[5] = 0x2A;

    let width_field: u16 = (width as u16) | (0 << 14);
    header[6] = (width_field & 0xFF) as u8;
    header[7] = ((width_field >> 8) & 0xFF) as u8;

    let height_field: u16 = (height as u16) | (0 << 14);
    header[8] = (height_field & 0xFF) as u8;
    header[9] = ((height_field >> 8) & 0xFF) as u8;

    header
}

// ---------------------------------------------------------------------------
// Quality → quantizer index
// ---------------------------------------------------------------------------

pub fn quality_to_q_index(quality: u8) -> u8 {
    let q = quality.clamp(0, 100);
    if q >= 100 { 0 }
    else if q == 0 { 127 }
    else {
        let qi = ((100u32 - q as u32) * 128) / 100;
        qi.min(127) as u8
    }
}

// ---------------------------------------------------------------------------
// First partition — frame params + MB modes
// ---------------------------------------------------------------------------

/// Write the first partition: frame parameters + macroblock modes.
///
/// Encoding order matches image-webp decoder `read_frame_header`:
/// 1. color_space (1 bit)
/// 2. clamping_type (1 bit)
/// 3. segmentation_enabled (1 bit)
/// 4. filter_type (1 bit)
/// 5. loop_filter_level (6 bits)
/// 6. sharpness_level (3 bits)
/// 7. loop_filter_adjustments (1 bit)
/// 8. num_partitions (2 bits) — 0 = 1 partition
/// 9. quantizer: y_ac_qi (7 bits) + 5 optional signed deltas
/// 10. refresh_entropy_probs (1 bit)
/// 11. update_token_probabilities (coeff_update_probs × 1056 booleans)
/// 12. mb_no_skip_coeff (1 bit) — if 0, no skip flag per MB
/// 13. prob_skip_false (8 bits, only if mb_no_skip_coeff=1)
/// 14. Per-MB: y_mode (tree) + uv_mode (tree)
pub fn write_first_partition(
    mb_modes: &[YMode],
    mb_cols: usize,
    mb_rows: usize,
    q_index: u8,
    filter_level: u8,
) -> Vec<u8> {
    let mut enc = BoolEncoder::new();

    // 1. color_space = 0 (YUV)
    enc.encode_bool(false, 128);
    // 2. clamping_type = 0
    enc.encode_bool(false, 128);
    // 3. segmentation_enabled = false
    enc.encode_bool(false, 128);
    // 4. filter_type = 0 (normal)
    enc.encode_bool(false, 128);
    // 5. loop_filter_level (6 bits)
    enc.encode_value(filter_level as u32, 6);
    // 6. sharpness_level (3 bits)
    enc.encode_value(0, 3);
    // 7. loop_filter_adjustments_enabled = false
    enc.encode_bool(false, 128);
    // 8. num_partitions = 0 (means 1 partition, log2(1)=0)
    enc.encode_value(0, 2);
    // 9. Quantizer
    enc.encode_value(q_index as u32, 7); // y_ac_qi
    // 5 optional signed deltas (flag=false → delta=0)
    enc.encode_bool(false, 128); // y_dc_delta
    enc.encode_bool(false, 128); // y2_dc_delta
    enc.encode_bool(false, 128); // y2_ac_delta
    enc.encode_bool(false, 128); // uv_dc_delta
    enc.encode_bool(false, 128); // uv_ac_delta
    // 10. refresh_entropy_probs = false (don't refresh for next frame)
    enc.encode_bool(false, 128);
    // 11. update_token_probabilities: read_bool per coeff_update_prob
    // Must use the SAME probabilities as the decoder (COEFF_UPDATE_PROBS).
    // The decoder reads 10 nodes per context (NUM_DCT_TOKENS-1=10).
    for ctype in 0..4 {
        for band in 0..8 {
            for ctx in 0..3 {
                for node in 0..10 {
                    let prob = get_coeff_update_prob(ctype, band, ctx, node);
                    enc.encode_bool(false, prob); // no update
                }
            }
        }
    }
    // 12. mb_no_skip_coeff = 0 (disable skip mode)
    enc.encode_bool(false, 128);
    // No prob_skip_false since skip is disabled

    // 13-14. Per-MB: y_mode + uv_mode
    for mb_row in 0..mb_rows {
        for mb_col in 0..mb_cols {
            let mb_idx = mb_row * mb_cols + mb_col;
            let mode = mb_modes[mb_idx];

            // y_mode: image-webp KEYFRAME_YMODE_TREE
            // Tree: [-B_PRED, 2, 4, 6, -DC_PRED, -V_PRED, -H_PRED, -TM_PRED]
            // Node 0 (prob 145): LEFT=B_PRED, RIGHT=Node2
            // Node 2 (prob 156): LEFT=Node4, RIGHT=Node6
            // Node 4 (prob 163): LEFT=DC_PRED, RIGHT=V_PRED
            // Node 6 (prob 128): LEFT=H_PRED, RIGHT=TM_PRED
            let yp = KEYFRAME_YMODE_PROBS;
            match mode {
                YMode::BPred => {
                    enc.encode_bool(true, yp[0]);  // LEFT → B_PRED
                }
                YMode::DcPred => {
                    enc.encode_bool(false, yp[0]); // → Node2
                    enc.encode_bool(true, yp[1]);  // LEFT → Node4
                    enc.encode_bool(true, yp[2]);  // LEFT → DC_PRED
                }
                YMode::VPred => {
                    enc.encode_bool(false, yp[0]);
                    enc.encode_bool(true, yp[1]);
                    enc.encode_bool(false, yp[2]); // RIGHT → V_PRED
                }
                YMode::HPred => {
                    enc.encode_bool(false, yp[0]);
                    enc.encode_bool(false, yp[1]); // RIGHT → Node6
                    enc.encode_bool(true, yp[3]);  // LEFT → H_PRED
                }
                YMode::TmPred => {
                    enc.encode_bool(false, yp[0]);
                    enc.encode_bool(false, yp[1]);
                    enc.encode_bool(false, yp[3]); // RIGHT → TM_PRED
                }
            }

            // uv_mode: image-webp KEYFRAME_UV_MODE_TREE
            // Tree: [-DC_PRED, 2, -V_PRED, 4, -H_PRED, -TM_PRED]
            // Node 0 (prob 142): LEFT=DC_PRED, RIGHT=Node2
            // Node 2 (prob 114): LEFT=V_PRED, RIGHT=Node4
            // Node 4 (prob 183): LEFT=H_PRED, RIGHT=TM_PRED
            // Phase 2: always DC_PRED for chroma
            let up = KEYFRAME_UV_MODE_PROBS;
            enc.encode_bool(true, up[0]);  // LEFT → DC_PRED
        }
    }

    enc.finish()
}

// ---------------------------------------------------------------------------
// Second partition — DCT coefficients
// ---------------------------------------------------------------------------

/// Write the second partition: DCT coefficients for all macroblocks.
pub fn write_second_partition(
    y_ac_blocks: &[[i16; 16]],
    wht_coeffs: &[[i16; 16]],
    uv_blocks_u: &[[i16; 16]],
    uv_blocks_v: &[[i16; 16]],
    mb_cols: usize,
    mb_rows: usize,
) -> Vec<u8> {
    let mut enc = BoolEncoder::new();

    for mb_idx in 0..(mb_cols * mb_rows) {
        // WHT coefficients (Y2 DC block)
        encode_coeff_block(&mut enc, &wht_coeffs[mb_idx], 0, 0);

        // 16 Y AC blocks
        for blk in 0..16 {
            let blk_idx = mb_idx * 16 + blk;
            encode_coeff_block(&mut enc, &y_ac_blocks[blk_idx], 1, 0);
        }

        // 4 U blocks
        for blk in 0..4 {
            let blk_idx = mb_idx * 4 + blk;
            encode_coeff_block(&mut enc, &uv_blocks_u[blk_idx], 2, 0);
        }

        // 4 V blocks
        for blk in 0..4 {
            let blk_idx = mb_idx * 4 + blk;
            encode_coeff_block(&mut enc, &uv_blocks_v[blk_idx], 3, 0);
        }
    }

    enc.finish()
}

// ---------------------------------------------------------------------------
// Coefficient encoding with real KF_COEFF_PROBS
// ---------------------------------------------------------------------------

/// Encode a 4×4 block of DCT coefficients using the VP8 token tree
/// with REAL probabilities from KF_COEFF_PROBS.
///
/// `coeffs`: 16 coefficients in 4×4 raster order.
/// `coeff_type`: 0=Y2_DC, 1=Y_AC, 2=UV_DC, 3=UV_AC
/// `ctx`: initial probability context (0-2)
fn encode_coeff_block(enc: &mut BoolEncoder, coeffs: &[i16; 16], coeff_type: usize, ctx: usize) {
    let scan = zigzag_scan(*coeffs);
    let eob = find_eob(&scan);

    let mut current_ctx = ctx;

    for pos in 0..=eob {
        let coeff = scan[pos];
        let abs_val = coeff.unsigned_abs() as u32;
        let is_last = pos == eob;

        if is_last && abs_val == 0 {
            // EOB token
            encode_token_with_probs(enc, 0, coeff_type, 0, current_ctx);
            break;
        }

        // Determine band based on position
        let band = if pos == 0 { 0 } else if pos <= 4 { 1 } else if pos <= 9 { 2 } else { 3 };

        // Encode token
        let token = abs_to_token(abs_val);
        encode_token_with_probs(enc, token, coeff_type, band, current_ctx);

        // Sign bit (for non-zero tokens)
        if abs_val > 0 {
            enc.encode_bool(coeff < 0, 128);
        }

        // Extra bits for category tokens
        encode_extra_bit(enc, abs_val);

        // Update context: if coefficient was non-zero, ctx=1 or 2
        current_ctx = if abs_val > 0 { 2 } else { 1 };
    }
}

/// VP8 token tree encoding with real probabilities from KF_COEFF_PROBS.
///
/// Token tree structure (10 internal nodes, 11 leaves):
/// Node 0 (prob[node 0]): LEFT → Node 1, RIGHT → Node 2
/// Node 1 (prob[node 1]): LEFT → Node 3, RIGHT → Node 4
/// Node 2 (prob[node 2]): LEFT → Node 5, RIGHT → Node 6
/// Node 3 (prob[node 3]): LEFT → ZERO(1), RIGHT → ONE(2)
/// Node 4 (prob[node 4]): LEFT → TWO(3), RIGHT → THREE(4)
/// Node 5 (prob[node 5]): LEFT → Node 7, RIGHT → Node 8
/// Node 6 (prob[node 6]): LEFT → Node 9, RIGHT → EOB(0)
/// Node 7 (prob[node 7]): LEFT → FOUR(5), RIGHT → CAT1(6)
/// Node 8 (prob[node 8]): LEFT → CAT2(7), RIGHT → CAT3(8)
/// Node 9 (prob[node 9]): LEFT → CAT4(9), RIGHT → CAT5(10)
fn encode_token_with_probs(enc: &mut BoolEncoder, token: u32, ctype: usize, band: usize, ctx: usize) {
    // Get probability for each tree node from KF_COEFF_PROBS
    let p = |node: usize| -> u8 { get_coeff_prob(ctype, band, ctx, node) };

    match token {
        // EOB (token 0): Node0→RIGHT, Node2→RIGHT, Node6→RIGHT
        0 => {
            enc.encode_bool(false, p(0)); // → Node 2
            enc.encode_bool(false, p(2)); // → Node 6
            enc.encode_bool(false, p(6)); // → EOB
        }
        // ZERO (token 1): Node0→LEFT, Node1→LEFT, Node3→LEFT
        1 => {
            enc.encode_bool(true, p(0));  // → Node 1
            enc.encode_bool(true, p(1));  // → Node 3
            enc.encode_bool(true, p(3));  // → ZERO
        }
        // ONE (token 2): Node0→LEFT, Node1→LEFT, Node3→RIGHT
        2 => {
            enc.encode_bool(true, p(0));
            enc.encode_bool(true, p(1));
            enc.encode_bool(false, p(3)); // → ONE
        }
        // TWO (token 3): Node0→LEFT, Node1→RIGHT, Node4→LEFT
        3 => {
            enc.encode_bool(true, p(0));
            enc.encode_bool(false, p(1)); // → Node 4
            enc.encode_bool(true, p(4));  // → TWO
        }
        // THREE (token 4): Node0→LEFT, Node1→RIGHT, Node4→RIGHT
        4 => {
            enc.encode_bool(true, p(0));
            enc.encode_bool(false, p(1));
            enc.encode_bool(false, p(4)); // → THREE
        }
        // FOUR (token 5): Node0→RIGHT, Node2→LEFT, Node5→LEFT, Node7→LEFT
        5 => {
            enc.encode_bool(false, p(0)); // → Node 2
            enc.encode_bool(true, p(2));  // → Node 5
            enc.encode_bool(true, p(5));  // → Node 7
            enc.encode_bool(true, p(7));  // → FOUR
        }
        // CAT1 (token 6): Node0→RIGHT, Node2→LEFT, Node5→LEFT, Node7→RIGHT
        6 => {
            enc.encode_bool(false, p(0));
            enc.encode_bool(true, p(2));
            enc.encode_bool(true, p(5));
            enc.encode_bool(false, p(7)); // → CAT1
        }
        // CAT2 (token 7): Node0→RIGHT, Node2→LEFT, Node5→RIGHT, Node8→LEFT
        7 => {
            enc.encode_bool(false, p(0));
            enc.encode_bool(true, p(2));
            enc.encode_bool(false, p(5)); // → Node 8
            enc.encode_bool(true, p(8));  // → CAT2
        }
        // CAT3 (token 8): Node0→RIGHT, Node2→LEFT, Node5→RIGHT, Node8→RIGHT
        8 => {
            enc.encode_bool(false, p(0));
            enc.encode_bool(true, p(2));
            enc.encode_bool(false, p(5));
            enc.encode_bool(false, p(8)); // → CAT3
        }
        // CAT4 (token 9): Node0→RIGHT, Node2→RIGHT, Node6→LEFT, Node9→LEFT
        9 => {
            enc.encode_bool(false, p(0));
            enc.encode_bool(false, p(2)); // → Node 6
            enc.encode_bool(true, p(6));  // → Node 9
            enc.encode_bool(true, p(9));  // → CAT4
        }
        // CAT5 (token 10): Node0→RIGHT, Node2→RIGHT, Node6→LEFT, Node9→RIGHT
        _ => {
            enc.encode_bool(false, p(0));
            enc.encode_bool(false, p(2));
            enc.encode_bool(true, p(6));
            enc.encode_bool(false, p(9)); // → CAT5
        }
    }
}

/// Map absolute coefficient value to VP8 token number.
fn abs_to_token(abs: u32) -> u32 {
    match abs {
        0 => 1,      // ZERO
        1 => 2,      // ONE
        2 => 3,      // TWO
        3 => 4,      // THREE
        4..=5 => 5,  // FOUR
        6..=8 => 6,  // CAT1
        9..=11 => 7, // CAT2
        12..=15 => 8,// CAT3
        16..=19 => 9,// CAT4
        _ => 10,     // CAT5 (20+)
    }
}

/// Encode extra bits for category tokens (5-10).
fn encode_extra_bit(enc: &mut BoolEncoder, abs: u32) {
    match abs {
        0..=3 => {} // no extra bits
        4..=5 => {
            enc.encode_bool(abs == 5, 128); // 1 bit
        }
        6..=8 => {
            enc.encode_value(abs - 6, 2, ); // 2 bits
        }
        9..=11 => {
            enc.encode_value(abs - 9, 2);
        }
        12..=15 => {
            enc.encode_value(abs - 12, 2);
        }
        16..=19 => {
            enc.encode_value(abs - 16, 2);
        }
        _ => {
            // CAT5: 3 extra bits for values 20-27
            if abs <= 27 {
                enc.encode_value(abs - 20, 3);
            } else {
                // Large values: clamp to CAT5 range
                enc.encode_value((abs - 20).min(7), 3);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Full MB encoding helpers
// ---------------------------------------------------------------------------

pub fn process_macroblock(
    y_residual: &[i16; 256],
    u_residual: &[i16; 64],
    v_residual: &[i16; 64],
) -> ([i16; 16], [[i16; 16]; 16], [[i16; 16]; 4], [[i16; 16]; 4]) {
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

    let mut dc_values = [0i16; 16];
    for i in 0..16 { dc_values[i] = y_dct[i][0]; }
    let wht = forward_wht_4x4(dc_values);

    let mut y_ac: [[i16; 16]; 16] = [[0; 16]; 16];
    for i in 0..16 {
        y_ac[i] = y_dct[i];
        y_ac[i][0] = 0;
    }

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
    fn quality_to_q_index_mapping() {
        assert_eq!(quality_to_q_index(100), 0);
        assert_eq!(quality_to_q_index(0), 127);
        let q75 = quality_to_q_index(75);
        assert!(q75 >= 10 && q75 <= 40);
    }

    #[test]
    fn first_partition_with_modes() {
        let modes = vec![YMode::DcPred; 4];
        let bytes = write_first_partition(&modes, 2, 2, 32, 20);
        assert!(!bytes.is_empty());
    }

    #[test]
    fn abs_to_token_correct() {
        assert_eq!(abs_to_token(0), 1);
        assert_eq!(abs_to_token(1), 2);
        assert_eq!(abs_to_token(5), 5);
        assert_eq!(abs_to_token(20), 10);
    }
}
