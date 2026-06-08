//! BMP → PNG / JPEG transmutator.
//!
//! BMP sources are typically uncompressed; PNG output may be larger or smaller
//! depending on content. JPEG output is always lossy.

mod bmp_probe;

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use core_utils::semantic_alpha::{dynamic_image_has_meaningful_alpha, AlphaAssessment, AlphaAssessmentJs};
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

pub use bmp_probe::{inspect_bmp, BmpInfo};

#[wasm_bindgen]
pub struct BmpMeta {
    width: u32,
    height: u32,
    bit_count: u16,
    compression: u32,
    has_meaningful_alpha: bool,
}

#[wasm_bindgen]
impl BmpMeta {
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.height
    }

    #[wasm_bindgen(getter)]
    pub fn bit_count(&self) -> u16 {
        self.bit_count
    }

    #[wasm_bindgen(getter)]
    pub fn compression(&self) -> u32 {
        self.compression
    }

    #[wasm_bindgen(getter)]
    pub fn has_meaningful_alpha(&self) -> bool {
        self.has_meaningful_alpha
    }
}

fn info_to_meta(info: BmpInfo) -> BmpMeta {
    BmpMeta {
        width: info.width,
        height: info.height,
        bit_count: info.bit_count,
        compression: info.compression,
        has_meaningful_alpha: info.has_meaningful_alpha,
    }
}

#[wasm_bindgen]
pub fn inspect_bmp_meta(input_bytes: &[u8]) -> Result<BmpMeta, String> {
    core_utils::validate_input(input_bytes)?;
    Ok(info_to_meta(inspect_bmp(input_bytes)?))
}

pub fn assess_bmp_alpha(input: &[u8]) -> Result<AlphaAssessment, String> {
    core_utils::validate_input(input)?;
    let info = inspect_bmp(input)?;
    let has_channel = info.bit_count == 32;
    if !has_channel {
        return Ok(AlphaAssessment::OPAQUE);
    }
    Ok(AlphaAssessment::sampled(true, info.has_meaningful_alpha))
}

#[wasm_bindgen]
pub fn assess_alpha(input_bytes: &[u8]) -> Result<AlphaAssessmentJs, String> {
    Ok(AlphaAssessmentJs::from_assessment(assess_bmp_alpha(input_bytes)?))
}

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

fn decode_bmp(input: &[u8]) -> Result<image::DynamicImage, String> {
    ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt BMP data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode BMP: {}", e))
}

fn bmp_bytes_to_png_bytes(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    let img = decode_bmp(input)?;
    let meaningful_alpha = dynamic_image_has_meaningful_alpha(&img);

    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if meaningful_alpha {
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

pub fn transmutar_bmp_a_png_inner(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_compression(compression)?;
    let output = bmp_bytes_to_png_bytes(input, compression)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_bmp_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_bmp_a_png_inner(input_bytes, DEFAULT_COMPRESSION)
}

#[wasm_bindgen]
pub fn transmutar_bmp_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
) -> Result<Vec<u8>, String> {
    transmutar_bmp_a_png_inner(input_bytes, compression)
}

#[wasm_bindgen]
pub fn estimate_bmp_to_png_size(input_bytes: &[u8], compression: u8) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    let img = decode_bmp(input_bytes)?;
    let meaningful_alpha = dynamic_image_has_meaningful_alpha(&img);

    let mut writer = CountingWriter::default();
    let encoder = PngEncoder::new_with_quality(
        &mut writer,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if meaningful_alpha {
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

fn bmp_bytes_to_jpg_bytes(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    let img = decode_bmp(input)?;

    let rgb = if dynamic_image_has_meaningful_alpha(&img) {
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

pub fn transmutar_bmp_a_jpg_inner(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_quality(quality)?;
    let output = bmp_bytes_to_jpg_bytes(input, quality, bg_r, bg_g, bg_b)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_bmp_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_bmp_a_jpg_inner(input_bytes, DEFAULT_QUALITY, 255, 255, 255)
}

#[wasm_bindgen]
pub fn transmutar_bmp_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    transmutar_bmp_a_jpg_inner(input_bytes, quality, bg_r, bg_g, bg_b)
}

#[wasm_bindgen]
pub fn estimate_bmp_to_jpg_size(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_quality(quality)?;
    let img = decode_bmp(input_bytes)?;

    let rgb = if dynamic_image_has_meaningful_alpha(&img) {
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

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32) {
    core_utils::set_session_max_input_bytes(max_bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}
