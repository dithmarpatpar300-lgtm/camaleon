//! Contract: assess meaningful alpha agrees with encode flatten decision.

use image::{ImageBuffer, Rgba};
use std::io::Cursor;

use transmutador_png::{
    assess_png_alpha, transmutar_png_a_jpg_inner, BackgroundFill, PngToJpgOptions,
};

fn opaque_rgba_png() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_fn(16, 16, |x, y| Rgba([(x * 16) as u8, (y * 16) as u8, 64, 255]));
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Png).unwrap();
    buf.into_inner()
}

fn real_alpha_png() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_pixel(4, 4, Rgba([255, 0, 0, 64]));
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Png).unwrap();
    buf.into_inner()
}

#[test]
fn assess_opaque_rgba_png_not_meaningful() {
    let png = opaque_rgba_png();
    let a = assess_png_alpha(&png).expect("assess");
    assert!(a.has_alpha_channel);
    assert!(!a.has_meaningful_alpha);
}

#[test]
fn assess_real_alpha_png_is_meaningful() {
    let png = real_alpha_png();
    let a = assess_png_alpha(&png).expect("assess");
    assert!(a.has_meaningful_alpha);
}

#[test]
fn encode_skips_flatten_when_assess_opaque() {
    let png = opaque_rgba_png();
    assert!(!assess_png_alpha(&png).unwrap().has_meaningful_alpha);

    let white = transmutar_png_a_jpg_inner(
        &png,
        &PngToJpgOptions {
            quality: 85,
            background: BackgroundFill::WHITE,
        },
    )
    .expect("jpg");
    let black = transmutar_png_a_jpg_inner(
        &png,
        &PngToJpgOptions {
            quality: 85,
            background: BackgroundFill { r: 0, g: 0, b: 0 },
        },
    )
    .expect("jpg");
    assert_eq!(white, black, "opaque RGBA must not depend on background");
}

#[test]
fn encode_flattens_when_assess_meaningful() {
    let png = real_alpha_png();
    assert!(assess_png_alpha(&png).unwrap().has_meaningful_alpha);

    let white = transmutar_png_a_jpg_inner(
        &png,
        &PngToJpgOptions {
            quality: 85,
            background: BackgroundFill::WHITE,
        },
    )
    .expect("jpg");
    let black = transmutar_png_a_jpg_inner(
        &png,
        &PngToJpgOptions {
            quality: 85,
            background: BackgroundFill { r: 0, g: 0, b: 0 },
        },
    )
    .expect("jpg");
    assert_ne!(white, black, "meaningful alpha must depend on background");
}
