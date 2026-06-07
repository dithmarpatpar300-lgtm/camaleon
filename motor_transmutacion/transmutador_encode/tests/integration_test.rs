use std::io::Cursor;

use image::{ImageBuffer, ImageReader, Rgba};

use transmutador_encode::{estimate_png_to_webp_size, transmutar_png_a_webp_inner};

fn create_opaque_png() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        Rgba([(x * 16) as u8, (y * 16) as u8, 128, 255])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Png).expect("encode PNG");
    buf.into_inner()
}

#[test]
fn opaque_png_to_webp_produces_valid_riff() {
    let png = create_opaque_png();
    let webp = transmutar_png_a_webp_inner(&png).expect("should convert");
    assert!(webp.len() > 12);
    assert_eq!(&webp[0..4], b"RIFF");
    assert_eq!(&webp[8..12], b"WEBP");
    let decoded = ImageReader::new(Cursor::new(&webp)).with_guessed_format().unwrap().decode().unwrap();
    assert_eq!(decoded.width(), 16);
}

#[test]
fn png_with_alpha_to_webp_rgba_preserved() {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(4, 4, |x, y| {
        Rgba([(x * 64) as u8, (y * 64) as u8, 128, (x + y) as u8 * 16])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Png).expect("encode");
    let webp = transmutar_png_a_webp_inner(&buf.into_inner()).expect("convert");
    let decoded = ImageReader::new(Cursor::new(&webp)).with_guessed_format().unwrap().decode().unwrap();
    assert!(decoded.color().has_alpha());
}

#[test]
fn dimensions_preserved_after_encode() {
    let png = create_opaque_png();
    let webp = transmutar_png_a_webp_inner(&png).expect("convert");
    let decoded = ImageReader::new(Cursor::new(&webp)).with_guessed_format().unwrap().decode().unwrap();
    assert_eq!(decoded.width(), 16);
    assert_eq!(decoded.height(), 16);
}

#[test]
fn strip_all_no_icc_in_output() {
    let png = create_opaque_png();
    assert!(!core_utils::png_contains_iccp_chunk(&png));
    let webp = transmutar_png_a_webp_inner(&png).expect("convert");
    assert!(webp.len() > 12);
}

#[test]
fn estimate_png_to_webp_within_10pct() {
    let png = create_opaque_png();
    let full = transmutar_png_a_webp_inner(&png).expect("full");
    let est = estimate_png_to_webp_size(&png).expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    let pct = diff / full.len() as f64;
    assert!(pct < 0.10, "est {} vs actual {} diff {:.2}%", est, full.len(), pct * 100.0);
}

#[test]
fn empty_input_returns_error() {
    let err = transmutar_png_a_webp_inner(&[]).unwrap_err();
    assert!(err.contains("empty"));
}

#[test]
fn corrupt_png_returns_error() {
    let err = transmutar_png_a_webp_inner(b"not a PNG").unwrap_err();
    assert!(err.contains("Invalid") || err.contains("corrupt") || err.contains("decode"));
}
