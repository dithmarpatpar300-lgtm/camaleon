use std::io::Cursor;

use image::{ImageBuffer, ImageReader, Rgb, Rgba};

use transmutador_webp::{
    estimate_webp_to_jpg_size, estimate_webp_to_png_size, transmutar_webp_a_jpg_inner,
    transmutar_webp_a_png_inner,
};

fn create_lossless_webp_rgba() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        let r = (x * 16) as u8;
        let g = (y * 16) as u8;
        let b = 128u8;
        Rgba([r, g, b, 255])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::WebP)
        .expect("fixture: failed to encode lossless WebP");
    buf.into_inner()
}

fn create_lossless_webp_rgb() -> Vec<u8> {
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        let r = (x * 16) as u8;
        let g = (y * 16) as u8;
        let b = 128u8;
        Rgb([r, g, b])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::WebP)
        .expect("fixture: failed to encode lossless RGB WebP");
    buf.into_inner()
}

fn png_ihdr_color_type(png: &[u8]) -> Option<u8> {
    if png.len() < 26 || &png[0..8] != b"\x89PNG\r\n\x1a\n" { return None; }
    Some(png[25])
}

#[test]
fn lossy_webp_produces_valid_png() {
    let webp = create_lossless_webp_rgba();
    let png = transmutar_webp_a_png_inner(&webp, 6).expect("should convert WebP");
    assert!(png.len() > 8);
    assert_eq!(&png[0..8], b"\x89PNG\r\n\x1a\n");
}

#[test]
fn lossless_webp_produces_valid_png() {
    let webp = create_lossless_webp_rgb();
    let png = transmutar_webp_a_png_inner(&webp, 6).expect("should convert WebP");
    assert!(png.len() > 8);
    assert_eq!(&png[0..8], b"\x89PNG\r\n\x1a\n");
}

#[test]
fn webp_with_alpha_produces_rgba_png() {
    let webp = create_lossless_webp_rgba();
    let png = transmutar_webp_a_png_inner(&webp, 6).expect("should convert");
    assert_eq!(png_ihdr_color_type(&png), Some(6));
}

#[test]
fn webp_without_alpha_produces_rgb_png() {
    let webp = create_lossless_webp_rgb();
    let png = transmutar_webp_a_png_inner(&webp, 6).expect("should convert");
    assert_eq!(png_ihdr_color_type(&png), Some(2));
}

#[test]
fn empty_input_returns_error() {
    let err = transmutar_webp_a_png_inner(&[], 6).unwrap_err();
    assert!(err.contains("empty"));
}

#[test]
fn corrupt_bytes_returns_error() {
    let garbage = vec![0u8; 256];
    let err = transmutar_webp_a_png_inner(&garbage, 6).unwrap_err();
    assert!(err.contains("Invalid") || err.contains("corrupt") || err.contains("decode"));
}

#[test]
fn truncated_riff_returns_error() {
    let riff = b"RIFF\x00\x00\x00\x00WEBP";
    let err = transmutar_webp_a_png_inner(riff, 6).unwrap_err();
    assert!(err.contains("Invalid") || err.contains("corrupt") || err.contains("decode"));
}

#[test]
fn strip_all_no_exif_in_output() {
    let webp = create_lossless_webp_rgba();
    let png = transmutar_webp_a_png_inner(&webp, 6).expect("should convert");
    assert!(!core_utils::png_contains_exif_chunk(&png));
}

#[test]
fn compression_zero_rejected() {
    let webp = create_lossless_webp_rgba();
    let err = transmutar_webp_a_png_inner(&webp, 0).unwrap_err();
    assert!(err.contains("at least 1") || err.contains("0"));
}

#[test]
fn compression_ten_rejected() {
    let webp = create_lossless_webp_rgba();
    let err = transmutar_webp_a_png_inner(&webp, 10).unwrap_err();
    assert!(err.contains("exceeds") || err.contains("10"));
}

#[test]
fn estimate_within_5pct_of_full_encode() {
    let webp = create_lossless_webp_rgb();
    let full = transmutar_webp_a_png_inner(&webp, 6).expect("full");
    let est = estimate_webp_to_png_size(&webp, 6).expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    let pct = diff / full.len() as f64;
    assert!(pct < 0.05, "estimate {} vs actual {} diff {:.2}%", est, full.len(), pct * 100.0);
}

#[test]
fn dimensions_preserved() {
    let webp = create_lossless_webp_rgba();
    let png = transmutar_webp_a_png_inner(&webp, 6).expect("should convert");
    let decoded = ImageReader::new(Cursor::new(&png))
        .with_guessed_format().unwrap().decode().unwrap();
    assert_eq!(decoded.width(), 16);
    assert_eq!(decoded.height(), 16);
}

#[test]
fn large_webp_within_limit_passes() {
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> = ImageBuffer::from_fn(256, 256, |_x, _y| Rgb([128, 64, 32]));
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::WebP).expect("encode");
    let webp = buf.into_inner();
    let png = transmutar_webp_a_png_inner(&webp, 6).expect("should convert large");
    assert!(png.len() > 100);
}

// ---------------------------------------------------------------------------
// Phase 5.2 — WebP → JPEG tests
// ---------------------------------------------------------------------------

fn create_transparent_webp() -> Vec<u8> {
    use image::Rgba;
    let img: image::ImageBuffer<Rgba<u8>, Vec<u8>> = image::ImageBuffer::from_fn(1, 1, |_, _| Rgba([255, 0, 0, 128]));
    let mut buf = std::io::Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::WebP).expect("encode transparent WebP");
    buf.into_inner()
}

#[test]
fn lossy_webp_to_jpg_produces_valid_jpeg() {
    let webp = create_lossless_webp_rgba();
    let jpg = transmutar_webp_a_jpg_inner(&webp, 85, 255, 255, 255).expect("should convert");
    assert!(jpg.len() > 2);
    assert_eq!(&jpg[0..2], &[0xFF, 0xD8]);
}

#[test]
fn webp_with_alpha_flattened_on_white() {
    let webp = create_transparent_webp();
    let jpg = transmutar_webp_a_jpg_inner(&webp, 100, 255, 255, 255).expect("should convert");
    let decoded = image::ImageReader::new(std::io::Cursor::new(&jpg))
        .with_guessed_format().unwrap().decode().unwrap().to_rgb8();
    let [r, g, b] = decoded.get_pixel(0, 0).0;
    assert!(r > 200, "red should be high on white bg");
    assert!(g > 100);
    assert!(b > 100);
}

#[test]
fn webp_with_alpha_custom_background_red() {
    let webp = create_transparent_webp();
    let jpg = transmutar_webp_a_jpg_inner(&webp, 100, 255, 0, 0).expect("should convert");
    let decoded = image::ImageReader::new(std::io::Cursor::new(&jpg))
        .with_guessed_format().unwrap().decode().unwrap().to_rgb8();
    let [r, g, b] = decoded.get_pixel(0, 0).0;
    assert!(r > 200);
    assert!(g < 30);
    assert!(b < 30);
}

#[test]
fn quality_zero_rejected() {
    let webp = create_lossless_webp_rgba();
    let err = transmutar_webp_a_jpg_inner(&webp, 0, 255, 255, 255).unwrap_err();
    assert!(err.contains("at least 1") || err.contains("0"));
}

#[test]
fn quality_over_100_rejected() {
    let webp = create_lossless_webp_rgba();
    let err = transmutar_webp_a_jpg_inner(&webp, 101, 255, 255, 255).unwrap_err();
    assert!(err.contains("exceeds") || err.contains("101"));
}

#[test]
fn estimate_webp_to_jpg_within_5pct() {
    let webp = create_lossless_webp_rgb();
    let full = transmutar_webp_a_jpg_inner(&webp, 85, 255, 255, 255).expect("full");
    let est = estimate_webp_to_jpg_size(&webp, 85, 255, 255, 255).expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    let pct = diff / full.len() as f64;
    assert!(pct < 0.05, "est {} vs actual {} diff {:.2}%", est, full.len(), pct * 100.0);
}
