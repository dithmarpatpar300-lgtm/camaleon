//! Programmatic AVIF fixtures for Tier 3 Phase 3.1.0 spike (encoded via ravif in tests).

use imgref::ImgVec;
use ravif::{BitDepth, Encoder, RGBA8};

pub struct Fixture {
    pub name: &'static str,
    pub bytes: Vec<u8>,
}

pub fn all_fixtures() -> Vec<Fixture> {
    vec![
        Fixture {
            name: "rgb8_lossy",
            bytes: encode_avif_rgb_lossy(64, 64),
        },
        Fixture {
            name: "rgba_alpha_aux",
            bytes: encode_avif_rgba_alpha(48, 48),
        },
        Fixture {
            name: "opaque_rgba",
            bytes: encode_avif_opaque_rgba(32, 32),
        },
        Fixture {
            name: "lossless_graphic",
            bytes: encode_avif_lossless_small(24, 24),
        },
        Fixture {
            name: "rgb8_10bit",
            bytes: encode_avif_10bit(16, 16),
        },
    ]
}

pub fn corrupt_truncated() -> Vec<u8> {
    let mut bytes = encode_avif_rgb_lossy(8, 8);
    bytes.truncate(bytes.len() / 3);
    bytes
}

fn encode_avif_rgb_lossy(w: usize, h: usize) -> Vec<u8> {
    let pixels: Vec<RGBA8> = (0..h)
        .flat_map(|y| {
            (0..w).map(move |x| {
                let v = ((x + y) * 255 / (w + h).max(1)) as u8;
                RGBA8::new(v, 80, 200 - v / 2, 255)
            })
        })
        .collect();
    let img = ImgVec::new(pixels, w, h);
    Encoder::new()
        .with_quality(55.0)
        .with_speed(8)
        .encode_rgba(img.as_ref())
        .expect("encode rgb8_lossy")
        .avif_file
}

fn encode_avif_rgba_alpha(w: usize, h: usize) -> Vec<u8> {
    let pixels: Vec<RGBA8> = (0..h)
        .flat_map(|_y| {
            (0..w).map(move |x| {
                if x < w / 2 {
                    RGBA8::new(0, 180, 90, 255)
                } else {
                    RGBA8::new(0, 180, 90, 64)
                }
            })
        })
        .collect();
    let img = ImgVec::new(pixels, w, h);
    Encoder::new()
        .with_quality(50.0)
        .with_speed(6)
        .with_alpha_quality(50.0)
        .encode_rgba(img.as_ref())
        .expect("encode rgba_alpha")
        .avif_file
}

fn encode_avif_opaque_rgba(w: usize, h: usize) -> Vec<u8> {
    let pixels = vec![RGBA8::new(40, 120, 200, 255); w * h];
    let img = ImgVec::new(pixels, w, h);
    Encoder::new()
        .with_quality(60.0)
        .with_speed(8)
        .encode_rgba(img.as_ref())
        .expect("encode opaque_rgba")
        .avif_file
}

fn encode_avif_lossless_small(w: usize, h: usize) -> Vec<u8> {
    let pixels: Vec<RGBA8> = (0..h)
        .flat_map(|y| (0..w).map(move |x| RGBA8::new(x as u8 * 10, y as u8 * 10, 128, 255)))
        .collect();
    let img = ImgVec::new(pixels, w, h);
    Encoder::new()
        .with_quality(100.0)
        .with_speed(2)
        .encode_rgba(img.as_ref())
        .expect("encode lossless_graphic")
        .avif_file
}

fn encode_avif_10bit(w: usize, h: usize) -> Vec<u8> {
    let pixels: Vec<RGBA8> = (0..h)
        .flat_map(|y| {
            (0..w).map(move |x| RGBA8::new(x as u8 * 15, y as u8 * 15, 200, 255))
        })
        .collect();
    let img = ImgVec::new(pixels, w, h);
    Encoder::new()
        .with_quality(70.0)
        .with_speed(6)
        .with_bit_depth(BitDepth::Ten)
        .encode_rgba(img.as_ref())
        .expect("encode 10bit")
        .avif_file
}
