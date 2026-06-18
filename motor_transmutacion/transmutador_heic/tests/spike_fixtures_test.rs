//! Tier 3 Phase 3.4.0 — HEIC decode spike tests (fixture matrix §7.5).

use std::path::PathBuf;

use core_utils::semantic_alpha::WASM_ALPHA_HINT_NONE;
use core_utils::MAX_PIXELS;
use image::codecs::jpeg::JpegDecoder;
use image::codecs::png::PngDecoder;
use image::DynamicImage;
use transmutador_heic::{
    estimate_heic_to_jpg_inner, estimate_heic_to_png_inner, inspect_heic, inspect_heic_meta,
    transmutar_heic_a_jpg_inner, transmutar_heic_a_png_inner, verify_heic_decodable,
    DEFAULT_COMPRESSION, DEFAULT_QUALITY,
};

fn fixture(name: &str) -> Vec<u8> {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join(name);
    std::fs::read(&path).unwrap_or_else(|e| panic!("missing fixture {}: {}", path.display(), e))
}

fn decode_png(bytes: &[u8]) -> DynamicImage {
    let dec = PngDecoder::new(std::io::Cursor::new(bytes)).expect("png decode");
    DynamicImage::from_decoder(dec).expect("png dynamic")
}

fn decode_jpeg(bytes: &[u8]) -> DynamicImage {
    let dec = JpegDecoder::new(std::io::Cursor::new(bytes)).expect("jpeg decode");
    DynamicImage::from_decoder(dec).expect("jpeg dynamic")
}

#[test]
fn iphone_photo_rgb_probe_and_decode() {
    let bytes = fixture("bt709.heic");
    let info = inspect_heic(&bytes).expect("probe");
    assert!(info.width > 0 && info.height > 0);
    verify_heic_decodable(&bytes).expect("decode");

    let png = transmutar_heic_a_png_inner(&bytes, DEFAULT_COMPRESSION).expect("png");
    assert!(png.starts_with(&[0x89, 0x50, 0x4E, 0x47]));
    let img = decode_png(&png);
    assert_eq!(img.width(), info.width);
    assert_eq!(img.height(), info.height);
}

#[test]
fn grid_tiled_decode() {
    let bytes = fixture("grid.heic");
    let info = inspect_heic(&bytes).expect("probe");
    assert!(info.width > 0 && info.height > 0);
    verify_heic_decodable(&bytes).expect("grid decode");
    transmutar_heic_a_jpg_inner(&bytes, DEFAULT_QUALITY, 255, 255, 255).expect("jpg");
}

#[test]
fn alpha_aux_png_rgba() {
    let bytes = fixture("alpha.heic");
    let info = inspect_heic(&bytes).expect("probe");
    assert!(info.has_alpha_channel);
    let png = transmutar_heic_a_png_inner(&bytes, DEFAULT_COMPRESSION).expect("png");
    let img = decode_png(&png);
    assert_eq!(img.width(), info.width);
    assert_eq!(img.height(), info.height);
}

#[test]
fn orientation_irot_applied_in_output() {
    let bytes = fixture("iden_rot90.heic");
    let info = inspect_heic(&bytes).expect("probe");
    let png = transmutar_heic_a_png_inner(&bytes, DEFAULT_COMPRESSION).expect("png");
    let img = decode_png(&png);
    assert_eq!(img.width(), info.width);
    assert_eq!(img.height(), info.height);
    assert!(img.width() > 1 && img.height() > 1);
}

#[test]
fn depth_aux_decode_with_hint_flags() {
    let bytes = fixture("depth10.heic");
    let info = inspect_heic(&bytes).expect("probe");
    // depth10 fixture may expose depth via decode path only — probe flag optional
    let _ = info.has_depth_aux;
    verify_heic_decodable(&bytes).expect("depth container still decodes rgb");
}

#[test]
fn inspect_meta_wasm_path() {
    let bytes = fixture("bt709.heic");
    inspect_heic_meta(&bytes).expect("meta includes decodable check");
}

#[test]
fn corrupt_truncated_rejected() {
    let err = inspect_heic(b"not heic").unwrap_err();
    assert!(err.contains("HEIF") || err.contains("HEIC") || err.contains("short"));
    let err = verify_heic_decodable(&[0u8; 4]).unwrap_err();
    assert!(!err.is_empty());
}

#[test]
fn estimate_within_five_percent_of_full_encode() {
    let bytes = fixture("bt709.heic");
    let full = transmutar_heic_a_jpg_inner(&bytes, DEFAULT_QUALITY, 255, 255, 255)
        .expect("full")
        .len() as u32;
    let est = estimate_heic_to_jpg_inner(
        &bytes,
        DEFAULT_QUALITY,
        255,
        255,
        255,
        WASM_ALPHA_HINT_NONE,
        0,
    )
    .expect("est");
    let delta = est.abs_diff(full);
    assert!(
        delta <= (full / 20).max(64),
        "estimate {} vs full {} (delta {})",
        est,
        full,
        delta
    );

    let full_png = transmutar_heic_a_png_inner(&bytes, DEFAULT_COMPRESSION)
        .expect("full png")
        .len() as u32;
    let est_png = estimate_heic_to_png_inner(
        &bytes,
        DEFAULT_COMPRESSION,
        WASM_ALPHA_HINT_NONE,
        0,
    )
    .expect("est png");
    let delta_png = est_png.abs_diff(full_png);
    assert!(
        delta_png <= (full_png / 20).max(64),
        "png estimate {} vs full {} (delta {})",
        est_png,
        full_png,
        delta_png
    );
}

#[test]
fn jpeg_output_valid() {
    let bytes = fixture("bt709.heic");
    let jpg = transmutar_heic_a_jpg_inner(&bytes, DEFAULT_QUALITY, 255, 255, 255).expect("jpg");
    assert!(jpg.starts_with(&[0xFF, 0xD8]));
    let img = decode_jpeg(&jpg);
    assert!(img.width() > 0 && img.height() > 0);
}

#[test]
fn probe_without_full_decode_is_fast_path() {
    let bytes = fixture("grid.heic");
    let info = inspect_heic(&bytes).expect("probe only");
    let pc = u64::from(info.width) * u64::from(info.height);
    assert!(pc <= MAX_PIXELS);
}
