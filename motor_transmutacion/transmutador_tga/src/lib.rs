//! TGA → PNG transmutator (Wave 2 Phase 7.5).

mod tga_probe;

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::codecs::tga::TgaDecoder;
use image::{DynamicImage, ExtendedColorType, ImageEncoder};
pub use tga_probe::{inspect_and_validate, inspect_tga, TgaImageType, TgaInfo, TgaOrientation};
use wasm_bindgen::prelude::*;

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

#[wasm_bindgen]
pub struct TgaMeta {
    inner: TgaInfo,
}

#[wasm_bindgen]
impl TgaMeta {
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.inner.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.inner.height
    }

    #[wasm_bindgen(getter)]
    pub fn pixel_depth(&self) -> u8 {
        self.inner.pixel_depth
    }

    #[wasm_bindgen(getter)]
    pub fn is_rle(&self) -> bool {
        self.inner.image_type.is_rle()
    }

    #[wasm_bindgen(getter)]
    pub fn is_color_mapped(&self) -> bool {
        self.inner.image_type.is_color_mapped()
    }

    #[wasm_bindgen(getter)]
    pub fn has_alpha_channel(&self) -> bool {
        self.inner.has_alpha_channel
    }

    #[wasm_bindgen(getter)]
    pub fn is_rgb555(&self) -> bool {
        self.inner.is_rgb555
    }

    #[wasm_bindgen(getter)]
    pub fn orientation(&self) -> String {
        match self.inner.orientation {
            TgaOrientation::BottomLeft => "bottom_left".into(),
            TgaOrientation::BottomRight => "bottom_right".into(),
            TgaOrientation::TopLeft => "top_left".into(),
            TgaOrientation::TopRight => "top_right".into(),
        }
    }
}

#[wasm_bindgen]
pub fn inspect_tga_meta(input_bytes: &[u8]) -> Result<TgaMeta, String> {
    core_utils::validate_input(input_bytes)?;
    Ok(TgaMeta {
        inner: inspect_and_validate(input_bytes)?,
    })
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

fn decode_tga(input: &[u8]) -> Result<image::DynamicImage, String> {
    let decoder = TgaDecoder::new(Cursor::new(input))
        .map_err(|e| format!("Failed to decode TGA: {}", e))?;
    DynamicImage::from_decoder(decoder)
        .map_err(|e| format!("Failed to decode TGA: {}", e))
}

fn rgba_has_meaningful_alpha(rgba: &image::RgbaImage) -> bool {
    rgba.pixels().any(|p| p[3] < 255)
}

fn tga_has_meaningful_alpha(img: &image::DynamicImage) -> bool {
    if !img.color().has_alpha() {
        return false;
    }
    rgba_has_meaningful_alpha(&img.to_rgba8())
}

pub fn transmutar_tga_a_png_inner(input: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_compression(compression)?;
    inspect_and_validate(input)?;

    let img = decode_tga(input)?;
    let meaningful_alpha = tga_has_meaningful_alpha(&img);

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

    let out = buf.into_inner();
    if out.len() < 8 {
        return Err("PNG output is too short".into());
    }
    Ok(out)
}

#[wasm_bindgen]
pub fn transmutar_tga_a_png(input_bytes: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    transmutar_tga_a_png_inner(input_bytes, compression)
}

#[wasm_bindgen]
pub fn transmutar_tga_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
) -> Result<Vec<u8>, String> {
    transmutar_tga_a_png_inner(input_bytes, compression)
}

#[wasm_bindgen]
pub fn render_tga_preview_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    transmutar_tga_a_png_inner(input_bytes, 1)
}

#[wasm_bindgen]
pub fn estimate_tga_to_png_size(input_bytes: &[u8], compression: u8) -> Result<usize, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    let mut writer = CountingWriter::default();
    let encoder = PngEncoder::new_with_quality(
        &mut writer,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );
    let img = decode_tga(input_bytes)?;
    if tga_has_meaningful_alpha(&img) {
        let rgba = img.to_rgba8();
        encoder
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                ExtendedColorType::Rgba8,
            )
            .map_err(|e| format!("Failed to estimate PNG size: {}", e))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(
                rgb.as_raw(),
                rgb.width(),
                rgb.height(),
                ExtendedColorType::Rgb8,
            )
            .map_err(|e| format!("Failed to estimate PNG size: {}", e))?;
    }
    Ok(writer.bytes_written as usize)
}

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32) {
    core_utils::set_session_max_input_bytes(max_bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}
