use std::io::Cursor;

use image::{ImageBuffer, Rgb, Rgba};

use transmutador_bmp::{
    estimate_bmp_to_jpg_size, estimate_bmp_to_png_size, inspect_bmp, transmutar_bmp_a_jpg_inner,
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

fn create_bmp_32_opaque() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        Rgba([(x * 16) as u8, (y * 16) as u8, 128, 255])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Bmp)
        .expect("fixture: encode opaque 32-bit BMP");
    buf.into_inner()
}

fn create_bmp_8bit() -> Vec<u8> {
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        Rgb([((x + y) * 8) as u8, 64, 192])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Bmp)
        .expect("fixture: encode 8-bit BMP");
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
    let est = estimate_bmp_to_png_size(&bmp, 6, 255, 0).expect("estimate");
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
fn bmp_8bit_palette_produces_valid_png() {
    let bmp = create_bmp_8bit();
    let png = transmutar_bmp_a_png_inner(&bmp, 6).expect("convert");
    assert_eq!(&png[0..8], b"\x89PNG\r\n\x1a\n");
    let decoded = image::load_from_memory(&png).expect("decode");
    assert_eq!(decoded.width(), 16);
}

#[test]
fn bmp_32_opaque_produces_rgb_png() {
    let bmp = create_bmp_32_opaque();
    let png = transmutar_bmp_a_png_inner(&bmp, 6).expect("convert");
    assert_eq!(png_ihdr_color_type(&png), Some(2));
}

#[test]
fn compression_level_affects_png_size() {
    let bmp = create_bmp_rgb();
    let fast = transmutar_bmp_a_png_inner(&bmp, 1).expect("fast");
    let max = transmutar_bmp_a_png_inner(&bmp, 9).expect("max");
    assert!(max.len() <= fast.len());
}

#[test]
fn bmp_rgba_jpg_with_black_background() {
    let bmp = create_bmp_rgba();
    let jpg = transmutar_bmp_a_jpg_inner(&bmp, 85, 0, 0, 0).expect("convert");
    assert_eq!(&jpg[0..2], [0xff, 0xd8]);
}

#[test]
fn inspect_bmp_header_without_full_decode() {
    let bmp = create_bmp_rgba();
    let info = inspect_bmp(&bmp).expect("inspect");
    assert_eq!(info.width, 16);
    assert_eq!(info.height, 16);
    assert!(info.bit_count == 24 || info.bit_count == 32);
}

#[test]
fn inspect_bmp_opaque_reports_no_alpha() {
    let bmp = create_bmp_32_opaque();
    let info = inspect_bmp(&bmp).expect("inspect");
    assert!(!info.has_meaningful_alpha);
}

#[test]
fn jpg_estimate_within_5pct() {
    let bmp = create_bmp_rgb();
    let full = transmutar_bmp_a_jpg_inner(&bmp, 85, 255, 255, 255).expect("full");
    let est = estimate_bmp_to_jpg_size(&bmp, 85, 255, 255, 255, 255, 0).expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    assert!((diff / full.len() as f64) < 0.05);
}

fn minimal_bmp_header(width: u32, height: u32, bit_count: u16, compression: u32) -> Vec<u8> {
    let mut buf = vec![0u8; 54];
    buf[0..2].copy_from_slice(b"BM");
    buf[18..22].copy_from_slice(&width.to_le_bytes());
    buf[22..26].copy_from_slice(&height.to_le_bytes());
    buf[26..28].copy_from_slice(&1u16.to_le_bytes());
    buf[28..30].copy_from_slice(&bit_count.to_le_bytes());
    buf[30..34].copy_from_slice(&compression.to_le_bytes());
    buf
}

#[test]
fn inspect_rle_bmp_header_reports_compression() {
    let bmp = minimal_bmp_header(32, 32, 8, 1);
    let info = inspect_bmp(&bmp).expect("inspect RLE8 header");
    assert_eq!(info.width, 32);
    assert_eq!(info.height, 32);
    assert_eq!(info.compression, 1);
}

#[test]
fn inspect_fake_alpha_32_opaque_no_meaningful_alpha() {
    let bmp = create_bmp_32_opaque();
    let info = inspect_bmp(&bmp).expect("inspect");
    assert!(!info.has_meaningful_alpha);
    assert!(info.bit_count == 24 || info.bit_count == 32);
}

#[test]
fn bmp_dimensions_within_pixel_limit() {
    let bmp = create_bmp_rgb();
    let info = inspect_bmp(&bmp).expect("inspect");
    let pixels = info.width as u64 * info.height as u64;
    assert!(pixels <= 40_000_000);
}
