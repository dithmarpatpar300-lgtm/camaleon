//! Decode a single ICO/CUR directory entry by index.

use std::io::Cursor;

use image::codecs::png::PngDecoder;
use image::{ColorType, DynamicImage, ImageDecoder, RgbaImage};
use crate::ico_probe::{self, IcoEntryFormat, IcoInfo};

const PNG_MAGIC: [u8; 8] = [137, 80, 78, 71, 13, 10, 26, 10];

pub fn inspect_and_validate(input: &[u8]) -> Result<IcoInfo, String> {
    let info = ico_probe::inspect_ico(input)?;
    for entry in &info.entries {
        let end = entry
            .image_offset
            .saturating_add(entry.image_length) as usize;
        if end > input.len() {
            return Err("Invalid or corrupt ICO data: entry extends past end of file".into());
        }
    }
    Ok(info)
}

pub fn decode_ico_entry(input: &[u8], entry_index: u32) -> Result<DynamicImage, String> {
    let info = inspect_and_validate(input)?;
    ico_probe::validate_entry_index(info.entry_count, entry_index)?;
    let entry = &info.entries[entry_index as usize];
    let slice = &input[entry.image_offset as usize..(entry.image_offset + entry.image_length) as usize];

    match entry.format {
        IcoEntryFormat::Png => decode_png_entry(slice, entry.width, entry.height),
        IcoEntryFormat::Bmp => Err(
            "Legacy BMP-style ICO entries are not supported. Re-save the icon with a modern tool (PNG-in-ICO)."
                .into(),
        ),
    }
}

fn decode_png_entry(slice: &[u8], expected_w: u32, expected_h: u32) -> Result<DynamicImage, String> {
    if slice.len() < PNG_MAGIC.len() {
        return Err("ICO PNG entry is shorter than PNG header".into());
    }
    if slice[0..PNG_MAGIC.len()] != PNG_MAGIC {
        return Err("ICO entry is not a valid embedded PNG".into());
    }
    let decoder = PngDecoder::new(Cursor::new(slice))
        .map_err(|e| format!("Invalid or corrupt ICO PNG entry: {}", e))?;
    let (width, height) = decoder.dimensions();
    if !matches_dimensions(expected_w, expected_h, width, height) {
        return Err(format!(
            "ICO PNG entry dimensions {}×{} do not match directory {}×{}",
            width, height, expected_w, expected_h
        ));
    }
    if decoder.color_type() != ColorType::Rgba8 {
        return Err("ICO embedded PNG must be 32-bit RGBA".into());
    }
    let mut rgba = vec![0u8; (width * height * 4) as usize];
    decoder
        .read_image(&mut rgba)
        .map_err(|e| format!("Invalid or corrupt ICO PNG entry: {}", e))?;
    RgbaImage::from_raw(width, height, rgba)
        .map(DynamicImage::ImageRgba8)
        .ok_or_else(|| "Failed to build RGBA image from ICO PNG entry".into())
}

fn matches_dimensions(expected_w: u32, expected_h: u32, width: u32, height: u32) -> bool {
    width == expected_w.min(256) && height == expected_h.min(256)
}

pub fn entry_has_meaningful_alpha(img: &DynamicImage) -> bool {
    let rgba = img.to_rgba8();
    rgba.pixels().any(|p| p[3] < 255)
}
