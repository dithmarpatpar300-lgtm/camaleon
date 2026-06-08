//! TIFF page decode — `tiff` crate with `page_index`; rejects unsupported photometrics.

use std::io::Cursor;

use image::{DynamicImage, ImageBuffer, Luma, LumaA, Rgb, Rgba};
use tiff::decoder::{Decoder, DecodingResult};
use tiff::ColorType;

use crate::tiff_probe::{
    inspect_tiff, is_cmyk_page, is_palette_page, TiffInfo, TiffPageInfo,
};

pub fn validate_page_index(page_count: u32, page_index: u32) -> Result<(), String> {
    if page_index >= page_count {
        return Err(format!(
            "TIFF page index {} out of range ({} pages)",
            page_index, page_count
        ));
    }
    Ok(())
}

pub fn validate_page_supported(page: &TiffPageInfo) -> Result<(), String> {
    if is_palette_page(page) {
        return Err("TIFF palette (indexed color) is not supported".into());
    }
    if is_cmyk_page(page) {
        return Err("TIFF CMYK color is not supported".into());
    }
    Ok(())
}

fn validate_page_pixels(width: u32, height: u32) -> Result<(), String> {
    if width == 0 || height == 0 {
        return Err(format!("Invalid TIFF dimensions: {}x{}", width, height));
    }
    let pixels = width as u64 * height as u64;
    if pixels > core_utils::MAX_PIXELS {
        return Err(format!(
            "Image dimensions {}x{} ({} pixels) exceed maximum allowed ({} pixels)",
            width,
            height,
            pixels,
            core_utils::MAX_PIXELS
        ));
    }
    Ok(())
}

pub fn page_likely_has_alpha(page: &TiffPageInfo) -> bool {
    page.samples_per_pixel >= 4
}

fn decoding_to_dynamic(
    color_type: ColorType,
    result: DecodingResult,
    width: u32,
    height: u32,
) -> Result<DynamicImage, String> {
    let w = width;
    let h = height;
    match (color_type, result) {
        (ColorType::Gray(8), DecodingResult::U8(v)) => ImageBuffer::<Luma<u8>, Vec<u8>>::from_raw(w, h, v)
            .map(DynamicImage::ImageLuma8)
            .ok_or_else(|| "TIFF gray8 buffer size mismatch".into()),
        (ColorType::Gray(16), DecodingResult::U16(v)) => {
            ImageBuffer::<Luma<u16>, Vec<u16>>::from_raw(w, h, v)
                .map(DynamicImage::ImageLuma16)
                .ok_or_else(|| "TIFF gray16 buffer size mismatch".into())
        }
        (ColorType::GrayA(8), DecodingResult::U8(v)) => {
            ImageBuffer::<LumaA<u8>, Vec<u8>>::from_raw(w, h, v)
                .map(DynamicImage::ImageLumaA8)
                .ok_or_else(|| "TIFF grayA8 buffer size mismatch".into())
        }
        (ColorType::GrayA(16), DecodingResult::U16(v)) => {
            ImageBuffer::<LumaA<u16>, Vec<u16>>::from_raw(w, h, v)
                .map(DynamicImage::ImageLumaA16)
                .ok_or_else(|| "TIFF grayA16 buffer size mismatch".into())
        }
        (ColorType::RGB(8), DecodingResult::U8(v)) => ImageBuffer::<Rgb<u8>, Vec<u8>>::from_raw(w, h, v)
            .map(DynamicImage::ImageRgb8)
            .ok_or_else(|| "TIFF rgb8 buffer size mismatch".into()),
        (ColorType::RGB(16), DecodingResult::U16(v)) => {
            ImageBuffer::<Rgb<u16>, Vec<u16>>::from_raw(w, h, v)
                .map(DynamicImage::ImageRgb16)
                .ok_or_else(|| "TIFF rgb16 buffer size mismatch".into())
        }
        (ColorType::RGBA(8), DecodingResult::U8(v)) => {
            ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(w, h, v)
                .map(DynamicImage::ImageRgba8)
                .ok_or_else(|| "TIFF rgba8 buffer size mismatch".into())
        }
        (ColorType::RGBA(16), DecodingResult::U16(v)) => {
            ImageBuffer::<Rgba<u16>, Vec<u16>>::from_raw(w, h, v)
                .map(DynamicImage::ImageRgba16)
                .ok_or_else(|| "TIFF rgba16 buffer size mismatch".into())
        }
        (ColorType::RGB(32), DecodingResult::F32(v)) => {
            let rgb8 = f32_samples_to_rgb8(&v, 3)?;
            ImageBuffer::<Rgb<u8>, Vec<u8>>::from_raw(w, h, rgb8)
                .map(DynamicImage::ImageRgb8)
                .ok_or_else(|| "TIFF rgb32f buffer size mismatch".into())
        }
        (ColorType::RGBA(32), DecodingResult::F32(v)) => {
            let rgba8 = f32_samples_to_rgba8(&v, 4)?;
            ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(w, h, rgba8)
                .map(DynamicImage::ImageRgba8)
                .ok_or_else(|| "TIFF rgba32f buffer size mismatch".into())
        }
        (other, _) => Err(format!("Unsupported TIFF color type: {:?}", other)),
    }
}

fn f32_to_u8(sample: f32) -> u8 {
    if sample.is_nan() {
        return 0;
    }
    (sample.clamp(0.0, 1.0) * 255.0).round() as u8
}

fn f32_samples_to_rgb8(samples: &[f32], channels: usize) -> Result<Vec<u8>, String> {
    if channels != 3 || samples.len() % 3 != 0 {
        return Err("Invalid TIFF float RGB sample layout".into());
    }
    Ok(samples
        .chunks_exact(3)
        .flat_map(|px| px.iter().map(|&s| f32_to_u8(s)))
        .collect())
}

fn f32_samples_to_rgba8(samples: &[f32], channels: usize) -> Result<Vec<u8>, String> {
    if channels != 4 || samples.len() % 4 != 0 {
        return Err("Invalid TIFF float RGBA sample layout".into());
    }
    Ok(samples
        .chunks_exact(4)
        .flat_map(|px| px.iter().map(|&s| f32_to_u8(s)))
        .collect())
}

pub fn decode_tiff_page(input: &[u8], page_index: u32) -> Result<DynamicImage, String> {
    let info = inspect_tiff(input)?;
    validate_page_index(info.page_count, page_index)?;
    let page = info.pages[page_index as usize].clone();
    validate_page_supported(&page)?;
    validate_page_pixels(page.width, page.height)?;

    let mut decoder = Decoder::new(Cursor::new(input))
        .map_err(|e| format!("Invalid or corrupt TIFF data: {}", e))?;

    if page_index > 0 {
        decoder
            .seek_to_image(page_index as usize)
            .map_err(|e| format!("Failed to seek TIFF page: {}", e))?;
    }

    let color_type = decoder
        .colortype()
        .map_err(|e| format!("Unsupported TIFF color: {}", e))?;
    let result = decoder
        .read_image()
        .map_err(|e| format!("Failed to decode TIFF: {}", e))?;

    decoding_to_dynamic(color_type, result, page.width, page.height)
}

pub fn inspect_and_validate(input: &[u8]) -> Result<TiffInfo, String> {
    core_utils::validate_input(input)?;
    let info = inspect_tiff(input)?;
    for page in &info.pages {
        validate_page_supported(page)?;
        validate_page_pixels(page.width, page.height)?;
    }
    Ok(info)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_out_of_range_page() {
        let err = validate_page_index(2, 2).unwrap_err();
        assert!(err.contains("out of range"));
    }
}
