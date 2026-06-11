//! Full AVIF decode via zenavif (rav1d-safe) → `image::DynamicImage` (8-bit RGB/RGBA).

use crate::avif_container::normalize_avif_input;
use crate::avif_probe::{inspect_avif, validate_frame_index};
use image::{DynamicImage, GrayImage, RgbImage, RgbaImage};
use rgb::{RGB8, RGBA8};
use zenavif::{AnimationDecoder, DecoderConfig, PixelBuffer, Unstoppable};

pub fn decode_avif_to_dynamic(input: &[u8]) -> Result<DynamicImage, String> {
    decode_avif_frame_to_dynamic(input, 0)
}

/// Decode a single presentation frame (static AVIF: index 0 only; animated: sequential decode).
pub fn decode_avif_frame_to_dynamic(input: &[u8], frame_index: u32) -> Result<DynamicImage, String> {
    let input = normalize_avif_input(input);
    let info = inspect_avif(&input)?;
    validate_frame_index(info.frame_count, frame_index)?;

    if !info.is_sequence {
        if frame_index != 0 {
            return Err(format!(
                "AVIF frame index {} is out of range (1 frame)",
                frame_index
            ));
        }
        let buffer = zenavif::decode(&input).map_err(|e| {
            crate::avif_diagnose::format_decode_failure(&input, &e.to_string())
        })?;
        return pixel_buffer_to_dynamic(&buffer);
    }

    let mut decoder = AnimationDecoder::new(&input, &DecoderConfig::default())
        .map_err(|e| format!("Failed to open animated AVIF: {}", e))?;

    let target = frame_index as usize;
    for i in 0..=target {
        let frame = decoder
            .next_frame(&Unstoppable)
            .map_err(|e| format!("Failed to decode AVIF frame {}: {}", i, e))?
            .ok_or_else(|| format!("AVIF frame index {} is out of range", frame_index))?;
        if i == target {
            return pixel_buffer_to_dynamic(&frame.pixels);
        }
    }

    Err(format!("AVIF frame index {} is out of range", frame_index))
}

/// Lightweight decode probe — verifies the first requested frame is decodable.
pub fn verify_avif_decodable(input: &[u8]) -> Result<(), String> {
    decode_avif_frame_to_dynamic(input, 0)?;
    Ok(())
}

fn downshift_u16(v: u16) -> u8 {
    ((v as u32 + 128) / 257).min(255) as u8
}

pub(crate) fn pixel_buffer_to_dynamic(buffer: &PixelBuffer) -> Result<DynamicImage, String> {
    let w = buffer.width();
    let h = buffer.height();
    if w == 0 || h == 0 {
        return Err("Decoded AVIF has zero dimensions".into());
    }

    if let Some(pixels) = buffer.as_contiguous_pixels::<RGBA8>() {
        return Ok(rgba8_vec_to_image(pixels, w, h));
    }

    if let Some(pixels) = buffer.as_contiguous_pixels::<RGB8>() {
        return Ok(rgb8_vec_to_image(pixels, w, h));
    }

    let bytes = buffer.copy_to_contiguous_bytes();
    let pixel_count = (w as usize)
        .checked_mul(h as usize)
        .ok_or_else(|| "Decoded AVIF pixel count overflow".to_string())?;
    if pixel_count == 0 {
        return Err("Decoded AVIF has zero pixels".into());
    }
    if !bytes.len().is_multiple_of(pixel_count) {
        return Err(format!(
            "Decoded AVIF byte length {} is not divisible by pixel count {}",
            bytes.len(),
            pixel_count
        ));
    }
    let bpp = bytes.len() / pixel_count;

    match bpp {
        1 => {
            let mut img = GrayImage::new(w, h);
            for (i, &v) in bytes.iter().enumerate() {
                let x = (i as u32) % w;
                let y = (i as u32) / w;
                img.put_pixel(x, y, image::Luma([v]));
            }
            Ok(DynamicImage::ImageLuma8(img))
        }
        2 => {
            let mut img = GrayImage::new(w, h);
            for (i, chunk) in bytes.chunks_exact(2).enumerate() {
                let v = downshift_u16(u16::from_le_bytes([chunk[0], chunk[1]]));
                let x = (i as u32) % w;
                let y = (i as u32) / w;
                img.put_pixel(x, y, image::Luma([v]));
            }
            Ok(DynamicImage::ImageLuma8(img))
        }
        3 => rgb8_bytes_to_image(&bytes, w, h),
        4 => rgba8_bytes_to_image(&bytes, w, h),
        6 => {
            let mut img = RgbImage::new(w, h);
            for (i, chunk) in bytes.chunks_exact(6).enumerate() {
                let r = downshift_u16(u16::from_le_bytes([chunk[0], chunk[1]]));
                let g = downshift_u16(u16::from_le_bytes([chunk[2], chunk[3]]));
                let b = downshift_u16(u16::from_le_bytes([chunk[4], chunk[5]]));
                let x = (i as u32) % w;
                let y = (i as u32) / w;
                img.put_pixel(x, y, image::Rgb([r, g, b]));
            }
            Ok(DynamicImage::ImageRgb8(img))
        }
        8 => {
            let mut img = RgbaImage::new(w, h);
            for (i, chunk) in bytes.chunks_exact(8).enumerate() {
                let r = downshift_u16(u16::from_le_bytes([chunk[0], chunk[1]]));
                let g = downshift_u16(u16::from_le_bytes([chunk[2], chunk[3]]));
                let b = downshift_u16(u16::from_le_bytes([chunk[4], chunk[5]]));
                let a = downshift_u16(u16::from_le_bytes([chunk[6], chunk[7]]));
                let x = (i as u32) % w;
                let y = (i as u32) / w;
                img.put_pixel(x, y, image::Rgba([r, g, b, a]));
            }
            Ok(DynamicImage::ImageRgba8(img))
        }
        _ => Err(format!(
            "Unsupported decoded AVIF pixel layout ({} bytes/pixel)",
            bpp
        )),
    }
}

fn rgba8_vec_to_image(pixels: &[RGBA8], w: u32, h: u32) -> DynamicImage {
    let mut img = RgbaImage::new(w, h);
    for (i, px) in pixels.iter().enumerate() {
        let x = (i as u32) % w;
        let y = (i as u32) / w;
        img.put_pixel(x, y, image::Rgba([px.r, px.g, px.b, px.a]));
    }
    DynamicImage::ImageRgba8(img)
}

fn rgb8_vec_to_image(pixels: &[RGB8], w: u32, h: u32) -> DynamicImage {
    let mut img = RgbImage::new(w, h);
    for (i, px) in pixels.iter().enumerate() {
        let x = (i as u32) % w;
        let y = (i as u32) / w;
        img.put_pixel(x, y, image::Rgb([px.r, px.g, px.b]));
    }
    DynamicImage::ImageRgb8(img)
}

fn rgb8_bytes_to_image(bytes: &[u8], w: u32, h: u32) -> Result<DynamicImage, String> {
    let mut img = RgbImage::new(w, h);
    for (i, chunk) in bytes.chunks_exact(3).enumerate() {
        let x = (i as u32) % w;
        let y = (i as u32) / w;
        img.put_pixel(x, y, image::Rgb([chunk[0], chunk[1], chunk[2]]));
    }
    Ok(DynamicImage::ImageRgb8(img))
}

fn rgba8_bytes_to_image(bytes: &[u8], w: u32, h: u32) -> Result<DynamicImage, String> {
    let mut img = RgbaImage::new(w, h);
    for (i, chunk) in bytes.chunks_exact(4).enumerate() {
        let x = (i as u32) % w;
        let y = (i as u32) / w;
        img.put_pixel(x, y, image::Rgba([chunk[0], chunk[1], chunk[2], chunk[3]]));
    }
    Ok(DynamicImage::ImageRgba8(img))
}
