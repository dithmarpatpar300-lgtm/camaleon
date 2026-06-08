//! TIFF → PNG / JPEG transmutator (Wave 2 Phase 7.1–7.2).

mod tiff_decode;
mod tiff_probe;
mod tiff_semantic_alpha;

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use core_utils::semantic_alpha::{dynamic_image_has_meaningful_alpha, AlphaAssessmentJs};
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{ExtendedColorType, ImageEncoder};
use tiff_decode::{
    decode_tiff_page, inspect_and_validate, page_likely_has_alpha, validate_page_index,
};
use wasm_bindgen::prelude::*;

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

pub const DEFAULT_QUALITY: u8 = 85;
pub const MIN_QUALITY: u8 = 1;
pub const MAX_QUALITY: u8 = 100;

pub use tiff_probe::{
    inspect_tiff, is_cmyk_page, is_palette_page, page_compression_name, page_photometric_name,
    TiffInfo, TiffPageInfo,
};
pub use tiff_semantic_alpha::assess_tiff_page_alpha;

#[wasm_bindgen]
pub struct TiffMeta {
    inner: TiffInfo,
}

#[wasm_bindgen]
impl TiffMeta {
    #[wasm_bindgen(getter)]
    pub fn page_count(&self) -> u32 {
        self.inner.page_count
    }

    #[wasm_bindgen]
    pub fn page_width(&self, page_index: u32) -> Result<u32, String> {
        validate_page_index(self.inner.page_count, page_index)?;
        Ok(self.inner.pages[page_index as usize].width)
    }

    #[wasm_bindgen]
    pub fn page_height(&self, page_index: u32) -> Result<u32, String> {
        validate_page_index(self.inner.page_count, page_index)?;
        Ok(self.inner.pages[page_index as usize].height)
    }

    #[wasm_bindgen]
    pub fn page_bit_depth(&self, page_index: u32) -> Result<u8, String> {
        validate_page_index(self.inner.page_count, page_index)?;
        Ok(self.inner.pages[page_index as usize].bits_per_sample)
    }

    #[wasm_bindgen]
    pub fn page_has_alpha(&self, page_index: u32) -> Result<bool, String> {
        validate_page_index(self.inner.page_count, page_index)?;
        Ok(page_likely_has_alpha(&self.inner.pages[page_index as usize]))
    }

    #[wasm_bindgen]
    pub fn page_photometric(&self, page_index: u32) -> Result<u16, String> {
        validate_page_index(self.inner.page_count, page_index)?;
        Ok(self.inner.pages[page_index as usize].photometric)
    }
}

#[wasm_bindgen]
pub fn inspect_tiff_meta(input_bytes: &[u8]) -> Result<TiffMeta, String> {
    Ok(TiffMeta {
        inner: inspect_and_validate(input_bytes)?,
    })
}

#[wasm_bindgen]
pub fn assess_page_alpha(input_bytes: &[u8], page_index: u32) -> Result<AlphaAssessmentJs, String> {
    Ok(AlphaAssessmentJs::from_assessment(assess_tiff_page_alpha(
        input_bytes,
        page_index,
    )?))
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

fn dynamic_to_png_bytes(img: &image::DynamicImage, compression: u8) -> Result<Vec<u8>, String> {
    let meaningful_alpha = dynamic_image_has_meaningful_alpha(img);
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

pub fn transmutar_tiff_a_png_inner(
    input: &[u8],
    compression: u8,
    page_index: u32,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_compression(compression)?;
    let img = decode_tiff_page(input, page_index)?;
    let output = dynamic_to_png_bytes(&img, compression)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_tiff_a_png(input_bytes: &[u8], page_index: u32) -> Result<Vec<u8>, String> {
    transmutar_tiff_a_png_inner(input_bytes, DEFAULT_COMPRESSION, page_index)
}

#[wasm_bindgen]
pub fn transmutar_tiff_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
    page_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_tiff_a_png_inner(input_bytes, compression, page_index)
}

#[wasm_bindgen]
pub fn render_tiff_page_preview_png(
    input_bytes: &[u8],
    page_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_tiff_a_png_inner(input_bytes, DEFAULT_COMPRESSION, page_index)
}

#[wasm_bindgen]
pub fn estimate_tiff_to_png_size(
    input_bytes: &[u8],
    compression: u8,
    page_index: u32,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    let img = decode_tiff_page(input_bytes, page_index)?;
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

fn dynamic_to_jpg_bytes(
    img: &image::DynamicImage,
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> Result<Vec<u8>, String> {
    let rgb = if dynamic_image_has_meaningful_alpha(img) {
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

pub fn transmutar_tiff_a_jpg_inner(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    page_index: u32,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_quality(quality)?;
    let img = decode_tiff_page(input, page_index)?;
    let output = dynamic_to_jpg_bytes(&img, quality, bg_r, bg_g, bg_b)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_tiff_a_jpg(
    input_bytes: &[u8],
    page_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_tiff_a_jpg_inner(input_bytes, DEFAULT_QUALITY, 255, 255, 255, page_index)
}

#[wasm_bindgen]
pub fn transmutar_tiff_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    page_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_tiff_a_jpg_inner(input_bytes, quality, bg_r, bg_g, bg_b, page_index)
}

#[wasm_bindgen]
pub fn estimate_tiff_to_jpg_size(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    page_index: u32,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_quality(quality)?;
    let img = decode_tiff_page(input_bytes, page_index)?;

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

/// Documented 16-bit → 8-bit policy: match `image` `FromPrimitive<u16> for u8`.
pub fn downshift_u16_sample_to_u8(sample: u16) -> u8 {
    ((u32::from(sample) + 128) / 257) as u8
}

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32) {
    core_utils::set_session_max_input_bytes(max_bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}
