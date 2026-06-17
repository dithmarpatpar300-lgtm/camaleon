//! SVG → PNG/JPEG rasterizer (Tier 3 Phase 3.3).
//!
//! Parse + normalize via `usvg`, render via `resvg` → re-encode with `image` crate.
//! Spike backend: resvg 0.44 / usvg 0.44 (Micro SVG subset).

mod fonts;
mod rasterize;
mod svg_meta;
mod svg_validate;

use std::io::Cursor;

use core_utils::flatten_rgba::flatten_rgba_on_background;
use core_utils::semantic_alpha::dynamic_image_has_meaningful_alpha;
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{DynamicImage, ExtendedColorType, ImageEncoder, RgbImage};
use wasm_bindgen::prelude::*;

pub use rasterize::render_svg_to_rgba;
pub use svg_meta::{inspect_svg_meta_inner, SvgMeta, SvgMetaJs};
pub use svg_validate::{looks_like_svg, validate_output_dimensions, validate_svg_input};

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

pub const DEFAULT_QUALITY: u8 = 85;
pub const MIN_QUALITY: u8 = 1;
pub const MAX_QUALITY: u8 = 100;

fn validate_compression(c: u8) -> Result<u8, String> {
    if c < MIN_COMPRESSION {
        return Err(format!("PNG compression level must be at least {}", MIN_COMPRESSION));
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
    if q < MIN_QUALITY {
        return Err(format!("JPEG quality must be at least {}", MIN_QUALITY));
    }
    if q > MAX_QUALITY {
        return Err(format!(
            "JPEG quality {} exceeds maximum ({})",
            q, MAX_QUALITY
        ));
    }
    Ok(q)
}

fn encode_rgba_to_png(rgba: &[u8], w: u32, h: u32, compression: u8) -> Result<Vec<u8>, String> {
    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );
    encoder
        .write_image(rgba, w, h, ExtendedColorType::Rgba8)
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    Ok(buf.into_inner())
}

fn encode_rgb_to_jpeg(rgb: &RgbImage, quality: u8) -> Result<Vec<u8>, String> {
    let mut buf = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut buf, quality);
    encoder
        .encode_image(rgb)
        .map_err(|e| format!("Failed to encode JPEG: {}", e))?;
    Ok(buf.into_inner())
}

pub fn transmutar_svg_a_png_inner(
    input: &[u8],
    out_w: u32,
    out_h: u32,
    compression: u8,
) -> Result<Vec<u8>, String> {
    validate_svg_input(input)?;
    validate_compression(compression)?;
    validate_output_dimensions(out_w, out_h)?;

    let rgba = render_svg_to_rgba(input, out_w, out_h)?;
    let output = encode_rgba_to_png(&rgba, out_w, out_h, compression)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

pub fn transmutar_svg_a_jpg_inner(
    input: &[u8],
    out_w: u32,
    out_h: u32,
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    validate_svg_input(input)?;
    validate_quality(quality)?;
    validate_output_dimensions(out_w, out_h)?;

    let rgba = render_svg_to_rgba(input, out_w, out_h)?;
    let img = DynamicImage::ImageRgba8(
        image::RgbaImage::from_raw(out_w, out_h, rgba)
            .ok_or_else(|| "Invalid raster buffer after SVG render".to_string())?,
    );

    let rgb = if dynamic_image_has_meaningful_alpha(&img) {
        flatten_rgba_on_background(&img.to_rgba8(), bg_r, bg_g, bg_b)
    } else {
        img.to_rgb8()
    };

    let output = encode_rgb_to_jpeg(&rgb, quality)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}

pub fn estimate_svg_to_png_inner(
    input: &[u8],
    out_w: u32,
    out_h: u32,
    compression: u8,
) -> Result<u32, String> {
    Ok(transmutar_svg_a_png_inner(input, out_w, out_h, compression)?.len() as u32)
}

pub fn estimate_svg_to_jpg_inner(
    input: &[u8],
    out_w: u32,
    out_h: u32,
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<u32, String> {
    Ok(transmutar_svg_a_jpg_inner(input, out_w, out_h, quality, bg_r, bg_g, bg_b)?.len() as u32)
}

#[wasm_bindgen]
pub fn inspect_svg_meta(input_bytes: &[u8]) -> Result<SvgMetaJs, String> {
    inspect_svg_meta_inner(input_bytes).map(SvgMetaJs::from)
}

#[wasm_bindgen]
pub fn transmutar_svg_a_png(
    input_bytes: &[u8],
    out_w: u32,
    out_h: u32,
    compression: u8,
) -> Result<Vec<u8>, String> {
    transmutar_svg_a_png_inner(input_bytes, out_w, out_h, compression)
}

#[wasm_bindgen]
pub fn transmutar_svg_a_jpg_with_options(
    input_bytes: &[u8],
    out_w: u32,
    out_h: u32,
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    transmutar_svg_a_jpg_inner(input_bytes, out_w, out_h, quality, bg_r, bg_g, bg_b)
}

#[wasm_bindgen]
pub fn estimate_svg_to_png_size(
    input_bytes: &[u8],
    out_w: u32,
    out_h: u32,
    compression: u8,
) -> Result<u32, String> {
    estimate_svg_to_png_inner(input_bytes, out_w, out_h, compression)
}

#[wasm_bindgen]
pub fn estimate_svg_to_jpg_size(
    input_bytes: &[u8],
    out_w: u32,
    out_h: u32,
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<u32, String> {
    estimate_svg_to_jpg_inner(input_bytes, out_w, out_h, quality, bg_r, bg_g, bg_b)
}

#[wasm_bindgen]
pub fn set_session_input_limit(bytes: u32) {
    core_utils::set_session_max_input_bytes(bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}
