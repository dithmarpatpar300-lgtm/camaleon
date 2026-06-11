mod spike_fixtures;

use spike_fixtures::all_fixtures;
use transmutador_avif::{
    inspect_and_validate, transmutar_avif_a_png_inner, DEFAULT_COMPRESSION, MAX_COMPRESSION,
    MIN_COMPRESSION,
};

#[test]
fn empty_input_returns_error() {
    assert!(transmutar_avif_a_png_inner(&[], DEFAULT_COMPRESSION).is_err());
}

#[test]
fn valid_avif_to_png() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgb8_lossy")
        .unwrap();
    let out = transmutar_avif_a_png_inner(&fixture.bytes, 6).expect("convert");
    assert!(out.starts_with(&[137, 80, 78, 71, 13, 10, 26, 10]));
}

#[test]
fn compression_validation() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgb8_lossy")
        .unwrap();
    assert!(transmutar_avif_a_png_inner(&fixture.bytes, 0).is_err());
    assert!(transmutar_avif_a_png_inner(&fixture.bytes, MAX_COMPRESSION + 1).is_err());
    transmutar_avif_a_png_inner(&fixture.bytes, MIN_COMPRESSION).expect("min");
    transmutar_avif_a_png_inner(&fixture.bytes, MAX_COMPRESSION).expect("max");
}

#[test]
fn alpha_fixture_produces_rgba_png() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha_aux")
        .unwrap();
    let out = transmutar_avif_a_png_inner(&fixture.bytes, 6).expect("convert");
    let img = image::load_from_memory(&out).expect("png");
    assert!(img.color().has_alpha());
}

#[test]
fn strip_all_no_exif_in_output() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgb8_lossy")
        .unwrap();
    let png = transmutar_avif_a_png_inner(&fixture.bytes, 6).expect("convert");
    assert!(!core_utils::png_contains_exif_chunk(&png));
}

#[test]
fn animated_rejected_at_probe() {
    // Synthetic ftyp with avis brand — probe only, not a valid animated file.
    let mut bogus = vec![0u8; 32];
    bogus[4..8].copy_from_slice(b"ftyp");
    bogus[8..12].copy_from_slice(b"avis");
    let err = inspect_and_validate(&bogus).unwrap_err();
    assert!(
        err.contains("Animated") || err.contains("corrupt") || err.contains("Invalid"),
        "unexpected: {err}"
    );
}

#[test]
fn estimate_within_5pct() {
    for fixture in all_fixtures() {
        let full = transmutar_avif_a_png_inner(&fixture.bytes, 6).expect("full");
        let est = transmutador_avif::estimate_avif_to_png_size(&fixture.bytes, 6, 255, 0)
            .expect("est");
        let diff = (full.len() as f64 - est as f64).abs();
        let full_len = full.len() as f64;
        assert!(
            diff / full_len < 0.05,
            "{} estimate drift {:.1}%",
            fixture.name,
            100.0 * diff / full_len
        );
    }
}
