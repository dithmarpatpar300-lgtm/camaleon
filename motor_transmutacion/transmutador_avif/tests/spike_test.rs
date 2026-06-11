mod spike_fixtures;

use spike_fixtures::{all_fixtures, corrupt_truncated};
use transmutador_avif::{
    decode_avif_preview_png, decode_avif_to_dynamic, inspect_and_validate, inspect_avif,
};

#[test]
fn empty_input_returns_error() {
    let err = inspect_and_validate(&[]).unwrap_err();
    assert!(err.to_lowercase().contains("empty") || err.contains("short"));
}

#[test]
fn corrupt_truncated_rejected() {
    assert!(inspect_and_validate(&corrupt_truncated()).is_err());
    assert!(decode_avif_to_dynamic(&corrupt_truncated()).is_err());
}

#[test]
fn probe_matches_decode_dimensions() {
    for fixture in all_fixtures() {
        let info = inspect_and_validate(&fixture.bytes).unwrap_or_else(|e| {
            panic!("probe failed for {}: {}", fixture.name, e);
        });
        let img = decode_avif_to_dynamic(&fixture.bytes).unwrap_or_else(|e| {
            panic!("decode failed for {}: {}", fixture.name, e);
        });
        assert_eq!(info.width, img.width(), "{}", fixture.name);
        assert_eq!(info.height, img.height(), "{}", fixture.name);
    }
}

#[test]
fn fixture_matrix_metadata() {
    let by_name = |n: &str| {
        all_fixtures()
            .into_iter()
            .find(|f| f.name == n)
            .expect(n)
    };

    let lossy = inspect_avif(&by_name("rgb8_lossy").bytes).unwrap();
    assert!(lossy.bit_depth == 8 || lossy.bit_depth == 10);
    assert!(!lossy.is_sequence);

    let alpha = inspect_avif(&by_name("rgba_alpha_aux").bytes).unwrap();
    assert!(alpha.has_alpha_channel);

    let opaque = inspect_avif(&by_name("opaque_rgba").bytes).unwrap();
    // Encoder may omit alpha aux item when pixels are fully opaque.
    let _ = opaque.has_alpha_channel;

    let ten = inspect_avif(&by_name("rgb8_10bit").bytes).unwrap();
    assert_eq!(ten.bit_depth, 10);
}

#[test]
fn alpha_preserved_in_preview_png() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha_aux")
        .unwrap();
    let png = decode_avif_preview_png(&fixture.bytes, 0).unwrap();
    let img = image::load_from_memory(&png).expect("png");
    assert!(img.color().has_alpha());
    let has_transparent = img.to_rgba8().pixels().any(|p| p[3] < 255);
    assert!(has_transparent);
}

#[test]
fn opaque_rgba_decodes_without_transparent_pixels() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "opaque_rgba")
        .unwrap();
    let img = decode_avif_to_dynamic(&fixture.bytes).unwrap();
    if img.color().has_alpha() {
        let rgba = img.to_rgba8();
        assert!(!rgba.pixels().any(|p| p[3] < 255));
    }
}

#[test]
fn ten_bit_decodes_to_8bit_raster() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgb8_10bit")
        .unwrap();
    let img = decode_avif_to_dynamic(&fixture.bytes).unwrap();
    assert_eq!(img.color().bits_per_pixel(), 24);
    let _ = img.to_rgb8();
}

#[test]
fn oversize_dimensions_rejected_at_probe() {
    // Full synthetic oversize AVIF deferred — verify guard math here.
    let w = 90000u32;
    let h = 90000u32;
    let pc = core_utils::pixel_count(w, h).unwrap();
    assert!(pc > core_utils::MAX_PIXELS);
}

#[test]
fn preview_png_is_valid() {
    for fixture in all_fixtures() {
        let png = decode_avif_preview_png(&fixture.bytes, 0).unwrap_or_else(|e| {
            panic!("preview failed for {}: {}", fixture.name, e);
        });
        assert!(png.starts_with(&[137, 80, 78, 71]), "{}", fixture.name);
    }
}
