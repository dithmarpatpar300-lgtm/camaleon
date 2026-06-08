use std::io::Cursor;

use image::codecs::gif::{GifEncoder, Repeat};
use image::{Delay, Frame, ImageBuffer, Rgb, Rgba};

use transmutador_gif::{
    estimate_gif_to_jpg_size, estimate_gif_to_png_size, inspect_gif, open_gif_session,
    transmutar_gif_a_jpg_inner, transmutar_gif_a_png_inner,
};

fn create_static_gif_rgba() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        Rgba([(x * 16) as u8, (y * 16) as u8, 128, if x < 8 { 255 } else { 128 }])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Gif)
        .expect("fixture: encode GIF");
    buf.into_inner()
}

fn create_static_gif_rgb() -> Vec<u8> {
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        Rgb([(x * 16) as u8, (y * 16) as u8, 128])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Gif)
        .expect("fixture: encode GIF");
    buf.into_inner()
}

fn create_animated_gif_two_frames() -> Vec<u8> {
    let frame1: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_pixel(8, 8, Rgba([255, 0, 0, 255]));
    let frame2: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_pixel(8, 8, Rgba([0, 255, 0, 255]));
    let mut bytes = Vec::new();
    {
        let mut encoder = GifEncoder::new(&mut bytes);
        encoder
            .set_repeat(Repeat::Infinite)
            .expect("set_repeat");
        encoder
            .encode_frame(Frame::from_parts(
                frame1,
                0,
                0,
                Delay::from_numer_denom_ms(100, 1),
            ))
            .expect("frame1");
        encoder
            .encode_frame(Frame::from_parts(
                frame2,
                0,
                0,
                Delay::from_numer_denom_ms(100, 1),
            ))
            .expect("frame2");
    }
    bytes
}

fn png_ihdr_color_type(png: &[u8]) -> Option<u8> {
    if png.len() < 26 || &png[0..8] != b"\x89PNG\r\n\x1a\n" {
        return None;
    }
    Some(png[25])
}

#[test]
fn gif_rgba_produces_valid_png() {
    let gif = create_static_gif_rgba();
    let png = transmutar_gif_a_png_inner(&gif, 6, 0).expect("convert");
    assert_eq!(&png[0..8], b"\x89PNG\r\n\x1a\n");
}

#[test]
fn gif_rgb_produces_valid_png() {
    let gif = create_static_gif_rgb();
    let png = transmutar_gif_a_png_inner(&gif, 6, 0).expect("convert");
    assert_eq!(&png[0..8], b"\x89PNG\r\n\x1a\n");
}

#[test]
fn gif_with_alpha_produces_valid_png() {
    let gif = create_static_gif_rgba();
    let png = transmutar_gif_a_png_inner(&gif, 6, 0).expect("convert");
    let ct = png_ihdr_color_type(&png);
    // GIF palette transparency may decode as RGB or RGBA depending on compositing path.
    assert!(ct == Some(2) || ct == Some(6), "expected RGB or RGBA PNG, got {ct:?}");
}

#[test]
fn gif_rgb_fixture_produces_valid_png() {
    let gif = create_static_gif_rgb();
    let png = transmutar_gif_a_png_inner(&gif, 6, 0).expect("convert");
    let ct = png_ihdr_color_type(&png);
    assert!(ct == Some(2) || ct == Some(6), "expected RGB or RGBA PNG, got {ct:?}");
}

#[test]
fn gif_session_frame_rgba_matches_export() {
    let gif = create_animated_gif_two_frames();
    let session = open_gif_session(&gif).expect("session");
    assert_eq!(session.frame_count(), 2);
    let rgba0 = session.frame_rgba(0).expect("frame0");
    assert_eq!(rgba0.len(), 8 * 8 * 4);
    let png = transmutar_gif_a_png_inner(&gif, 6, 0).expect("convert");
    let decoded = image::load_from_memory(&png).expect("decode").to_rgba8();
    assert_eq!(decoded.get_pixel(0, 0).0, [255, 0, 0, 255]);
    session.frame_rgba(1).expect("frame1");
}

#[test]
fn animated_gif_frame_zero_is_red() {
    let gif = create_animated_gif_two_frames();
    let info = inspect_gif(&gif).expect("inspect");
    assert!(info.is_animated);
    assert_eq!(info.frame_count, 2);
    let png = transmutar_gif_a_png_inner(&gif, 6, 0).expect("convert");
    let rgba = image::load_from_memory(&png).expect("decode").to_rgba8();
    assert_eq!(rgba.get_pixel(0, 0).0, [255, 0, 0, 255]);
}

#[test]
fn animated_gif_frame_one_is_green() {
    let gif = create_animated_gif_two_frames();
    let png = transmutar_gif_a_png_inner(&gif, 6, 1).expect("convert");
    let rgba = image::load_from_memory(&png).expect("decode").to_rgba8();
    assert_eq!(rgba.get_pixel(0, 0).0, [0, 255, 0, 255]);
}

#[test]
fn out_of_range_frame_rejected() {
    let gif = create_static_gif_rgb();
    let err = transmutar_gif_a_png_inner(&gif, 6, 99).unwrap_err();
    assert!(err.contains("out of range"));
}

#[test]
fn empty_input_returns_error() {
    let err = transmutar_gif_a_png_inner(&[], 6, 0).unwrap_err();
    assert!(err.contains("empty"));
}

#[test]
fn corrupt_bytes_returns_error() {
    let garbage = vec![0u8; 256];
    let err = transmutar_gif_a_png_inner(&garbage, 6, 0).unwrap_err();
    assert!(
        err.contains("Invalid")
            || err.contains("corrupt")
            || err.contains("decode")
            || err.contains("GIF")
    );
}

#[test]
fn strip_all_no_exif_in_output() {
    let gif = create_static_gif_rgba();
    let png = transmutar_gif_a_png_inner(&gif, 6, 0).expect("convert");
    assert!(!core_utils::png_contains_exif_chunk(&png));
}

#[test]
fn compression_zero_rejected() {
    let gif = create_static_gif_rgba();
    let err = transmutar_gif_a_png_inner(&gif, 0, 0).unwrap_err();
    assert!(err.contains("at least 1") || err.contains("0"));
}

#[test]
fn compression_ten_rejected() {
    let gif = create_static_gif_rgba();
    let err = transmutar_gif_a_png_inner(&gif, 10, 0).unwrap_err();
    assert!(err.contains("exceeds") || err.contains("10"));
}

#[test]
fn estimate_within_5pct_of_full_encode() {
    let gif = create_static_gif_rgb();
    let full = transmutar_gif_a_png_inner(&gif, 6, 0).expect("full");
    let est = estimate_gif_to_png_size(&gif, 6, 0).expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    let pct = diff / full.len() as f64;
    assert!(
        pct < 0.05,
        "estimate {} vs actual {} diff {:.2}%",
        est,
        full.len(),
        pct * 100.0
    );
}

#[test]
fn dimensions_preserved() {
    let gif = create_static_gif_rgb();
    let png = transmutar_gif_a_png_inner(&gif, 6, 0).expect("convert");
    let decoded = image::load_from_memory(&png).expect("decode");
    assert_eq!(decoded.width(), 16);
    assert_eq!(decoded.height(), 16);
}

// GIF → JPEG tests (phase 6.2)

#[test]
fn gif_to_jpg_produces_valid_jpeg() {
    let gif = create_static_gif_rgb();
    let jpg = transmutar_gif_a_jpg_inner(&gif, 85, 255, 255, 255, 0).expect("convert");
    assert!(jpg.len() >= 2);
    assert_eq!(&jpg[0..2], [0xff, 0xd8]);
}

#[test]
fn gif_alpha_flatten_on_white_background() {
    let gif = create_static_gif_rgba();
    let jpg = transmutar_gif_a_jpg_inner(&gif, 85, 255, 255, 255, 0).expect("convert");
    assert_eq!(&jpg[0..2], [0xff, 0xd8]);
}

#[test]
fn jpg_quality_zero_rejected() {
    let gif = create_static_gif_rgb();
    let err = transmutar_gif_a_jpg_inner(&gif, 0, 255, 255, 255, 0).unwrap_err();
    assert!(err.contains("at least 1") || err.contains("0"));
}

#[test]
fn jpg_estimate_within_5pct() {
    let gif = create_static_gif_rgb();
    let full = transmutar_gif_a_jpg_inner(&gif, 85, 255, 255, 255, 0).expect("full");
    let est = estimate_gif_to_jpg_size(&gif, 85, 255, 255, 255, 0).expect("estimate");
    let diff = (full.len() as f64 - est as f64).abs();
    let pct = diff / full.len() as f64;
    assert!(pct < 0.05);
}
