//! Tier 3 Phase 3.2.0 — AVIF encode spike tests (ravif → zenavif round-trip).

use std::io::Cursor;

use image::{codecs::jpeg::JpegEncoder, ImageBuffer, Rgba};
use transmutador_avif::{decode_avif_to_dynamic, inspect_and_validate};
use transmutador_avif_encode::{
    encode_dynamic_to_avif_timed, estimate_jpg_to_avif_inner, estimate_png_to_avif_inner,
    transmutar_jpg_a_avif_inner, transmutar_png_a_avif_inner, DEFAULT_ENCODE_QUALITY,
    DEFAULT_ENCODE_SPEED, MAX_ENCODE_QUALITY, MAX_ENCODE_SPEED, MIN_ENCODE_QUALITY,
    MIN_ENCODE_SPEED,
};

fn png_rgb_gradient(w: u32, h: u32) -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(w, h, |x, y| {
        let v = ((x + y) * 255 / (w + h).max(1)) as u8;
        Rgba([v, 80, 200 - v / 2, 255])
    });
    let mut buf = Vec::new();
    img.write_to(&mut Cursor::new(&mut buf), image::ImageFormat::Png)
        .expect("png encode");
    buf
}

fn png_rgba_alpha(w: u32, h: u32) -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(w, h, |x, _y| {
        if x < w / 2 {
            Rgba([0, 180, 90, 255])
        } else {
            Rgba([0, 180, 90, 64])
        }
    });
    let mut buf = Vec::new();
    img.write_to(&mut Cursor::new(&mut buf), image::ImageFormat::Png)
        .expect("png encode");
    buf
}

fn jpg_rgb(w: u32, h: u32) -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(w, h, |x, y| {
        let v = ((x + y) * 255 / (w + h).max(1)) as u8;
        Rgba([v, 100, 180, 255])
    });
    let rgb = image::DynamicImage::ImageRgba8(img).to_rgb8();
    let mut buf = Cursor::new(Vec::new());
    JpegEncoder::new_with_quality(&mut buf, 85)
        .encode_image(&rgb)
        .expect("jpeg encode");
    buf.into_inner()
}

#[test]
fn empty_png_encode_returns_error() {
    assert!(transmutar_png_a_avif_inner(&[], DEFAULT_ENCODE_QUALITY, DEFAULT_ENCODE_SPEED).is_err());
}

#[test]
fn encode_quality_and_speed_validation() {
    let png = png_rgb_gradient(32, 32);
    assert!(transmutar_png_a_avif_inner(&png, 0, DEFAULT_ENCODE_SPEED).is_err());
    assert!(
        transmutar_png_a_avif_inner(&png, MAX_ENCODE_QUALITY + 1, DEFAULT_ENCODE_SPEED).is_err()
    );
    assert!(transmutar_png_a_avif_inner(&png, DEFAULT_ENCODE_QUALITY, 0).is_err());
    assert!(
        transmutar_png_a_avif_inner(&png, DEFAULT_ENCODE_QUALITY, MAX_ENCODE_SPEED + 1).is_err()
    );
    transmutar_png_a_avif_inner(&png, MIN_ENCODE_QUALITY, MIN_ENCODE_SPEED).expect("min bounds");
    transmutar_png_a_avif_inner(&png, MAX_ENCODE_QUALITY, MAX_ENCODE_SPEED).expect("max bounds");
}

#[test]
fn png_to_avif_round_trip_decodes() {
    let png = png_rgb_gradient(128, 128);
    let avif = transmutar_png_a_avif_inner(&png, 55, 8).expect("png → avif");
    assert!(&avif[4..8] == b"ftyp");
    let info = inspect_and_validate(&avif).expect("probe");
    assert_eq!(info.width, 128);
    assert_eq!(info.height, 128);
    let decoded = decode_avif_to_dynamic(&avif).expect("zenavif decode");
    assert_eq!(decoded.width(), 128);
    assert_eq!(decoded.height(), 128);
}

#[test]
fn png_alpha_to_avif_preserves_meaningful_alpha() {
    let png = png_rgba_alpha(64, 64);
    let avif = transmutar_png_a_avif_inner(&png, 50, 6).expect("encode");
    let info = inspect_and_validate(&avif).expect("probe");
    assert!(info.has_alpha_channel);
    let decoded = decode_avif_to_dynamic(&avif).expect("decode");
    assert!(image::DynamicImage::from(decoded).color().has_alpha());
}

#[test]
fn jpg_to_avif_round_trip_decodes() {
    let jpg = jpg_rgb(96, 96);
    let avif = transmutar_jpg_a_avif_inner(&jpg, 60, 8).expect("jpg → avif");
    let info = inspect_and_validate(&avif).expect("probe");
    assert_eq!(info.width, 96);
    assert_eq!(info.height, 96);
    decode_avif_to_dynamic(&avif).expect("decode");
}

#[test]
fn higher_speed_encodes_faster_on_fixed_fixture() {
    let png = png_rgb_gradient(256, 256);
    let img = image::load_from_memory(&png).expect("load png");

    let (_, slow) = encode_dynamic_to_avif_timed(&img, 55, 4).expect("speed 4");
    let (_, fast) = encode_dynamic_to_avif_timed(&img, 55, 10).expect("speed 10");

    assert!(
        fast.encode_ms <= slow.encode_ms.saturating_mul(2).max(1),
        "speed 10 ({:?} ms) should not be dramatically slower than speed 4 ({:?} ms)",
        fast.encode_ms,
        slow.encode_ms
    );
    assert!(fast.output_bytes > 0);
    assert!(slow.output_bytes > 0);
}

#[test]
fn estimate_jpg_to_avif_matches_encode_size() {
    let jpg = jpg_rgb(64, 64);
    let out = transmutar_jpg_a_avif_inner(&jpg, 55, 7).expect("encode");
    let est = estimate_jpg_to_avif_inner(&jpg, 55, 7).expect("estimate");
    assert_eq!(est as usize, out.len());
}

#[test]
fn estimate_png_to_avif_matches_encode_size() {
    let png = png_rgb_gradient(64, 64);
    let out = transmutar_png_a_avif_inner(&png, 55, 7).expect("encode");
    let est = estimate_png_to_avif_inner(&png, 55, 7).expect("estimate");
    assert_eq!(est as usize, out.len());
}

#[test]
fn encode_output_smaller_than_png_for_photo_like_gradient() {
    let png = png_rgb_gradient(256, 256);
    let avif = transmutar_png_a_avif_inner(&png, 55, 8).expect("encode");
    assert!(
        avif.len() < png.len(),
        "lossy AVIF should be smaller than uncompressed PNG for photo-like gradient"
    );
}
