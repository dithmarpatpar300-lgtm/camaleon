//! Programmatic TIFF fixtures for Phase 7.0 spike matrix.

use std::io::Cursor;

use image::codecs::tiff::TiffEncoder as ImageTiffEncoder;
use image::{ExtendedColorType, ImageBuffer, ImageEncoder, Rgba};
use tiff::encoder::{colortype, Compression, TiffEncoder};
use tiff::tags::{PhotometricInterpretation, Tag};

pub struct Fixture {
    pub name: &'static str,
    pub bytes: Vec<u8>,
}

pub fn all_fixtures() -> Vec<Fixture> {
    vec![
        Fixture {
            name: "rgb8_uncompressed",
            bytes: rgb8_uncompressed(16, 16),
        },
        Fixture {
            name: "gray16_uncompressed",
            bytes: gray16_uncompressed(8, 8),
        },
        Fixture {
            name: "palette_indexed",
            bytes: palette_indexed_4x4(),
        },
        Fixture {
            name: "lzw_rgb8",
            bytes: lzw_rgb8(12, 12),
        },
        Fixture {
            name: "rgba_alpha",
            bytes: rgba_alpha(16, 16),
        },
        Fixture {
            name: "multipage_2_ifd",
            bytes: multipage_two_ifd(),
        },
    ]
}

fn rgb8_uncompressed(w: u32, h: u32) -> Vec<u8> {
    let data: Vec<u8> = (0..(w * h * 3))
        .map(|i| ((i * 53) % 256) as u8)
        .collect();
    let mut buf = Cursor::new(Vec::new());
    let mut enc = TiffEncoder::new(&mut buf).expect("encoder");
    enc.write_image::<colortype::RGB8>(w, h, &data)
        .expect("rgb8");
    buf.into_inner()
}

fn gray16_uncompressed(w: u32, h: u32) -> Vec<u8> {
    let data: Vec<u16> = (0..(w * h))
        .map(|i| (i * 1024 % 65536) as u16)
        .collect();
    let mut buf = Cursor::new(Vec::new());
    let mut enc = TiffEncoder::new(&mut buf).expect("encoder");
    enc.write_image::<colortype::Gray16>(w, h, &data)
        .expect("gray16");
    buf.into_inner()
}

fn lzw_rgb8(w: u32, h: u32) -> Vec<u8> {
    let data: Vec<u8> = (0..(w * h * 3))
        .map(|i| ((i * 17) % 256) as u8)
        .collect();
    let mut buf = Cursor::new(Vec::new());
    let enc = TiffEncoder::new(&mut buf).expect("encoder");
    enc.with_compression(Compression::Lzw)
        .write_image::<colortype::RGB8>(w, h, &data)
        .expect("lzw rgb8");
    buf.into_inner()
}

fn rgba_alpha(w: u32, h: u32) -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(w, h, |x, y| {
        let a = if x < w / 2 { 255 } else { 128 };
        Rgba([(x * 16) as u8, (y * 16) as u8, 64, a])
    });
    let mut buf = Cursor::new(Vec::new());
    let enc = ImageTiffEncoder::new(&mut buf);
    enc.write_image(
        img.as_raw(),
        w,
        h,
        ExtendedColorType::Rgba8,
    )
    .expect("rgba encode");
    buf.into_inner()
}

fn multipage_two_ifd() -> Vec<u8> {
    let page0: Vec<u8> = vec![10, 20, 30, 40];
    let page1: Vec<u8> = vec![100, 110, 120, 130, 140, 150, 160, 170, 180];
    let mut buf = Cursor::new(Vec::new());
    let mut enc = TiffEncoder::new(&mut buf).expect("encoder");
    enc.write_image::<colortype::Gray8>(2, 2, &page0)
        .expect("page0");
    enc.write_image::<colortype::Gray8>(3, 3, &page1)
        .expect("page1");
    buf.into_inner()
}

/// 4×4 indexed image with 16-entry color map (photometric = palette).
fn palette_indexed_4x4() -> Vec<u8> {
    let indices: Vec<u8> = (0..16).map(|i| i as u8).collect();
    // TIFF ColorMap: 16 colors × 3 channels × 16-bit big-endian component (0..65535 scale).
    let mut color_map: Vec<u16> = Vec::with_capacity(16 * 3);
    for i in 0..16u16 {
        color_map.push(i * 4096);
        color_map.push(32768);
        color_map.push(65535 - i * 4096);
    }

    let mut buf = Cursor::new(Vec::new());
    let mut enc = TiffEncoder::new(&mut buf).expect("encoder");
    {
        let mut image = enc.new_image::<colortype::Gray8>(4, 4).expect("new_image");
        image
            .encoder()
            .write_tag(
                Tag::PhotometricInterpretation,
                PhotometricInterpretation::RGBPalette.to_u16(),
            )
            .expect("photometric");
        image
            .encoder()
            .write_tag(Tag::ColorMap, color_map.as_slice())
            .expect("colormap");
        image.write_data(&indices).expect("indices");
    }
    buf.into_inner()
}
