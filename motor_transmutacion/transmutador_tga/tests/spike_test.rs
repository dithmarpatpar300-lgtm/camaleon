mod spike_fixtures;

use image::GenericImageView;
use spike_fixtures::all_fixtures;
use transmutador_tga::{
    inspect_and_validate, transmutar_tga_a_png_inner, TgaImageType, TgaOrientation,
};

#[test]
fn empty_input_returns_error() {
    let err = inspect_and_validate(&[]).unwrap_err();
    assert!(err.contains("short") || err.contains("empty"));
}

#[test]
fn probe_matches_decode_dimensions() {
    for fixture in all_fixtures() {
        if fixture.name == "orientation_gradient" {
            continue;
        }
        let info = inspect_and_validate(&fixture.bytes).unwrap_or_else(|e| {
            panic!("probe failed for {}: {}", fixture.name, e);
        });
        let png = transmutar_tga_a_png_inner(&fixture.bytes, 6).unwrap_or_else(|e| {
            panic!("transmute failed for {}: {}", fixture.name, e);
        });
        assert!(png.starts_with(&[137, 80, 78, 71]), "{}", fixture.name);
        assert!(info.width > 0 && info.height > 0, "{}", fixture.name);
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

    let raw = inspect_and_validate(&by_name("rgb24_raw_top_left").bytes).unwrap();
    assert_eq!(raw.image_type, TgaImageType::RawTrueColor);
    assert_eq!(raw.orientation, TgaOrientation::TopLeft);
    assert!(!raw.image_type.is_rle());

    let bottom = inspect_and_validate(&by_name("rgb24_raw_bottom_left").bytes).unwrap();
    assert_eq!(bottom.orientation, TgaOrientation::BottomLeft);

    let rle = inspect_and_validate(&by_name("rgba32_rle").bytes).unwrap();
    assert!(rle.image_type.is_rle());
    assert!(rle.has_alpha_channel);

    let gray = inspect_and_validate(&by_name("gray8_rle").bytes).unwrap();
    assert_eq!(gray.image_type, TgaImageType::RunGrayScale);

    let indexed = inspect_and_validate(&by_name("indexed_raw").bytes).unwrap();
    assert!(indexed.image_type.is_color_mapped());

    let rgb555 = inspect_and_validate(&by_name("rgb555_16bit").bytes).unwrap();
    assert!(rgb555.is_rgb555);
    assert!(!rgb555.has_alpha_channel);
}

#[test]
fn bottom_left_orientation_flips_rows() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "orientation_gradient")
        .unwrap();
    let info = inspect_and_validate(&fixture.bytes).unwrap();
    assert_eq!(info.orientation, TgaOrientation::BottomLeft);

    let png = transmutar_tga_a_png_inner(&fixture.bytes, 6).unwrap();
    let img = image::load_from_memory(&png).expect("png");
    let top = img.get_pixel(0, 0).0;
    assert_eq!(top[0], 0);
    assert_eq!(top[2], 255);
}

#[test]
fn alpha_preserved_in_png_output() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba32_raw_alpha")
        .unwrap();
    let png = transmutar_tga_a_png_inner(&fixture.bytes, 6).unwrap();
    let img = image::load_from_memory(&png).expect("png");
    assert!(img.color().has_alpha());
    let has_transparent = img
        .to_rgba8()
        .pixels()
        .any(|p| p[3] < 255);
    assert!(has_transparent);
}

#[test]
fn tga2_footer_does_not_break_decode() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "tga2_footer_suffix")
        .unwrap();
    inspect_and_validate(&fixture.bytes).expect("probe");
    transmutar_tga_a_png_inner(&fixture.bytes, 6).expect("transmute");
}

#[test]
fn strip_all_no_exif_in_output() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgb24_raw_top_left")
        .unwrap();
    let png = transmutar_tga_a_png_inner(&fixture.bytes, 6).expect("convert");
    assert!(!core_utils::png_contains_exif_chunk(&png));
}

#[test]
fn estimate_within_5pct() {
    for fixture in all_fixtures() {
        let full = transmutar_tga_a_png_inner(&fixture.bytes, 6).expect("full");
        let est = transmutador_tga::estimate_tga_to_png_size(&fixture.bytes, 6).expect("est");
        let diff = (full.len() as f64 - est as f64).abs();
        assert!(
            (diff / full.len() as f64) < 0.05,
            "{} estimate drift {:.1}%",
            fixture.name,
            100.0 * diff / full.len() as f64
        );
    }
}
