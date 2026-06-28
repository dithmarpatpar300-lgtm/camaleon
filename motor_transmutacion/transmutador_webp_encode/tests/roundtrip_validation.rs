//! Internal round-trip validation — decode our own VP8 bitstream
//! using Picture-VP8's BoolDecoder to verify encoder consistency.

use transmutador_webp_encode::encode_webp_lossy;
use transmutador_webp_encode::bac::BoolDecoder;
use transmutador_webp_encode::prediction::YMode;
use transmutador_webp_encode::probabilities::{KF_Y_MODE_PROBS};

/// Parse the uncompressed VP8 frame header.
fn parse_frame_header(data: &[u8]) -> (u32, u32, u32) {
    let frame_tag = data[0] as u32 | ((data[1] as u32) << 8) | ((data[2] as u32) << 16);
    let first_part_size = (frame_tag >> 5) & 0x7FFFF;
    let w_lo = data[6] as u16;
    let w_hi = data[7] as u16;
    let h_lo = data[8] as u16;
    let h_hi = data[9] as u16;
    let width = (w_lo | ((w_hi & 0x3F) << 8)) as u32;
    let height = (h_lo | ((h_hi & 0x3F) << 8)) as u32;
    (width, height, first_part_size)
}

/// Decode y_mode from the BoolDecoder.
fn decode_y_mode(dec: &mut BoolDecoder, prob_idx: usize) -> YMode {
    let prob = KF_Y_MODE_PROBS[prob_idx];
    if dec.decode_bool(prob[2]) {
        YMode::TmPred
    } else if dec.decode_bool(prob[0]) {
        YMode::DcPred
    } else if dec.decode_bool(prob[1]) {
        YMode::VPred
    } else {
        YMode::HPred
    }
}

#[test]
fn roundtrip_frame_params() {
    // Encode a 32×32 image (4 MBs) — enough booleans for BAC warmup
    let rgb = vec![128u8; 32 * 32 * 3];
    let webp = encode_webp_lossy(&rgb, 32, 32, 75).expect("encode");

    // Verify RIFF
    assert_eq!(&webp[0..4], b"RIFF");
    assert_eq!(&webp[8..12], b"WEBP");
    assert_eq!(&webp[12..16], b"VP8 ");

    // Parse frame header (at offset 20 = RIFF(12) + VP8 chunk header(8))
    let vp8 = 20;
    let (width, height, first_part_size) = parse_frame_header(&webp[vp8..vp8+10]);
    println!("Width={width} Height={height} first_part_size={first_part_size}");
    assert_eq!(width, 32);
    assert_eq!(height, 32);
    assert!(first_part_size >= 2, "first partition should have >= 2 bytes");

    // First partition BAC data starts at offset vp8+10
    let fp_start = vp8 + 10;
    let fp_bytes = &webp[fp_start..fp_start + first_part_size as usize];

    // Decode first partition with our BoolDecoder
    let mut dec = BoolDecoder::new(fp_bytes);

    // Frame params
    let color_space = dec.decode_bool(128);
    let clamping_type = dec.decode_bool(128);
    let segmentation = dec.decode_bool(128);
    let filter_type = dec.decode_bool(128);
    let loop_filter_level = dec.decode_value(6);
    let sharpness_level = dec.decode_value(3);
    let mb_lf_adjustments = dec.decode_bool(128);
    let y_ac_qi = dec.decode_value(7);
    let y_dc_delta = dec.decode_bool(128);
    let y2_dc_delta = dec.decode_bool(128);
    let y2_ac_delta = dec.decode_bool(128);
    let uv_dc_delta = dec.decode_bool(128);
    let uv_ac_delta = dec.decode_bool(128);
    let refresh_golden = dec.decode_bool(128);
    let refresh_alt = dec.decode_bool(128);
    let coeff_prob_update = dec.decode_bool(128);
    let mb_probs_update = dec.decode_bool(128);
    let skip_mode = dec.decode_bool(128);

    println!("Frame params: cs={color_space} clamp={clamping_type} seg={segmentation}");
    println!("  filter_type={filter_type} lf_level={loop_filter_level} sharp={sharpness_level}");
    println!("  y_ac_qi={y_ac_qi} deltas: yd={y_dc_delta} y2d={y2_dc_delta} y2a={y2_ac_delta} ud={uv_dc_delta} ua={uv_ac_delta}");

    // Verify expected values
    assert!(!color_space, "color_space should be 0 (YUV)");
    assert!(!clamping_type);
    assert!(!segmentation);
    assert!(!filter_type);
    // y_ac_qi for quality 75: q_index = quality_to_q_index(75) = 32
    assert_eq!(y_ac_qi, 32, "y_ac_qi should be 32 for quality 75");

    let total_mbs = 4; // 32×32 = 2×2 MBs
    // Second partition starts after first partition
    let sp_start = fp_start + first_part_size as usize;
    let sp_bytes = &webp[sp_start..];
    let mut sp_dec = BoolDecoder::new(sp_bytes);

    // Decode y_mode for each MB (Phase 1: all should be DC_PRED)
    println!("\nSecond partition MB modes:");
    for mb in 0..total_mbs {
        let above_mode = if mb >= 2 { YMode::DcPred } else { YMode::DcPred };
        let left_mode = if mb % 2 == 1 { YMode::DcPred } else { YMode::DcPred };
        let prob_idx = if above_mode == left_mode { 0 } else { 1 };

        let y_mode = decode_y_mode(&mut sp_dec, prob_idx);
        let uv_mode = decode_y_mode(&mut sp_dec, prob_idx); // same tree for chroma
        println!("  MB {mb}: y={y_mode:?} uv={uv_mode:?}");

        assert_eq!(y_mode, YMode::DcPred, "MB {mb} y_mode should be DC_PRED");
        assert_eq!(uv_mode, YMode::DcPred, "MB {mb} uv_mode should be DC_PRED");

        // Skip WHT and coefficient blocks for now — they're complex to decode
        // In Phase 2 we'll add coefficient decoding validation
    }

    println!("\n✅ Round-trip validation PASSED: {total_mbs} MBs decoded, all DC_PRED");
}
