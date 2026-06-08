//! PNG → ICO encode (Phase 7.4) — single PNG-in-ICO entry, downscale only.

use std::io::Cursor;

use image::codecs::ico::IcoEncoder;
use image::imageops::FilterType;
use image::{
    DynamicImage, ExtendedColorType, GenericImageView, ImageEncoder, ImageReader, RgbaImage,
};

pub const ICON_SIZES: [u32; 4] = [16, 32, 48, 256];

pub fn validate_icon_size(size: u32) -> Result<u32, String> {
    if ICON_SIZES.contains(&size) {
        Ok(size)
    } else {
        Err(format!(
            "Icon size must be 16, 32, 48, or 256 pixels (got {})",
            size
        ))
    }
}

/// Downscale when max edge exceeds target; never upscale beyond source dimensions.
pub fn resize_for_ico(img: &DynamicImage, target_size: u32) -> RgbaImage {
    let (w, h) = img.dimensions();
    let max_edge = w.max(h);
    if max_edge <= target_size {
        return img.to_rgba8();
    }
    let ratio = f64::from(target_size) / f64::from(max_edge);
    let new_w = ((f64::from(w) * ratio).round() as u32).max(1);
    let new_h = ((f64::from(h) * ratio).round() as u32).max(1);
    image::imageops::resize(&img.to_rgba8(), new_w, new_h, FilterType::Lanczos3)
}

fn decode_png_input(input: &[u8]) -> Result<DynamicImage, String> {
    ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))?
        .decode()
        .map_err(|e| format!("Invalid or corrupt PNG data: {}", e))
}

pub fn validate_ico_bytes(bytes: &[u8]) -> Result<(), String> {
    if bytes.len() < 6 {
        return Err("ICO output is too short".into());
    }
    if bytes[0] != 0 || bytes[1] != 0 {
        return Err("ICO output has invalid reserved header".into());
    }
    let image_type = u16::from_le_bytes([bytes[2], bytes[3]]);
    if image_type != 1 {
        return Err("ICO output has unexpected container type".into());
    }
    let count = u16::from_le_bytes([bytes[4], bytes[5]]);
    if count == 0 {
        return Err("ICO output contains no images".into());
    }
    Ok(())
}

fn encode_rgba_as_ico(rgba: &RgbaImage) -> Result<Vec<u8>, String> {
    let (w, h) = rgba.dimensions();
    if w == 0 || h == 0 || w > 256 || h > 256 {
        return Err(format!(
            "ICO output dimensions {}×{} are outside the 1–256 range",
            w, h
        ));
    }
    let mut buf = Vec::new();
    IcoEncoder::new(&mut buf)
        .write_image(rgba.as_raw(), w, h, ExtendedColorType::Rgba8)
        .map_err(|e| format!("Failed to encode ICO: {}", e))?;
    validate_ico_bytes(&buf)?;
    Ok(buf)
}

pub fn transmutar_png_a_ico_inner(input: &[u8], target_size: u32) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input)?;
    let target_size = validate_icon_size(target_size)?;
    let img = decode_png_input(input)?;
    let rgba = resize_for_ico(&img, target_size);
    encode_rgba_as_ico(&rgba)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba};

    #[test]
    fn no_upscale_when_source_smaller() {
        let img = DynamicImage::ImageRgba8(ImageBuffer::from_pixel(32, 32, Rgba([1, 2, 3, 255])));
        let out = resize_for_ico(&img, 256);
        assert_eq!(out.dimensions(), (32, 32));
    }

    #[test]
    fn downscales_when_larger_than_target() {
        let img = DynamicImage::ImageRgba8(ImageBuffer::from_pixel(512, 512, Rgba([1, 2, 3, 255])));
        let out = resize_for_ico(&img, 256);
        assert_eq!(out.dimensions(), (256, 256));
    }
}
