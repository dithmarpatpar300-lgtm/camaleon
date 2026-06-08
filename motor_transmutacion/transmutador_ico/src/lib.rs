//! ICO/CUR ↔ PNG transmutator (Wave 2 Phases 7.3–7.4).

mod ico_decode;
mod ico_encode;
mod ico_probe;

use std::io::Cursor;

use core_utils::counting_writer::CountingWriter;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{ExtendedColorType, ImageEncoder};
pub use ico_decode::{decode_ico_entry, entry_has_meaningful_alpha, inspect_and_validate};
pub use ico_encode::{transmutar_png_a_ico_inner, validate_icon_size, validate_ico_bytes};
pub use ico_probe::{IcoContainerKind, IcoInfo};

use ico_probe::{entry_likely_has_alpha, IcoEntryFormat};
use wasm_bindgen::prelude::*;

pub const DEFAULT_COMPRESSION: u8 = 6;
pub const MIN_COMPRESSION: u8 = 1;
pub const MAX_COMPRESSION: u8 = 9;

#[wasm_bindgen]
pub struct IcoMeta {
    inner: IcoInfo,
}

#[wasm_bindgen]
impl IcoMeta {
    #[wasm_bindgen(getter)]
    pub fn entry_count(&self) -> u32 {
        self.inner.entry_count
    }

    #[wasm_bindgen(getter)]
    pub fn default_entry_index(&self) -> u32 {
        self.inner.default_entry_index
    }

    #[wasm_bindgen(getter)]
    pub fn is_cursor(&self) -> bool {
        self.inner.container == IcoContainerKind::Cursor
    }

    #[wasm_bindgen]
    pub fn entry_width(&self, entry_index: u32) -> Result<u32, String> {
        ico_probe::validate_entry_index(self.inner.entry_count, entry_index)?;
        Ok(self.inner.entries[entry_index as usize].width)
    }

    #[wasm_bindgen]
    pub fn entry_height(&self, entry_index: u32) -> Result<u32, String> {
        ico_probe::validate_entry_index(self.inner.entry_count, entry_index)?;
        Ok(self.inner.entries[entry_index as usize].height)
    }

    #[wasm_bindgen]
    pub fn entry_bits_per_pixel(&self, entry_index: u32) -> Result<u16, String> {
        ico_probe::validate_entry_index(self.inner.entry_count, entry_index)?;
        Ok(self.inner.entries[entry_index as usize].bits_per_pixel)
    }

    #[wasm_bindgen]
    pub fn entry_is_png(&self, entry_index: u32) -> Result<bool, String> {
        ico_probe::validate_entry_index(self.inner.entry_count, entry_index)?;
        Ok(self.inner.entries[entry_index as usize].format == IcoEntryFormat::Png)
    }

    #[wasm_bindgen]
    pub fn entry_has_alpha(&self, entry_index: u32) -> Result<bool, String> {
        ico_probe::validate_entry_index(self.inner.entry_count, entry_index)?;
        Ok(entry_likely_has_alpha(
            &self.inner.entries[entry_index as usize],
        ))
    }
}

#[wasm_bindgen]
pub fn inspect_ico_meta(input_bytes: &[u8]) -> Result<IcoMeta, String> {
    core_utils::validate_input(input_bytes)?;
    Ok(IcoMeta {
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

fn rgba_to_png_bytes(rgba: &image::RgbaImage, compression: u8) -> Result<Vec<u8>, String> {
    let meaningful_alpha = rgba.pixels().any(|p| p[3] < 255);
    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );

    if meaningful_alpha {
        encoder
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                ExtendedColorType::Rgba8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    } else {
        let rgb = image::DynamicImage::ImageRgba8(rgba.clone()).to_rgb8();
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

pub fn transmutar_ico_a_png_inner(
    input: &[u8],
    compression: u8,
    entry_index: u32,
) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    validate_compression(compression)?;
    let img = decode_ico_entry(input, entry_index)?;
    let output = if entry_has_meaningful_alpha(&img) {
        rgba_to_png_bytes(&img.to_rgba8(), compression)?
    } else {
        let mut buf = Cursor::new(Vec::new());
        let encoder = PngEncoder::new_with_quality(
            &mut buf,
            CompressionType::Level(compression),
            FilterType::Adaptive,
        );
        let rgb = img.to_rgb8();
        encoder
            .write_image(
                rgb.as_raw(),
                rgb.width(),
                rgb.height(),
                ExtendedColorType::Rgb8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
        buf.into_inner()
    };
    core_utils::validate_output(&output, core_utils::OutputFormat::Png)?;
    Ok(output)
}

#[wasm_bindgen]
pub fn transmutar_ico_a_png(input_bytes: &[u8], entry_index: u32) -> Result<Vec<u8>, String> {
    transmutar_ico_a_png_inner(input_bytes, DEFAULT_COMPRESSION, entry_index)
}

#[wasm_bindgen]
pub fn transmutar_ico_a_png_with_compression(
    input_bytes: &[u8],
    compression: u8,
    entry_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_ico_a_png_inner(input_bytes, compression, entry_index)
}

#[wasm_bindgen]
pub fn render_ico_entry_preview_png(
    input_bytes: &[u8],
    entry_index: u32,
) -> Result<Vec<u8>, String> {
    transmutar_ico_a_png_inner(input_bytes, 1, entry_index)
}

#[wasm_bindgen]
pub fn estimate_ico_to_png_size(
    input_bytes: &[u8],
    compression: u8,
    entry_index: u32,
) -> Result<u32, String> {
    core_utils::validate_input(input_bytes)?;
    validate_compression(compression)?;
    let img = decode_ico_entry(input_bytes, entry_index)?;
    let meaningful_alpha = entry_has_meaningful_alpha(&img);

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

#[wasm_bindgen]
pub fn transmutar_png_a_ico(input_bytes: &[u8], target_size: u32) -> Result<Vec<u8>, String> {
    transmutar_png_a_ico_inner(input_bytes, target_size)
}

#[wasm_bindgen]
pub fn estimate_png_to_ico_size(input_bytes: &[u8], target_size: u32) -> Result<u32, String> {
    use core_utils::counting_writer::CountingWriter;
    use image::codecs::ico::IcoEncoder;
    use image::{ExtendedColorType, ImageEncoder, ImageReader};

    core_utils::validate_input(input_bytes)?;
    let target_size = validate_icon_size(target_size)?;
    let img = ImageReader::new(Cursor::new(input_bytes))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?;
    let rgba = ico_encode::resize_for_ico(&img, target_size);
    let (w, h) = rgba.dimensions();

    let mut writer = CountingWriter::default();
    IcoEncoder::new(&mut writer)
        .write_image(rgba.as_raw(), w, h, ExtendedColorType::Rgba8)
        .map_err(|e| format!("Failed to encode ICO: {}", e))?;
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
