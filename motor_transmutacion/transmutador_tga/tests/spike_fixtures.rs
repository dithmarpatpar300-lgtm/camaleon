//! Programmatic TGA fixtures for Phase 7.5.0 spike matrix.

use image::codecs::tga::TgaEncoder;
use image::{ExtendedColorType, ImageEncoder, Rgb, RgbImage, Rgba, RgbaImage};

pub struct Fixture {
    pub name: &'static str,
    pub bytes: Vec<u8>,
}

pub fn all_fixtures() -> Vec<Fixture> {
    vec![
        Fixture {
            name: "rgb24_raw_top_left",
            bytes: encode_tga_rgb_raw(64, 64, false),
        },
        Fixture {
            name: "rgb24_raw_bottom_left",
            bytes: set_bottom_left_origin(encode_tga_rgb_raw(64, 64, false)),
        },
        Fixture {
            name: "rgba32_raw_alpha",
            bytes: encode_tga_rgba_raw(48, 48),
        },
        Fixture {
            name: "rgba32_rle",
            bytes: encode_tga_rgba_rle(48, 48),
        },
        Fixture {
            name: "gray8_raw",
            bytes: encode_tga_gray_raw(32, 32),
        },
        Fixture {
            name: "gray8_rle",
            bytes: encode_tga_gray_rle(32, 32),
        },
        Fixture {
            name: "rgb555_16bit",
            bytes: rgb555_raw_fixture(),
        },
        Fixture {
            name: "indexed_raw",
            bytes: indexed_raw_fixture(),
        },
        Fixture {
            name: "tga2_footer_suffix",
            bytes: append_tga2_footer(encode_tga_rgb_raw(16, 16, false)),
        },
        Fixture {
            name: "orientation_gradient",
            bytes: orientation_gradient_fixture(),
        },
    ]
}

fn encode_tga_rgb_raw(w: u32, h: u32, solid: bool) -> Vec<u8> {
    let img: RgbImage = if solid {
        RgbImage::from_pixel(w, h, Rgb([40, 120, 200]))
    } else {
        RgbImage::from_fn(w, h, |x, y| {
            let v = ((x + y) * 255 / (w + h).max(1)) as u8;
            Rgb([v, 80, 200 - v / 2])
        })
    };
    let mut buf = Vec::new();
    TgaEncoder::new(&mut buf)
        .disable_rle()
        .write_image(img.as_raw(), w, h, ExtendedColorType::Rgb8)
        .expect("encode rgb tga");
    buf
}

fn encode_tga_rgba_raw(w: u32, h: u32) -> Vec<u8> {
    let img: RgbaImage = RgbaImage::from_fn(w, h, |x, _y| {
        if x < w / 2 {
            Rgba([0, 180, 90, 255])
        } else {
            Rgba([0, 180, 90, 64])
        }
    });
    let mut buf = Vec::new();
    TgaEncoder::new(&mut buf)
        .disable_rle()
        .write_image(img.as_raw(), w, h, ExtendedColorType::Rgba8)
        .expect("encode rgba tga");
    buf
}

fn encode_tga_rgba_rle(w: u32, h: u32) -> Vec<u8> {
    let img = RgbaImage::from_pixel(w, h, Rgba([200, 40, 120, 200]));
    let mut buf = Vec::new();
    TgaEncoder::new(&mut buf)
        .write_image(img.as_raw(), w, h, ExtendedColorType::Rgba8)
        .expect("encode rle rgba");
    buf
}

fn encode_tga_gray_raw(w: u32, h: u32) -> Vec<u8> {
    let pixels: Vec<u8> = (0..w * h).map(|i| (i % 256) as u8).collect();
    let mut buf = Vec::new();
    TgaEncoder::new(&mut buf)
        .disable_rle()
        .write_image(&pixels, w, h, ExtendedColorType::L8)
        .expect("encode gray");
    buf
}

fn encode_tga_gray_rle(w: u32, h: u32) -> Vec<u8> {
    let pixels = vec![128u8; (w * h) as usize];
    let mut buf = Vec::new();
    TgaEncoder::new(&mut buf)
        .write_image(&pixels, w, h, ExtendedColorType::L8)
        .expect("encode gray rle");
    buf
}

fn set_bottom_left_origin(mut tga: Vec<u8>) -> Vec<u8> {
    if tga.len() >= 18 {
        tga[17] &= !(1 << 5);
    }
    tga
}

fn rgb555_component(v: u8) -> u16 {
    ((v as u16 * 31) + 127) / 255
}

fn pack_rgb555(r: u8, g: u8, b: u8) -> u16 {
    rgb555_component(r) | (rgb555_component(g) << 5) | (rgb555_component(b) << 10)
}

fn rgb555_raw_fixture() -> Vec<u8> {
    let w = 4u16;
    let h = 4u16;
    let colors = [pack_rgb555(255, 0, 0), pack_rgb555(0, 255, 0), pack_rgb555(0, 0, 255)];
    let mut pixels = Vec::new();
    for i in 0..(w as usize * h as usize) {
        pixels.extend_from_slice(&colors[i % colors.len()].to_le_bytes());
    }
    build_raw_truecolor_header(w, h, 16, 0, &pixels)
}

fn indexed_raw_fixture() -> Vec<u8> {
    let w = 4u16;
    let h = 4u16;
    let palette: [[u8; 3]; 3] = [[255, 0, 0], [0, 255, 0], [0, 0, 255]];
    let indices: [u8; 16] = [
        0, 0, 1, 1, 0, 1, 2, 2, 0, 1, 2, 0, 1, 2, 1, 0,
    ];
    let mut map = Vec::new();
    for rgb in palette {
        map.push(rgb[2]);
        map.push(rgb[1]);
        map.push(rgb[0]);
    }
    let mut out = Vec::new();
    out.push(0);
    out.push(1);
    out.push(1);
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&(palette.len() as u16).to_le_bytes());
    out.push(24);
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&w.to_le_bytes());
    out.extend_from_slice(&h.to_le_bytes());
    out.push(8);
    out.push(0x20);
    out.extend_from_slice(&map);
    out.extend_from_slice(&indices);
    out
}

fn build_raw_truecolor_header(
    w: u16,
    h: u16,
    pixel_depth: u8,
    image_desc: u8,
    pixels: &[u8],
) -> Vec<u8> {
    let mut out = Vec::new();
    out.push(0);
    out.push(0);
    out.push(2);
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.push(0);
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&w.to_le_bytes());
    out.extend_from_slice(&h.to_le_bytes());
    out.push(pixel_depth);
    out.push(image_desc);
    out.extend_from_slice(pixels);
    out
}

fn append_tga2_footer(mut tga: Vec<u8>) -> Vec<u8> {
    tga.extend_from_slice(&0u32.to_le_bytes());
    tga.extend_from_slice(&0u32.to_le_bytes());
    tga.extend_from_slice(b"TRUEVISION-XFILE.\0");
    tga
}

/// 4×4: top row red, bottom row blue in top-left storage order.
fn orientation_gradient_fixture() -> Vec<u8> {
    let w = 4u32;
    let h = 4u32;
    let mut img = RgbImage::new(w, h);
    for y in 0..h {
        for x in 0..w {
            let color = if y == 0 {
                Rgb([255, 0, 0])
            } else if y == h - 1 {
                Rgb([0, 0, 255])
            } else {
                Rgb([128, 128, 128])
            };
            img.put_pixel(x, y, color);
        }
    }
    let mut buf = Vec::new();
    TgaEncoder::new(&mut buf)
        .disable_rle()
        .write_image(img.as_raw(), w, h, ExtendedColorType::Rgb8)
        .expect("orientation fixture");
    set_bottom_left_origin(buf)
}
