use std::io::Cursor;

use image::{ImageBuffer, Rgb, Rgba};

use transmutador_bmp::{
    estimate_bmp_to_jpg_size, estimate_bmp_to_png_size, transmutar_bmp_a_jpg_inner,
    transmutar_bmp_a_png_inner,
};

fn create_bmp_rgb() -> Vec<u8> {
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        Rgb([(x * 16) as u8, (y * 16) as u8, 128])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Bmp)
        .expect("fixture: encode BMP");
    buf.into_inner()
}

fn create_bmp_rgba() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        Rgba([(x * 16) as u8, (y * 16) as u8, 128, 200])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Bmp)
        .expect("fixture: encode BMP");
    buf.into_inner()
}

fn png_ihdr_color_type(png: &[u8]) -> Option<u8> {
    if png.len() < 26 || &png[0..8] != b"\x89PNG\r\n\x1a\n" {
        return None;
    }
    Some(png[25])
}

#[test]
fn bmp_rgb_produces_valid_png() {
    let bmp = create_bmp_rgb();
    let png = transmutar_bmp_a_png_inner(&bmp, 6).expect("convert");
    assert_eq!(&png[0..8], b"\x89PNG\r\n\x1a\n");
}

#[test]
fn bmp_rgba_produces_rgba_png() {
    let bmp = create_bmp_rgba();
    let png = transmutar_bmp_a_png_inner(&bmp, 6).expect("convert");
    assert_eq!(png_ihdr_color_type(&png), Some(6));
}

#[test]
fn bmp_rgb_produces_rgb_png() {
    let bmp = create_bmp_rgb();
    let png = transmutar_bmp_a_png_inner(&bmp, 6).expect("convert");
    assert_eq!(png_ihdr_color_type(&png), Some(2));
}

#[test]
fn empty_input_returns_error() {
    let err = transmutar_bmp_a_png_inner(&[], 6).unwrap_err();
    assert!(err.contains("empty"));
}

#[test]
fn corrupt_bytes_returns_error() {
    let garbage = vec![0u8; 64];
    let err = transmutar_bmp_a_png_inner(&garbage, 6).unwrap_err();
    assert!(
        err.contains("Invalid")
            || err.contains("corrupt")
            || err.contains("decode")
            || err.contains("BMP")
    );
}

#[test]
fn strip_all_no_exif_in_output() {
    let bmp = create_bmp_rgb();
    let png = transmutar_bmp_a_png_inner(&bmp, 6).expect("convert");
    assert!(!core_utils::png_contains_exif_chunk(&png));
}

#[test]
fn estimate_within_5pct_of_full_encode() {
    let bmp = create_bmp_rgb();
    let full = transmutar_bmp_a_png_inner(&bmp, 6).expect("full");
    let est = estimate_bmp_to_png_size(&bmp, 6).expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    let pct = diff / full.len() as f64;
    assert!(pct < 0.05);
}

#[test]
fn dimensions_preserved() {
    let bmp = create_bmp_rgb();
    let png = transmutar_bmp_a_png_inner(&bmp, 6).expect("convert");
    let decoded = image::load_from_memory(&png).expect("decode");
    assert_eq!(decoded.width(), 16);
    assert_eq!(decoded.height(), 16);
}

#[test]
fn bmp_to_jpg_produces_valid_jpeg() {
    let bmp = create_bmp_rgb();
    let jpg = transmutar_bmp_a_jpg_inner(&bmp, 85, 255, 255, 255).expect("convert");
    assert_eq!(&jpg[0..2], [0xff, 0xd8]);
}

#[test]
fn bmp_alpha_flatten() {
    let bmp = create_bmp_rgba();
    let jpg = transmutar_bmp_a_jpg_inner(&bmp, 85, 255, 255, 255).expect("convert");
    assert_eq!(&jpg[0..2], [0xff, 0xd8]);
}

#[test]
fn jpg_estimate_within_5pct() {
    let bmp = create_bmp_rgb();
    let full = transmutar_bmp_a_jpg_inner(&bmp, 85, 255, 255, 255).expect("full");
    let est = estimate_bmp_to_jpg_size(&bmp, 85, 255, 255, 255).expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    assert!((diff / full.len() as f64) < 0.05);
}
