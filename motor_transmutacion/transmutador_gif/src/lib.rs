//! GIF → PNG / JPEG transmutator with frame-accurate compositing (GIF89a).
//!
//! Animated GIFs: user selects `frame_index`; disposal methods are applied when compositing.

mod gif_decode;

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use gif_decode::{
    composite_to_dynamic_image, load_composited_frames, load_composited_frames_with_progress,
    validate_frame_index,
};
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{ExtendedColorType, ImageEncoder};
use js_sys::Function;
use wasm_bindgen::prelude::*;

pub use gif_decode::{inspect_gif, GifInfo};

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

pub const DEFAULT_QUALITY: u8 = 85;
pub const MIN_QUALITY: u8 = 1;
pub const MAX_QUALITY: u8 = 100;

#[wasm_bindgen]
pub struct GifMeta {
    frame_count: u32,
    width: u32,
    height: u32,
    is_animated: bool,
}

#[wasm_bindgen]
impl GifMeta {
    #[wasm_bindgen(getter)]
    pub fn frame_count(&self) -> u32 {
        self.frame_count
    }

    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.height
    }

    #[wasm_bindgen(getter)]
    pub fn is_animated(&self) -> bool {
        self.is_animated
    }
}

#[wasm_bindgen]
pub fn inspect_gif_meta(input_bytes: &[u8]) -> Result<GifMeta, String> {
    core_utils::validate_input(input_bytes)?;
    let info = inspect_gif(input_bytes)?;
    Ok(GifMeta {
        frame_count: info.frame_count,
        width: info.width,
        height: info.height,
        is_animated: info.is_animated,
    })
}

/// Decodes and composites all frames once; use for interactive scrubbing (O(1) per frame).
#[wasm_bindgen]
pub struct GifSession {
    width: u32,
    height: u32,
    frames: Vec<Vec<u8>>,
}

#[wasm_bindgen]
impl GifSession {
    #[wasm_bindgen(getter)]
    pub fn frame_count(&self) -> u32 {
        self.frames.len() as u32
    }

    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.height
    }

    #[wasm_bindgen(getter)]
    pub fn is_animated(&self) -> bool {
        self.frames.len() > 1
    }

    #[wasm_bindgen]
    pub fn frame_rgba(&self, frame_index: u32) -> Result<Vec<u8>, String> {
        validate_frame_index(self.frames.len() as u32, frame_index)?;
        Ok(self.frames[frame_index as usize].clone())
    }
}

fn build_gif_session(width: u32, height: u32, frames: Vec<image::RgbaImage>) -> GifSession {
    let raw: Vec<Vec<u8>> = frames.into_iter().map(|f| f.into_raw()).collect();
    GifSession {
        width,
        height,
        frames: raw,
    }
}

#[wasm_bindgen]
pub fn open_gif_session(input_bytes: &[u8]) -> Result<GifSession, String> {
    core_utils::validate_input(input_bytes)?;
    let (width, height, frames) = load_composited_frames(input_bytes)?;
    Ok(build_gif_session(width, height, frames))
}

/// `on_progress(current_frame, total_so_far)` — total grows until decode completes.
#[wasm_bindgen]
pub fn open_gif_session_with_progress(
    input_bytes: &[u8],
    on_progress: &Function,
) -> Result<GifSession, String> {
    core_utils::validate_input(input_bytes)?;
    let (width, height, frames) =
        load_composited_frames_with_progress(input_bytes, |done, total| {
            let _ = on_progress.call2(
                &wasm_bindgen::JsValue::NULL,
                &wasm_bindgen::JsValue::from(done),
                &wasm_bindgen::JsValue::from(total),
            );
        })?;
    Ok(build_gif_session(width, height, frames))
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

fn decode_gif_frame(input: &[u8], frame_index: u32) -> Result<image::DynamicImage, String> {
    composite_to_dynamic_image(input, frame_index)
}

fn rgba_has_alpha(rgba: &image::RgbaImage) -> bool {
    rgba.pixels().any(|p| p[3] < 255)
}

fn gif_bytes_to_png_bytes(
    input: &[u8],
    compression: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    let img = decode_gif_frame(input, frame_index)?;
    let rgba = img.to_rgba8();
    let has_alpha = rgba_has_alpha(&rgba);

    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if has_alpha {
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

pub fn transmutar_gif_a_png_inner(
    input: &[u8],
    compression: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_compression(compression)?;
    let info = inspect_gif(input)?;
    validate_frame_index(info.frame_count, frame_index)?;
    let output = gif_bytes_to_png_bytes(input, compression, frame_index)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_gif_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_gif_a_png_inner(input_bytes, DEFAULT_COMPRESSION, 0)
}

#[wasm_bindgen]
pub fn transmutar_gif_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_gif_a_png_inner(input_bytes, compression, frame_index)
}

#[wasm_bindgen]
pub fn estimate_gif_to_png_size(
    input_bytes: &[u8],
    compression: u8,
    frame_index: u32,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    let info = inspect_gif(input_bytes)?;
    validate_frame_index(info.frame_count, frame_index)?;
    let img = decode_gif_frame(input_bytes, frame_index)?;
    let rgba = img.to_rgba8();
    let has_alpha = rgba_has_alpha(&rgba);

    let mut writer = CountingWriter::default();
    let encoder = PngEncoder::new_with_quality(
        &mut writer,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if has_alpha {
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

/// Low-compression PNG preview of a composited frame (for UI scrubber).
#[wasm_bindgen]
pub fn render_gif_frame_preview_png(
    input_bytes: &[u8],
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_gif_a_png_inner(input_bytes, 1, frame_index)
}

fn gif_bytes_to_jpg_bytes(
    input: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    let img = decode_gif_frame(input, frame_index)?;
    let rgba = img.to_rgba8();

    let rgb = if rgba_has_alpha(&rgba) {
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
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_quality(quality)?;
    let info = inspect_gif(input)?;
    validate_frame_index(info.frame_count, frame_index)?;
    let output = gif_bytes_to_jpg_bytes(input, quality, bg_r, bg_g, bg_b, frame_index)?;
    core_utils::validate_output(&output, core_utils::OutputFormat::Jpeg)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_gif_a_jpg(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_gif_a_jpg_inner(input_bytes, DEFAULT_QUALITY, 255, 255, 255, 0)
}

#[wasm_bindgen]
pub fn transmutar_gif_a_jpg_with_options(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    frame_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_gif_a_jpg_inner(input_bytes, quality, bg_r, bg_g, bg_b, frame_index)
}

#[wasm_bindgen]
pub fn estimate_gif_to_jpg_size(
    input_bytes: &[u8],
    quality: u8,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
    frame_index: u32,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_quality(quality)?;
    let info = inspect_gif(input_bytes)?;
    validate_frame_index(info.frame_count, frame_index)?;
    let img = decode_gif_frame(input_bytes, frame_index)?;
    let rgba = img.to_rgba8();

    let rgb = if rgba_has_alpha(&rgba) {
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
