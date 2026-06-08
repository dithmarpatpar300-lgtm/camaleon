mod spike_fixtures;

use image::ImageEncoder;
use spike_fixtures::all_fixtures;
use transmutador_ico::{
    decode_ico_entry, inspect_and_validate, transmutar_ico_a_png_inner, IcoContainerKind,
};

#[test]
fn empty_input_returns_error() {
    let err = inspect_and_validate(&[]).unwrap_err();
    assert!(err.contains("short"));
}

#[test]
fn multi_size_default_is_largest() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "multi_size_png")
        .expect("fixture");
    let info = inspect_and_validate(&fixture.bytes).expect("inspect");
    assert_eq!(info.entry_count, 3);
    assert_eq!(info.default_entry_index, 2);
    let img = decode_ico_entry(&fixture.bytes, info.default_entry_index).expect("decode");
    assert_eq!(img.width(), 256);
}

#[test]
fn entry_index_selects_smaller_layer() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "multi_size_png")
        .expect("fixture");
    let img = decode_ico_entry(&fixture.bytes, 0).expect("decode");
    assert_eq!(img.width(), 16);
}

#[test]
fn png_output_is_valid() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha_32")
        .expect("fixture");
    let png = transmutar_ico_a_png_inner(&fixture.bytes, 6, 0).expect("convert");
    assert_eq!(&png[0..8], [137, 80, 78, 71, 13, 10, 26, 10]);
}

#[test]
fn alpha_preserved_in_png_output() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha_32")
        .expect("fixture");
    let png = transmutar_ico_a_png_inner(&fixture.bytes, 6, 0).expect("convert");
    assert!(!core_utils::png_contains_exif_chunk(&png));
    let img = image::load_from_memory(&png).expect("decode png");
    assert!(img.color().has_alpha());
}

#[test]
fn cur_container_detected() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "cursor_cur")
        .expect("fixture");
    let info = inspect_and_validate(&fixture.bytes).expect("inspect");
    assert_eq!(info.container, IcoContainerKind::Cursor);
}

#[test]
fn estimate_within_5pct() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "single_16_png")
        .expect("fixture");
    let full = transmutar_ico_a_png_inner(&fixture.bytes, 6, 0).expect("full");
    let est = transmutador_ico::estimate_ico_to_png_size(&fixture.bytes, 6, 0).expect("est");
    let diff = (full.len() as f64 - est as f64).abs();
    assert!((diff / full.len() as f64) < 0.05);
}

#[test]
fn png_to_ico_round_trip() {
    let png_fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha_32")
        .expect("fixture");
    let png = transmutador_ico::transmutar_ico_a_png_inner(&png_fixture.bytes, 6, 0).expect("png");
    let ico = transmutador_ico::transmutar_png_a_ico_inner(&png, 32).expect("ico");
    assert_eq!(&ico[0..4], [0, 0, 1, 0]);
    let info = inspect_and_validate(&ico).expect("inspect ico out");
    assert_eq!(info.entry_count, 1);
    assert_eq!(info.entries[0].width, 32);
}

#[test]
fn png_to_ico_no_upscale() {
    let mut buf = Vec::new();
    image::codecs::png::PngEncoder::new(&mut buf)
        .write_image(
            &[0, 128, 255, 255],
            1,
            1,
            image::ExtendedColorType::Rgba8,
        )
        .expect("png");
    let ico = transmutador_ico::transmutar_png_a_ico_inner(&buf, 256).expect("ico");
    let info = inspect_and_validate(&ico).expect("inspect");
    assert_eq!(info.entries[0].width, 1);
}

#[test]
fn out_of_range_entry_rejected() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "single_16_png")
        .expect("fixture");
    let err = decode_ico_entry(&fixture.bytes, 3).unwrap_err();
    assert!(err.contains("out of range"));
}
