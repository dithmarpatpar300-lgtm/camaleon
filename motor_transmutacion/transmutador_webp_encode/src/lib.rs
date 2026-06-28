//! Picture-VP8 — Pure Rust VP8 intra-frame lossy encoder for WebP.
//!
//! Phase 1: MVP — DC_PRED encoder producing valid WebP lossy files.

pub mod bac;
pub mod bitstream;
pub mod error;
pub mod fdct;
pub mod macroblock;
pub mod prediction;
pub mod probabilities;
pub mod yuv;
pub mod zigzag;

use crate::macroblock::MacroblockGrid;
use crate::prediction::{choose_mb_mode, compute_residual_16x16, compute_residual_8x8,
    predict_chroma_8x8, YMode};
use crate::probabilities::{AC_QLOOKUP, DC_QLOOKUP};

use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Full encoding pipeline
// ---------------------------------------------------------------------------

/// Encode an RGB image to WebP lossy format (VP8 intra-frame).
///
/// `rgb`: RGB pixel data (width × height × 3 bytes, R/G/B interleaved).
/// `width`: image width in pixels.
/// `height`: image height in pixels.
/// `quality`: 0-100 quality parameter (maps to VP8 quantizer index).
///
/// Returns a valid WebP file as bytes (RIFF container with VP8 chunk).
pub fn encode_webp_lossy(
    rgb: &[u8],
    width: usize,
    height: usize,
    quality: u8,
) -> Result<Vec<u8>, String> {
    if width == 0 || height == 0 {
        return Err("Invalid dimensions: width and height must be > 0".into());
    }
    let expected = width * height * 3;
    if rgb.len() != expected {
        return Err(format!(
            "RGB buffer size mismatch: expected {expected}, got {}",
            rgb.len()
        ));
    }

    let q_index = bitstream::quality_to_q_index(quality);

    // Step 1: RGB → YUV 4:2:0
    let (y_plane, u_plane, v_plane) = yuv::rgb_to_yuv_420(rgb, width, height);

    // Step 2: Macroblock grid with padding
    let grid = MacroblockGrid::new(&y_plane, &u_plane, &v_plane, width, height);
    let mb_cols = grid.mb_cols;
    let mb_rows = grid.mb_rows;

    // All MBs use DC_PRED for Phase 1; Phase 2 chooses per-MB
    let mut modes: Vec<YMode> = Vec::with_capacity(grid.total_mbs());

    // Step 3: Process all macroblocks (FDCT + WHT)
    let total_mbs = grid.total_mbs();
    let mut all_wht: Vec<[i16; 16]> = Vec::with_capacity(total_mbs);
    let mut all_y_ac: Vec<[i16; 16]> = Vec::with_capacity(total_mbs * 16);
    let mut all_u_blocks: Vec<[i16; 16]> = Vec::with_capacity(total_mbs * 4);
    let mut all_v_blocks: Vec<[i16; 16]> = Vec::with_capacity(total_mbs * 4);

    let dc_q = DC_QLOOKUP[q_index as usize] as i16;
    let ac_q = AC_QLOOKUP[q_index as usize] as i16;

    for mb_row in 0..mb_rows {
        for mb_col in 0..mb_cols {
            let mb = grid.get_mb(mb_row, mb_col);

            let has_above = mb_row > 0;
            let has_left = mb_col > 0;

            // Get neighbor pixels for prediction
            let mut above_y = [128u8; 16];
            let mut left_y = [128u8; 16];
            let mut above_u = [128u8; 8];
            let mut left_u = [128u8; 8];
            let mut above_v = [128u8; 8];
            let mut left_v = [128u8; 8];

            if has_above {
                let above_mb = grid.get_mb(mb_row - 1, mb_col);
                for i in 0..16 {
                    above_y[i] = above_mb.y[15 * 16 + i]; // last row
                }
                for i in 0..8 {
                    above_u[i] = above_mb.u[7 * 8 + i];
                    above_v[i] = above_mb.v[7 * 8 + i];
                }
            }
            if has_left {
                let left_mb = grid.get_mb(mb_row, mb_col - 1);
                for i in 0..16 {
                    left_y[i] = left_mb.y[i * 16 + 15]; // last column
                }
                for i in 0..8 {
                    left_u[i] = left_mb.u[i * 8 + 7];
                    left_v[i] = left_mb.v[i * 8 + 7];
                }
            }

            // Phase 2: choose best prediction mode via SAD
            let top_left = if has_above && has_left {
                let above_mb = grid.get_mb(mb_row - 1, mb_col);
                let left_mb = grid.get_mb(mb_row, mb_col - 1);
                above_mb.y[15 * 16 + 15].min(left_mb.y[15]) as u8
            } else { 128u8 };

            let (y_mode, pred_y) = choose_mb_mode(
                &mb.y, &above_y, &left_y, has_above, has_left, top_left,
            );
            modes.push(y_mode);

            // Chroma prediction (DC_PRED only for simplicity — Phase 2 uses DC for chroma)
            let pred_u = predict_chroma_8x8(YMode::DcPred, &above_u, &left_u, has_above, has_left, 128);
            let pred_v = predict_chroma_8x8(YMode::DcPred, &above_v, &left_v, has_above, has_left, 128);

            // Residuals
            let y_residual = compute_residual_16x16(&mb.y, &pred_y);
            let u_residual = compute_residual_8x8(&mb.u, &pred_u);
            let v_residual = compute_residual_8x8(&mb.v, &pred_v);

            // Quantize all residuals (simple scalar quantization for Phase 1)
            let y_residual_q: [i16; 256] = std::array::from_fn(|i| {
                let v = y_residual[i] as i32;
                let qval = if i == 0 { dc_q as i32 } else { ac_q as i32 };
                ((v + qval / 2) / qval).clamp(-128, 127) as i16
            });
            let u_residual_q: [i16; 64] = std::array::from_fn(|i| {
                let v = u_residual[i] as i32;
                let qval = if i == 0 { dc_q as i32 } else { ac_q as i32 };
                ((v + qval / 2) / qval).clamp(-128, 127) as i16
            });
            let v_residual_q: [i16; 64] = std::array::from_fn(|i| {
                let v = v_residual[i] as i32;
                let qval = if i == 0 { dc_q as i32 } else { ac_q as i32 };
                ((v + qval / 2) / qval).clamp(-128, 127) as i16
            });

            let (wht, y_ac, u_blocks, v_blocks) = bitstream::process_macroblock(
                &y_residual_q,
                &u_residual_q,
                &v_residual_q,
            );

            all_wht.push(wht);
            all_y_ac.extend_from_slice(&y_ac);
            all_u_blocks.extend_from_slice(&u_blocks);
            all_v_blocks.extend_from_slice(&v_blocks);
        }
    }

    // Step 4: Write first partition (frame params + MB modes)
    let filter_level = ((q_index as u32 * 63) / 127).min(63) as u8;
    let first_part = bitstream::write_first_partition(
        &modes,
        mb_cols,
        mb_rows,
        q_index,
        filter_level,
    );

    // Step 5: Write second partition (coefficients only)
    let second_part = bitstream::write_second_partition(
        &all_y_ac,
        &all_wht,
        &all_u_blocks,
        &all_v_blocks,
        mb_cols,
        mb_rows,
    );

    // Step 6: Frame header
    let first_part_size = first_part.len() as u32;
    let header = bitstream::write_frame_header(width as u32, height as u32, first_part_size);

    // Step 7: Assemble VP8 bitstream
    let mut vp8_data = Vec::with_capacity(10 + first_part.len() + second_part.len());
    vp8_data.extend_from_slice(&header);
    vp8_data.extend_from_slice(&first_part);
    vp8_data.extend_from_slice(&second_part);

    // Step 8: RIFF container
    let mut output = Vec::with_capacity(12 + 8 + vp8_data.len());
    assemble_webp_lossy(&vp8_data, &mut output);

    Ok(output)
}

/// Assemble a WebP lossy file: RIFF header + VP8 chunk.
fn assemble_webp_lossy(vp8_data: &[u8], output: &mut Vec<u8>) {
    let vp8_chunk_size = vp8_data.len();
    let file_size = 4 + 8 + vp8_chunk_size; // "WEBP" + VP8 chunk header + data

    // RIFF header
    output.extend_from_slice(b"RIFF");
    output.extend_from_slice(&((file_size - 8) as u32).to_le_bytes());
    output.extend_from_slice(b"WEBP");

    // VP8 chunk
    output.extend_from_slice(b"VP8 ");
    output.extend_from_slice(&(vp8_chunk_size as u32).to_le_bytes());
    output.extend_from_slice(vp8_data);

    // Pad if odd (RIFF alignment)
    if vp8_chunk_size % 2 != 0 {
        output.push(0x00);
    }
}

// ---------------------------------------------------------------------------
// Wasm exports
// ---------------------------------------------------------------------------

#[wasm_bindgen]
pub fn set_session_input_limit(_max_bytes: u32) {}

#[wasm_bindgen]
pub fn reset_session_input_limit() {}

#[wasm_bindgen]
pub fn set_risk_mode(_enabled: bool) {}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encode_tiny_image_produces_valid_webp() {
        // Create a 16×16 RGB image (1 macroblock)
        let mut rgb = vec![0u8; 16 * 16 * 3];
        for i in 0..256 {
            rgb[i * 3] = (i % 256) as u8;
            rgb[i * 3 + 1] = (i / 2 % 256) as u8;
            rgb[i * 3 + 2] = (i / 3 % 256) as u8;
        }

        let result = encode_webp_lossy(&rgb, 16, 16, 75);
        assert!(result.is_ok(), "encoding should succeed");

        let webp = result.unwrap();
        assert!(webp.len() > 30, "WebP file should have at least 30 bytes");

        // Verify RIFF header
        assert_eq!(&webp[0..4], b"RIFF");
        assert_eq!(&webp[8..12], b"WEBP");

        // Verify VP8 chunk
        assert_eq!(&webp[12..16], b"VP8 ");

        // Verify start code in VP8 frame header
        let vp8_offset = 20; // RIFF(12) + VP8 fourcc(4) + size(4) = 20
        assert_eq!(webp[vp8_offset + 3], 0x9D, "start code byte 1");
        assert_eq!(webp[vp8_offset + 4], 0x01, "start code byte 2");
        assert_eq!(webp[vp8_offset + 5], 0x2A, "start code byte 3");
    }

    #[test]
    fn encode_32x32_produces_output() {
        let rgb = vec![128u8; 32 * 32 * 3];
        let result = encode_webp_lossy(&rgb, 32, 32, 50);
        assert!(result.is_ok());
        let webp = result.unwrap();
        assert!(webp.len() > 100, "32×32 image should produce >100 bytes");
    }

    #[test]
    fn encode_rejects_invalid_dimensions() {
        let rgb = vec![0u8; 10];
        assert!(encode_webp_lossy(&rgb, 0, 10, 75).is_err());
        assert!(encode_webp_lossy(&rgb, 10, 0, 75).is_err());
    }

    #[test]
    fn encode_rejects_buffer_mismatch() {
        let rgb = vec![0u8; 10];
        assert!(encode_webp_lossy(&rgb, 10, 10, 75).is_err());
    }
}
