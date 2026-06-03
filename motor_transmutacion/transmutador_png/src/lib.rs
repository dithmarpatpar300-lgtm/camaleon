//! PNG → JPEG transmutator. Decodes PNG, re-encodes as JPEG.
//!
//! ## Alpha flatten policy
//!
//! Default background: **white `#FFFFFF`** (SPEC §5.5.2).
//! RGBA pixels are composited onto the background using standard
//! alpha blending before JPEG encode (JPEG has no alpha channel).
//! Opaque RGB sources are encoded directly without a flatten pass.
//!
//! ## Quality
//!
//! Default JPEG quality: **85** (SPEC §5.5.3). Configurable via
//! `transmutar_png_a_jpg_with_quality` (1–100). The original
//! `transmutar_png_a_jpg` export uses defaults (white background + Q85).
//!
//! ## Background selection
//!
//! Background color for alpha flatten is selectable via
//! `transmutar_png_a_jpg_with_options(bytes, quality, r, g, b)`.
//! Each channel is `u8` (0–255). Default remains white `#FFFFFF`.
//!
//! ## Chroma subsampling
//!
//! The `image` crate `JpegEncoder` (v0.25) defaults to **4:2:0**
//! chroma subsampling, which is appropriate for photographic content
//! (SPEC §5.5.3). A `4:4:4` toggle is deferred post-MVP.
//!
//! ## Metadata
//!
//! StripAll (SPEC §5.10). Decode→encode does not copy source
//! tEXt/eXIf/iCCP chunks.

use std::io::Cursor;

use image::codecs::jpeg::JpegEncoder;
use image::ImageReader;
use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

pub const DEFAULT_JPEG_QUALITY: u8 = 85;
pub const MIN_JPEG_QUALITY: u8 = 1;
pub const MAX_JPEG_QUALITY: u8 = 100;

// ---------------------------------------------------------------------------
// Options types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BackgroundFill {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl BackgroundFill {
    pub const WHITE: BackgroundFill = BackgroundFill {
        r: 255,
        g: 255,
        b: 255,
    };
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PngToJpgOptions {
    pub quality: u8,
    pub background: BackgroundFill,
}

impl Default for PngToJpgOptions {
    fn default() -> Self {
        Self {
            quality: DEFAULT_JPEG_QUALITY,
            background: BackgroundFill::WHITE,
        }
    }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

pub fn validate_quality(quality: u8) -> Result<u8, String> {
    if quality == 0 {
        return Err("JPEG quality must be at least 1".into());
    }
    if quality > MAX_JPEG_QUALITY {
        return Err(format!(
            "JPEG quality {} exceeds maximum ({})",
            quality, MAX_JPEG_QUALITY
        ));
    }
    Ok(quality)
}

// ---------------------------------------------------------------------------
// Alpha flatten
// ---------------------------------------------------------------------------

fn flatten_rgba_on_background(
    rgba: &image::RgbaImage,
    bg: BackgroundFill,
) -> image::RgbImage {
    let (w, h) = rgba.dimensions();
    let mut rgb = image::RgbImage::new(w, h);

    for (x, y, pixel) in rgba.enumerate_pixels() {
        let a = pixel[3] as u32;
        let r = pixel[0] as u32;
        let g = pixel[1] as u32;
        let b = pixel[2] as u32;

        let bg_r = bg.r as u32;
        let bg_g = bg.g as u32;
        let bg_b = bg.b as u32;

        let inv_a = 255 - a;

        let out_r = ((a * r + inv_a * bg_r + 127) / 255) as u8;
        let out_g = ((a * g + inv_a * bg_g + 127) / 255) as u8;
        let out_b = ((a * b + inv_a * bg_b + 127) / 255) as u8;

        rgb.put_pixel(x, y, image::Rgb([out_r, out_g, out_b]));
    }

    rgb
}

// ---------------------------------------------------------------------------
// Core conversion
// ---------------------------------------------------------------------------

pub fn png_bytes_to_jpg_bytes(
    input: &[u8],
    options: &PngToJpgOptions,
) -> Result<Vec<u8>, String> {
    validate_quality(options.quality)?;

    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode PNG: {}", e))?;

    let encoded = if img.color().has_alpha() {
        let rgba = img.to_rgba8();
        let rgb = flatten_rgba_on_background(&rgba, options.background);
        encode_rgb_to_jpeg(&rgb, options.quality)?
    } else {
        encode_rgb_to_jpeg(&img.to_rgb8(), options.quality)?
    };

    Ok(encoded)
}

fn encode_rgb_to_jpeg(rgb: &image::RgbImage, quality: u8) -> Result<Vec<u8>, String> {
    let mut buf = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut buf, quality);
    encoder
        .encode_image(rgb)
        .map_err(|e| format!("Failed to encode JPEG: {}", e))?;
    Ok(buf.into_inner())
}

// ---------------------------------------------------------------------------
// Pipeline wrappers (validation + conversion)
// ---------------------------------------------------------------------------

pub fn transmutar_png_a_jpg_inner(
    input_bytes: &[u8],
    options: &PngToJpgOptions,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input_bytes)?;
    png_bytes_to_jpg_bytes(input_bytes, options)
}

// ---------------------------------------------------------------------------
// Wasm exports (backward-compatible)
// ---------------------------------------------------------------------------

#[wasm_bindgen]
pub fn transmutar_png_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_png_a_jpg_inner(input_bytes, &PngToJpgOptions::default())
}

#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_quality(
    input_bytes: &[u8],
    quality: u8,
) -> Result<Vec<u8>, String> {
    validate_quality(quality)?;
    let options = PngToJpgOptions {
        quality,
        background: BackgroundFill::WHITE,
    };
    transmutar_png_a_jpg_inner(input_bytes, &options)
}

#[wasm_bindgen]
pub fn transmutar_png_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    validate_quality(quality)?;
    let options = PngToJpgOptions {
        quality,
        background: BackgroundFill {
            r: bg_r,
            g: bg_g,
            b: bg_b,
        },
    };
    transmutar_png_a_jpg_inner(input_bytes, &options)
}
