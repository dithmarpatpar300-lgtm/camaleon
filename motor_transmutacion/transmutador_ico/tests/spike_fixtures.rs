//! Programmatic ICO/CUR fixtures for Phase 7.3.0 spike matrix.

use image::codecs::ico::{IcoEncoder, IcoFrame};
use image::{ExtendedColorType, Rgba, RgbaImage};

pub struct Fixture {
    pub name: &'static str,
    pub bytes: Vec<u8>,
}

pub fn all_fixtures() -> Vec<Fixture> {
    vec![
        Fixture {
            name: "single_16_png",
            bytes: single_png_ico(16, 16),
        },
        Fixture {
            name: "multi_size_png",
            bytes: multi_size_png_ico(),
        },
        Fixture {
            name: "rgba_alpha_32",
            bytes: alpha_png_ico(32, 32),
        },
        Fixture {
            name: "cursor_cur",
            bytes: cursor_file_from_ico(single_png_ico(24, 24)),
        },
    ]
}

fn solid_rgba(w: u32, h: u32, color: Rgba<u8>) -> RgbaImage {
    RgbaImage::from_pixel(w, h, color)
}

fn encode_ico(frames: &[IcoFrame<'_>]) -> Vec<u8> {
    let mut buf = Vec::new();
    IcoEncoder::new(&mut buf)
        .encode_images(frames)
        .expect("encode ico");
    buf
}

fn single_png_ico(w: u32, h: u32) -> Vec<u8> {
    let img = solid_rgba(w, h, Rgba([40, 120, 200, 255]));
    let frame = IcoFrame::as_png(img.as_raw(), w, h, ExtendedColorType::Rgba8).expect("frame");
    encode_ico(&[frame])
}

fn multi_size_png_ico() -> Vec<u8> {
    let sizes = [16u32, 32, 256];
    let frames: Vec<IcoFrame<'_>> = sizes
        .iter()
        .map(|&s| {
            let img = solid_rgba(s, s, Rgba([200, 80, 40, 255]));
            IcoFrame::as_png(img.as_raw(), s, s, ExtendedColorType::Rgba8).expect("frame")
        })
        .collect();
    encode_ico(&frames)
}

fn alpha_png_ico(w: u32, h: u32) -> Vec<u8> {
    let img: RgbaImage = RgbaImage::from_fn(w, h, |x, _y| {
        if x < w / 2 {
            Rgba([0, 180, 90, 255])
        } else {
            Rgba([0, 180, 90, 64])
        }
    });
    let frame = IcoFrame::as_png(img.as_raw(), w, h, ExtendedColorType::Rgba8).expect("frame");
    encode_ico(&[frame])
}

/// Rewrite ICO type field to CUR (2) — same directory layout, hotspot fields left zero.
fn cursor_file_from_ico(mut ico: Vec<u8>) -> Vec<u8> {
    if ico.len() >= 4 {
        ico[2] = 2;
        ico[3] = 0;
    }
    ico
}
