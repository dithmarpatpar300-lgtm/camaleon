//! Writes committed fixtures to `docs/fixtures/semantic-alpha/`.
//! Run: `cargo test -p core_utils write_semantic_alpha_fixtures -- --ignored --nocapture`

use std::fs;
use std::io::Cursor;
use std::path::PathBuf;

use image::{ImageBuffer, ImageFormat, Rgba};

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
    let path = fixture_dir().join(name);
    fs::write(&path, bytes).expect("write fixture");
    println!("wrote {}", path.display());
}

fn encode_rgba_png(rgba_fn: impl Fn(u32, u32) -> Rgba<u8>) -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(32, 32, rgba_fn);
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, ImageFormat::Png).expect("png encode");
    buf.into_inner()
}

fn encode_rgba_webp(rgba_fn: impl Fn(u32, u32) -> Rgba<u8>) -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(32, 32, rgba_fn);
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, ImageFormat::WebP).expect("webp encode");
    buf.into_inner()
}

#[test]
#[ignore = "run manually to refresh docs/fixtures/semantic-alpha/*"]
fn write_semantic_alpha_fixtures() {
    fs::create_dir_all(fixture_dir()).expect("mkdir fixtures");

    write_fixture(
        "opaque-rgba.png",
        encode_rgba_png(|x, y| Rgba([(x * 8) as u8, (y * 8) as u8, 64, 255])),
    );

    write_fixture(
        "real-alpha.png",
        encode_rgba_png(|x, _| {
            if x < 16 {
                Rgba([255, 0, 0, 128])
            } else {
                Rgba([0, 255, 0, 255])
            }
        }),
    );

    write_fixture(
        "opaque-rgba.webp",
        encode_rgba_webp(|x, y| Rgba([(x * 8) as u8, (y * 8) as u8, 64, 255])),
    );

    write_fixture(
        "real-alpha.webp",
        encode_rgba_webp(|x, _| {
            if x < 16 {
                Rgba([255, 0, 0, 128])
            } else {
                Rgba([0, 255, 0, 255])
            }
        }),
    );
}
