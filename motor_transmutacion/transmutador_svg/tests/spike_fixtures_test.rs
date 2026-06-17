//! Tier 3 Phase 3.3.0 — SVG rasterize spike tests (fixture matrix §7.4).

use std::io::Cursor;

use core_utils::MAX_PIXELS;
use image::codecs::png::PngDecoder;
use image::{DynamicImage, GenericImageView, ImageDecoder};
use transmutador_svg::{
    estimate_svg_to_jpg_inner, estimate_svg_to_png_inner, inspect_svg_meta_inner,
    render_svg_to_rgba, transmutar_svg_a_jpg_inner, transmutar_svg_a_png_inner,
    validate_output_dimensions, validate_svg_input, DEFAULT_COMPRESSION, DEFAULT_QUALITY,
};

fn png_bytes(w: u32, h: u32, rgba: &[u8]) -> Vec<u8> {
    use image::codecs::png::{CompressionType, FilterType, PngEncoder};
    use image::{ExtendedColorType, ImageEncoder};
    let mut buf = Cursor::new(Vec::new());
    PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Default,
        FilterType::Adaptive,
    )
    .write_image(rgba, w, h, ExtendedColorType::Rgba8)
    .expect("png encode");
    buf.into_inner()
}

fn png_data_url(w: u32, h: u32, fill: [u8; 4]) -> String {
    let mut rgba = vec![0u8; (w * h * 4) as usize];
    for px in rgba.chunks_exact_mut(4) {
        px.copy_from_slice(&fill);
    }
    let bytes = png_bytes(w, h, &rgba);
    use base64::Engine;
    format!(
        "data:image/png;base64,{}",
        base64::engine::general_purpose::STANDARD.encode(bytes)
    )
}

fn simple_icon_svg() -> Vec<u8> {
    r#"<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="4" y="4" width="24" height="24" fill="rgb(51,102,204)"/>
</svg>"#
        .as_bytes()
        .to_vec()
}

fn gradient_logo_svg() -> Vec<u8> {
    r#"<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(255,102,0)"/>
      <stop offset="100%" stop-color="rgb(0,102,255)"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#g)"/>
</svg>"#
        .as_bytes()
        .to_vec()
}

fn text_latin_svg() -> Vec<u8> {
    r#"<svg xmlns="http://www.w3.org/2000/svg" width="200" height="48" viewBox="0 0 200 48">
  <text x="8" y="32" font-family="sans-serif" font-size="24" fill="rgb(17,17,17)">Hello SVG</text>
</svg>"#
        .as_bytes()
        .to_vec()
}

fn alpha_mask_svg() -> Vec<u8> {
    r#"<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect x="0" y="0" width="48" height="48" fill="rgb(0,170,85)" fill-opacity="0.4"/>
  <circle cx="24" cy="24" r="16" fill="rgb(204,0,51)" fill-opacity="0.85"/>
</svg>"#
        .as_bytes()
        .to_vec()
}

fn filters_blur_svg() -> Vec<u8> {
    r#"<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <defs>
    <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
  </defs>
  <rect x="10" y="10" width="60" height="60" fill="rgb(136,68,170)" filter="url(#b)"/>
</svg>"#
        .as_bytes()
        .to_vec()
}

fn external_href_svg() -> Vec<u8> {
    br#"<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <image href="https://example.com/logo.png" width="32" height="32"/>
</svg>"#
    .to_vec()
}

fn corrupt_xml_svg() -> Vec<u8> {
    b"<svg><unclosed".to_vec()
}

fn embedded_png_svg() -> Vec<u8> {
    let url = png_data_url(8, 8, [255, 0, 0, 255]);
    format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <image href="{url}" x="8" y="8" width="16" height="16"/>
</svg>"#
    )
    .into_bytes()
}

fn gzip_svg(svg: &[u8]) -> Vec<u8> {
    use std::io::Write;
    let mut enc = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
    enc.write_all(svg).expect("gzip write");
    enc.finish().expect("gzip finish")
}

fn decode_png_rgba(bytes: &[u8]) -> DynamicImage {
    image::load_from_memory(bytes).expect("decode png")
}

fn rgba_has_meaningful_alpha(img: &DynamicImage) -> bool {
    let rgba = img.to_rgba8();
    rgba.pixels().any(|p| p[3] != 0 && p[3] != 255)
}

#[test]
fn empty_input_rejected() {
    assert!(validate_svg_input(&[]).is_err());
}

#[test]
fn corrupt_xml_returns_error() {
    assert!(inspect_svg_meta_inner(&corrupt_xml_svg()).is_err());
}

#[test]
fn external_href_rejected_before_render() {
    let svg = external_href_svg();
    assert!(inspect_svg_meta_inner(&svg).is_err());
    assert!(transmutar_svg_a_png_inner(&svg, 32, 32, DEFAULT_COMPRESSION).is_err());
}

#[test]
fn huge_output_dimensions_rejected() {
    let svg = simple_icon_svg();
    let side = (MAX_PIXELS as f64).sqrt().ceil() as u32 + 1;
    assert!(validate_output_dimensions(side, side).is_err());
    assert!(transmutar_svg_a_png_inner(&svg, side, side, DEFAULT_COMPRESSION).is_err());
}

#[test]
fn simple_icon_meta_and_render() {
    let svg = simple_icon_svg();
    let meta = inspect_svg_meta_inner(&svg).expect("meta");
    assert_eq!(meta.intrinsic_width, 32.0);
    assert_eq!(meta.intrinsic_height, 32.0);
    assert!(meta.has_view_box);

    let png = transmutar_svg_a_png_inner(&svg, 64, 64, DEFAULT_COMPRESSION).expect("png");
    assert_eq!(&png[0..8], b"\x89PNG\r\n\x1a\n");
    let img = decode_png_rgba(&png);
    assert_eq!(img.width(), 64);
    assert_eq!(img.height(), 64);
}

#[test]
fn gradient_logo_renders() {
    let svg = gradient_logo_svg();
    inspect_svg_meta_inner(&svg).expect("meta");
    let rgba = render_svg_to_rgba(&svg, 64, 64).expect("rgba");
    assert_eq!(rgba.len(), 64 * 64 * 4);
    assert!(rgba.iter().any(|&b| b > 0));
}

#[test]
fn text_latin_meta_and_render() {
    let svg = text_latin_svg();
    let meta = inspect_svg_meta_inner(&svg).expect("meta");
    assert!(meta.has_text);

    let png = transmutar_svg_a_png_inner(&svg, 200, 48, DEFAULT_COMPRESSION).expect("png");
    let img = decode_png_rgba(&png);
    assert!(img
        .pixels()
        .any(|(_, _, px)| px[0] < 250 || px[1] < 250 || px[2] < 250));
}

#[test]
fn embedded_png_renders() {
    let svg = embedded_png_svg();
    let meta = inspect_svg_meta_inner(&svg).expect("meta");
    assert_eq!(meta.embedded_raster_count, 1);
    transmutar_svg_a_png_inner(&svg, 32, 32, DEFAULT_COMPRESSION).expect("png");
}

#[test]
fn alpha_mask_png_preserves_alpha() {
    let svg = alpha_mask_svg();
    let png = transmutar_svg_a_png_inner(&svg, 48, 48, DEFAULT_COMPRESSION).expect("png");
    let img = decode_png_rgba(&png);
    assert!(rgba_has_meaningful_alpha(&img));
}

#[test]
fn filters_blur_meta_and_render() {
    let svg = filters_blur_svg();
    let meta = inspect_svg_meta_inner(&svg).expect("meta");
    assert!(meta.has_filters);
    transmutar_svg_a_png_inner(&svg, 80, 80, DEFAULT_COMPRESSION).expect("png");
}

#[test]
fn gzip_svgz_parses_and_renders() {
    let gz = gzip_svg(&simple_icon_svg());
    assert!(validate_svg_input(&gz).is_ok());
    transmutar_svg_a_png_inner(&gz, 32, 32, DEFAULT_COMPRESSION).expect("png from svgz");
}

#[test]
fn jpg_path_flattens_alpha() {
    let svg = alpha_mask_svg();
    let jpg = transmutar_svg_a_jpg_inner(&svg, 48, 48, DEFAULT_QUALITY, 255, 255, 255)
        .expect("jpg");
    assert!(jpg.starts_with(&[0xFF, 0xD8, 0xFF]));
}

#[test]
fn estimate_png_matches_encode() {
    let svg = simple_icon_svg();
    let out = transmutar_svg_a_png_inner(&svg, 64, 64, DEFAULT_COMPRESSION).expect("png");
    let est = estimate_svg_to_png_inner(&svg, 64, 64, DEFAULT_COMPRESSION).expect("est");
    assert_eq!(est as usize, out.len());
}

#[test]
fn estimate_jpg_matches_encode() {
    let svg = simple_icon_svg();
    let out =
        transmutar_svg_a_jpg_inner(&svg, 64, 64, DEFAULT_QUALITY, 255, 255, 255).expect("jpg");
    let est = estimate_svg_to_jpg_inner(&svg, 64, 64, DEFAULT_QUALITY, 255, 255, 255).expect("est");
    assert_eq!(est as usize, out.len());
}

#[test]
fn inspect_meta_does_not_require_output_dimensions() {
    let svg = simple_icon_svg();
    inspect_svg_meta_inner(&svg).expect("meta without render dimensions");
}

#[test]
fn png_decoder_smoke() {
    let svg = simple_icon_svg();
    let png = transmutar_svg_a_png_inner(&svg, 32, 32, DEFAULT_COMPRESSION).expect("png");
    let dec = PngDecoder::new(Cursor::new(png)).expect("decoder");
    assert_eq!(dec.dimensions().0, 32);
}
