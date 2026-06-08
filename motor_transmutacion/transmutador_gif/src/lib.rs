//! GIF → PNG / JPEG transmutator.
//!
//! ## Animated GIF MVP
//! `image::decode` returns the **first frame** only. Multi-frame animation is not merged.
//!
//! ## Color-type policy (PNG)
//! RGBA if source has alpha, RGB otherwise.
//!
//! ## Metadata
//! StripAll (SPEC §5.10).

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{ExtendedColorType, ImageEncoder, ImageReader};
use wasm_bindgen::prelude::*;

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

pub const DEFAULT_QUALITY: u8 = 85;
pub const MIN_QUALITY: u8 = 1;
pub const MAX_QUALITY: u8 = 100;

fn validate_compression(c: u8) -> Result<u8, String> {
    if c == 0 {
        return Err("PNG compression level must be at least 1".into());
    }
    if c > MAX_COMPRESSION {
        return Err(format!(
            "PNG compression level {} exceeds maximum ({})",
            c, MAX_COMPRESSION
        ));
    }
    Ok(c)
}

fn validate_quality(q: u8) -> Result<u8, String> {
    if q == 0 {
        return Err("JPEG quality must be at least 1".into());
    }
    if q > MAX_QUALITY {
        return Err(format!("JPEG quality {} exceeds maximum ({})", q, MAX_QUALITY));
    }
    Ok(q)
}

pub fn flatten_rgba_on_background(
    rgba: &image::RgbaImage,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> image::RgbImage {
    let (w, h) = rgba.dimensions();
    let mut rgb = image::RgbImage::new(w, h);
    let br = bg_r as u32;
    let bg = bg_g as u32;
    let bb = bg_b as u32;
    for (x, y, pixel) in rgba.enumerate_pixels() {
        let a = pixel[3] as u32;
        let inv = 255 - a;
        rgb.put_pixel(
            x,
            y,
            image::Rgb([
                ((a * pixel[0] as u32 + inv * br + 127) / 255) as u8,
                ((a * pixel[1] as u32 + inv * bg + 127) / 255) as u8,
                ((a * pixel[2] as u32 + inv * bb + 127) / 255) as u8,
            ]),
        );
    }
    rgb
}

fn decode_gif_first_frame(input: &[u8]) -> Result<image::DynamicImage, String> {
    ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt GIF data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode GIF: {}", e))
}

fn gif_bytes_to_png_bytes(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    let img = decode_gif_first_frame(input)?;
    let has_alpha = img.color().has_alpha();

    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if has_alpha {
        let rgba = img.to_rgba8();
        encoder
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                ExtendedColorType::Rgba8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(
                rgb.as_raw(),
                rgb.width(),
                rgb.height(),
                ExtendedColorType::Rgb8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }

    Ok(buf.into_inner())
}

pub fn transmutar_gif_a_png_inner(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_compression(compression)?;
    let output = gif_bytes_to_png_bytes(input, compression)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_gif_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_gif_a_png_inner(input_bytes, DEFAULT_COMPRESSION)
}

#[wasm_bindgen]
pub fn transmutar_gif_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
) -> Result<Vec<u8>, String> {
    transmutar_gif_a_png_inner(input_bytes, compression)
}

#[wasm_bindgen]
pub fn estimate_gif_to_png_size(input_bytes: &[u8], compression: u8) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    let img = decode_gif_first_frame(input_bytes)?;
    let has_alpha = img.color().has_alpha();

    let mut writer = CountingWriter::default();
    let encoder = PngEncoder::new_with_quality(
        &mut writer,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if has_alpha {
        let rgba = img.to_rgba8();
        encoder
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                ExtendedColorType::Rgba8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(
                rgb.as_raw(),
                rgb.width(),
                rgb.height(),
                ExtendedColorType::Rgb8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }

    Ok(writer.bytes_written as u32)
}

// ---------------------------------------------------------------------------
// GIF → JPEG exports
// ---------------------------------------------------------------------------

fn gif_bytes_to_jpg_bytes(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    let img = decode_gif_first_frame(input)?;

    let rgb = if img.color().has_alpha() {
        let rgba = img.to_rgba8();
        flatten_rgba_on_background(&rgba, bg_r, bg_g, bg_b)
    } else {
        img.to_rgb8()
    };

    let mut buf = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut buf, quality);
    encoder
        .encode_image(&rgb)
        .map_err(|e| format!("Failed to encode JPEG: {}", e))?;
    Ok(buf.into_inner())
}

pub fn transmutar_gif_a_jpg_inner(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_quality(quality)?;
    let output = gif_bytes_to_jpg_bytes(input, quality, bg_r, bg_g, bg_b)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_gif_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_gif_a_jpg_inner(input_bytes, DEFAULT_QUALITY, 255, 255, 255)
}

#[wasm_bindgen]
pub fn transmutar_gif_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    transmutar_gif_a_jpg_inner(input_bytes, quality, bg_r, bg_g, bg_b)
}

#[wasm_bindgen]
pub fn estimate_gif_to_jpg_size(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_quality(quality)?;
    let img = decode_gif_first_frame(input_bytes)?;

    let rgb = if img.color().has_alpha() {
        let rgba = img.to_rgba8();
        flatten_rgba_on_background(&rgba, bg_r, bg_g, bg_b)
    } else {
        img.to_rgb8()
    };

    let mut writer = CountingWriter::default();
    let mut encoder = JpegEncoder::new_with_quality(&mut writer, quality);
    encoder
        .encode_image(&rgb)
        .map_err(|e| format!("Failed to encode JPEG: {}", e))?;
    Ok(writer.bytes_written as u32)
}
