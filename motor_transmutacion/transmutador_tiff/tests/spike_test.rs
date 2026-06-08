mod spike_fixtures;

use spike_fixtures::all_fixtures;
use transmutador_tiff::{
    assess_tiff_page_alpha, downshift_u16_sample_to_u8, estimate_tiff_to_png_size, inspect_tiff,
    inspect_tiff_meta, is_palette_page, transmutar_tiff_a_png_inner,
};

#[test]
fn rgb8_decodes_and_converts_to_png() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgb8_uncompressed")
        .expect("fixture");
    let png = transmutar_tiff_a_png_inner(&fixture.bytes, 6, 0).expect("convert");
    assert_eq!(&png[0..8], b"\x89PNG\r\n\x1a\n");
}

#[test]
fn gray16_decodes_and_downshifts() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "gray16_uncompressed")
        .expect("fixture");
    let png = transmutar_tiff_a_png_inner(&fixture.bytes, 6, 0).expect("convert");
    let decoded = image::load_from_memory(&png).expect("png");
    assert_eq!(decoded.width(), 8);
    assert_eq!(downshift_u16_sample_to_u8(65535), 255);
}

#[test]
fn lzw_rgb8_decodes() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "lzw_rgb8")
        .expect("fixture");
    transmutar_tiff_a_png_inner(&fixture.bytes, 6, 0).expect("convert");
}

#[test]
fn opaque_rgba_tiff_has_channel_but_not_meaningful_alpha() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_opaque")
        .expect("fixture");
    let meta = inspect_tiff_meta(&fixture.bytes).expect("inspect");
    assert!(meta.page_has_alpha(0).expect("page_has_alpha"));
    let assessment = assess_tiff_page_alpha(&fixture.bytes, 0).expect("assess");
    assert!(assessment.has_alpha_channel);
    assert!(!assessment.has_meaningful_alpha);
}

#[test]
fn real_rgba_tiff_has_meaningful_alpha() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha")
        .expect("fixture");
    let assessment = assess_tiff_page_alpha(&fixture.bytes, 0).expect("assess");
    assert!(assessment.has_meaningful_alpha);
}

#[test]
fn rgba_alpha_produces_rgba_png() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha")
        .expect("fixture");
    let png = transmutar_tiff_a_png_inner(&fixture.bytes, 6, 0).expect("convert");
    assert_eq!(png[25], 6);
}

#[test]
fn multipage_page_index_selects_second_ifd() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "multipage_2_ifd")
        .expect("fixture");
    let info = inspect_tiff(&fixture.bytes).expect("inspect");
    assert_eq!(info.page_count, 2);

    let page0 = transmutar_tiff_a_png_inner(&fixture.bytes, 6, 0).expect("p0");
    let page1 = transmutar_tiff_a_png_inner(&fixture.bytes, 6, 1).expect("p1");
    let d0 = image::load_from_memory(&page0).expect("d0");
    let d1 = image::load_from_memory(&page1).expect("d1");
    assert_eq!(d0.width(), 2);
    assert_eq!(d1.width(), 3);
}

#[test]
fn palette_rejected_at_inspect() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "palette_indexed")
        .expect("fixture");
    let info = inspect_tiff(&fixture.bytes).expect("probe metadata");
    assert!(is_palette_page(&info.pages[0]));
    match inspect_tiff_meta(&fixture.bytes) {
        Ok(_) => panic!("palette must be rejected"),
        Err(err) => assert!(err.contains("palette")),
    }
}

#[test]
fn estimate_within_5pct_of_full_encode() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgb8_uncompressed")
        .expect("fixture");
    let full = transmutar_tiff_a_png_inner(&fixture.bytes, 6, 0).expect("full");
    let est = estimate_tiff_to_png_size(&fixture.bytes, 6, 0).expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    assert!((diff / full.len() as f64) < 0.05);
}

#[test]
fn strip_all_no_exif_in_output() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgb8_uncompressed")
        .expect("fixture");
    let png = transmutar_tiff_a_png_inner(&fixture.bytes, 6, 0).expect("convert");
    assert!(!core_utils::png_contains_exif_chunk(&png));
}

#[test]
fn empty_input_returns_error() {
    let err = transmutar_tiff_a_png_inner(&[], 6, 0).unwrap_err();
    assert!(err.contains("empty"));
}

#[test]
fn rgba_tiff_to_jpg_produces_valid_jpeg() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha")
        .expect("fixture");
    let jpg = transmutador_tiff::transmutar_tiff_a_jpg_inner(&fixture.bytes, 85, 255, 255, 255, 0)
        .expect("convert");
    assert_eq!(&jpg[0..2], [0xff, 0xd8]);
}

#[test]
fn jpg_estimate_within_5pct() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgb8_uncompressed")
        .expect("fixture");
    let full =
        transmutador_tiff::transmutar_tiff_a_jpg_inner(&fixture.bytes, 85, 255, 255, 255, 0)
            .expect("full");
    let est = transmutador_tiff::estimate_tiff_to_jpg_size(&fixture.bytes, 85, 255, 255, 255, 0)
        .expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    assert!((diff / full.len() as f64) < 0.05);
}

#[test]
fn downshift_matches_image_to_rgb8_for_gray16() {
    use image::{ImageBuffer, Luma};
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "gray16_uncompressed")
        .expect("fixture");
    let img = image::load_from_memory(&fixture.bytes).expect("decode tiff");
    let via_image = img.to_rgb8().get_pixel(0, 0)[0];
    let gray: ImageBuffer<Luma<u16>, Vec<u16>> = img.to_luma16();
    let via_formula = downshift_u16_sample_to_u8(gray.get_pixel(0, 0)[0]);
    assert_eq!(via_image, via_formula);
}
