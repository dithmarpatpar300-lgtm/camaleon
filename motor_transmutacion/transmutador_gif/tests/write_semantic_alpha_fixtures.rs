//! Run: `cargo test -p transmutador_gif write_semantic_alpha_gif_fixtures -- --ignored --nocapture`

use std::fs;
use std::io::Cursor;
use std::path::PathBuf;

use image::{ImageBuffer, Rgb, Rgba};

fn fixture_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("docs")
        .join("fixtures")
        .join("semantic-alpha")
}

fn write_fixture(name: &str, bytes: Vec<u8>) {
    fs::create_dir_all(fixture_dir()).expect("mkdir");
    let path = fixture_dir().join(name);
    fs::write(&path, bytes).expect("write");
    println!("wrote {}", path.display());
}

fn opaque_gif() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_fn(16, 16, |x, y| Rgba([(x * 16) as u8, (y * 16) as u8, 128, 255]));
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Gif).expect("gif");
    buf.into_inner()
}

fn transparent_gif() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(16, 16, |x, y| {
        Rgba([(x * 16) as u8, (y * 16) as u8, 128, if x < 8 { 255 } else { 0 }])
    });
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Gif).expect("gif");
    buf.into_inner()
}

fn rgb_gif() -> Vec<u8> {
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> =
        ImageBuffer::from_fn(16, 16, |x, y| Rgb([(x * 16) as u8, (y * 16) as u8, 128]));
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Gif).expect("gif");
    buf.into_inner()
}

#[test]
#[ignore = "run manually to refresh gif fixtures"]
fn write_semantic_alpha_gif_fixtures() {
    write_fixture("opaque-gif.gif", opaque_gif());
    write_fixture("transparent-gif.gif", transparent_gif());
    write_fixture("rgb-no-alpha.gif", rgb_gif());
}
