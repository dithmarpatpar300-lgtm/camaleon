use image::{ImageBuffer, Rgba};
use std::io::Cursor;

use transmutador_webp::{assess_webp_alpha, transmutar_webp_a_jpg_with_options};

fn opaque_rgba_webp() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_fn(16, 16, |x, y| Rgba([(x * 16) as u8, (y * 16) as u8, 64, 255]));
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::WebP).unwrap();
    buf.into_inner()
}

fn real_alpha_webp() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, _| {
        Rgba([255, 0, 0, if x < 8 { 0 } else { 255 }])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::WebP).unwrap();
    buf.into_inner()
}

#[test]
fn assess_opaque_webp_not_meaningful() {
    let webp = opaque_rgba_webp();
    let a = assess_webp_alpha(&webp).expect("assess");
    assert!(!a.has_meaningful_alpha);
}

#[test]
fn encode_opaque_webp_background_invariant() {
    let webp = opaque_rgba_webp();
    assert!(!assess_webp_alpha(&webp).unwrap().has_meaningful_alpha);
    let white = transmutar_webp_a_jpg_with_options(&webp, 85, 255, 255, 255).expect("jpg");
    let black = transmutar_webp_a_jpg_with_options(&webp, 85, 0, 0, 0).expect("jpg");
    assert_eq!(white, black);
}

#[test]
fn encode_meaningful_webp_depends_on_background() {
    let webp = real_alpha_webp();
    assert!(assess_webp_alpha(&webp).unwrap().has_meaningful_alpha);
    let white = transmutar_webp_a_jpg_with_options(&webp, 85, 255, 255, 255).expect("jpg");
    let black = transmutar_webp_a_jpg_with_options(&webp, 85, 0, 0, 0).expect("jpg");
    assert_ne!(white, black);
}
