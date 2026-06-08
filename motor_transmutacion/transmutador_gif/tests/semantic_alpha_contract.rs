use std::io::Cursor;

use image::{ImageBuffer, Rgb, Rgba};

use transmutador_gif::{assess_gif_alpha, transmutar_gif_a_jpg_inner};

fn opaque_gif() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_fn(16, 16, |x, y| Rgba([(x * 16) as u8, (y * 16) as u8, 128, 255]));
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Gif).unwrap();
    buf.into_inner()
}

fn transparent_gif() -> Vec<u8> {
    // GIF supports binary transparency only — use fully transparent pixels (α=0), not partial alpha.
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        Rgba([(x * 16) as u8, (y * 16) as u8, 128, if x < 8 { 255 } else { 0 }])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Gif).unwrap();
    buf.into_inner()
}

fn rgb_gif() -> Vec<u8> {
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> =
        ImageBuffer::from_fn(16, 16, |x, y| Rgb([(x * 16) as u8, (y * 16) as u8, 128]));
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Gif).unwrap();
    buf.into_inner()
}

#[test]
fn assess_rgb_gif_opaque() {
    let gif = rgb_gif();
    let a = assess_gif_alpha(&gif).expect("assess");
    assert!(!a.has_meaningful_alpha);
}

#[test]
fn assess_transparent_gif_meaningful() {
    let gif = transparent_gif();
    let a = assess_gif_alpha(&gif).expect("assess");
    assert!(a.has_meaningful_alpha);
}

#[test]
fn encode_opaque_gif_background_invariant() {
    let gif = opaque_gif();
    assert!(!assess_gif_alpha(&gif).unwrap().has_meaningful_alpha);
    let white = transmutar_gif_a_jpg_inner(&gif, 85, 255, 255, 255, 0).expect("jpg");
    let black = transmutar_gif_a_jpg_inner(&gif, 85, 0, 0, 0, 0).expect("jpg");
    assert_eq!(white, black);
}
