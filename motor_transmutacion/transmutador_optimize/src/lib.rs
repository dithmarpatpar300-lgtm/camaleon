//! Same-format optimization: PNG/JPEG re-encode (compress) and resize (Tier 4a).

use std::io::Cursor;

use image::GenericImageView;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::imageops::FilterType as ResizeFilter;
use image::{DynamicImage, ExtendedColorType, ImageEncoder, ImageReader};
use jpeg_encoder::{ColorType, Encoder, SamplingFactor};
use wasm_bindgen::prelude::*;

pub const MIN_PNG_COMPRESSION: u8 = 1;
pub const MAX_PNG_COMPRESSION: u8 = 9;
pub const DEFAULT_PNG_COMPRESSION: u8 = 6;
pub const MIN_JPEG_QUALITY: u8 = 1;
pub const MAX_JPEG_QUALITY: u8 = 100;
pub const DEFAULT_JPEG_QUALITY: u8 = 85;
pub const MIN_RESIZE_PERCENT: u16 = 1;
pub const MAX_RESIZE_PERCENT: u16 = 400;

fn decode_image(input: &[u8]) -> Result<DynamicImage, String> {
    core_utils::validate_input(input)?;
    let mut reader = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Could not read image format: {e}"))?;
    if core_utils::risk_mode_enabled() {
        reader.no_limits();
    }
    reader
        .decode()
        .map_err(|e| format!("Could not decode image: {e}"))
}

fn encode_png(img: &DynamicImage, compression: u8) -> Result<Vec<u8>, String> {
    if !(MIN_PNG_COMPRESSION..=MAX_PNG_COMPRESSION).contains(&compression) {
        return Err(format!(
            "PNG compression must be between {MIN_PNG_COMPRESSION} and {MAX_PNG_COMPRESSION}"
        ));
    }
    let (w, h) = img.dimensions();
    let color = img.color();
    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Level(compression),
        FilterType::Adaptive,
    );
    let has_alpha = color.has_alpha();
    if has_alpha {
        let rgba = img.to_rgba8();
        encoder
            .write_image(rgba.as_raw(), w, h, ExtendedColorType::Rgba8)
            .map_err(|e| format!("PNG encode failed: {e}"))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(rgb.as_raw(), w, h, ExtendedColorType::Rgb8)
            .map_err(|e| format!("PNG encode failed: {e}"))?;
    }
    Ok(buf.into_inner())
}

fn subsampling_from_code(code: u8) -> SamplingFactor {
    match code {
        1 => SamplingFactor::F_2_1,
        2 => SamplingFactor::R_4_4_4,
        _ => SamplingFactor::F_2_2,
    }
}

fn encode_jpeg_inner(img: &DynamicImage, quality: u8, subsampling: SamplingFactor) -> Result<Vec<u8>, String> {
    if !(MIN_JPEG_QUALITY..=MAX_JPEG_QUALITY).contains(&quality) {
        return Err(format!(
            "JPEG quality must be between {MIN_JPEG_QUALITY} and {MAX_JPEG_QUALITY}"
        ));
    }
    let rgb = img.to_rgb8();
    let (w, h) = rgb.dimensions();
    let mut out = Vec::new();
    let mut encoder = Encoder::new(&mut out, quality);
    encoder.set_sampling_factor(subsampling);
    encoder.set_optimized_huffman_tables(true);
    encoder
        .encode(rgb.as_raw(), w as u16, h as u16, ColorType::Rgb)
        .map_err(|e| format!("JPEG encode failed: {e}"))?;
    Ok(out)
}

fn encode_jpeg(img: &DynamicImage, quality: u8) -> Result<Vec<u8>, String> {
    encode_jpeg_inner(img, quality, SamplingFactor::F_2_2)
}

fn filter_from_code(code: u8) -> Result<ResizeFilter, String> {
    Ok(match code {
        0 => ResizeFilter::Nearest,
        1 => ResizeFilter::Triangle,
        2 => ResizeFilter::CatmullRom,
        3 => ResizeFilter::Gaussian,
        4 => ResizeFilter::Lanczos3,
        _ => return Err(format!("Unknown filter code: {code} — valid codes are 0 (Nearest), 1 (Triangle), 2 (CatmullRom), 3 (Gaussian), 4 (Lanczos3)")),
    })
}

fn resize_by_percent(img: DynamicImage, percent: u16, filter: ResizeFilter) -> Result<DynamicImage, String> {
    if !(MIN_RESIZE_PERCENT..=MAX_RESIZE_PERCENT).contains(&percent) {
        return Err(format!(
            "Resize percent must be between {MIN_RESIZE_PERCENT} and {MAX_RESIZE_PERCENT}"
        ));
    }
    let (w, h) = img.dimensions();
    let nw = ((w as u64 * percent as u64) / 100).max(1) as u32;
    let nh = ((h as u64 * percent as u64) / 100).max(1) as u32;
    if nw == w && nh == h {
        return Ok(img);
    }
    Ok(img.resize_exact(nw, nh, filter))
}

fn ensure_png(input: &[u8]) -> Result<(), String> {
    if input.len() < 8 || &input[0..8] != b"\x89PNG\r\n\x1a\n" {
        return Err("Input is not a valid PNG file".into());
    }
    Ok(())
}

fn ensure_jpeg(input: &[u8]) -> Result<(), String> {
    if input.len() < 2 || input[0] != 0xFF || input[1] != 0xD8 {
        return Err("Input is not a valid JPEG file".into());
    }
    Ok(())
}

#[wasm_bindgen]
pub fn recompress_png(input_bytes: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    ensure_png(input_bytes)?;
    let img = decode_image(input_bytes)?;
    encode_png(&img, compression)
}

#[wasm_bindgen]
pub fn recompress_jpeg(input_bytes: &[u8], quality: u8) -> Result<Vec<u8>, String> {
    recompress_jpeg_with_options(input_bytes, quality, 0)
}

#[wasm_bindgen]
pub fn recompress_jpeg_with_options(
    input_bytes: &[u8],
    quality: u8,
    chroma_code: u8,
) -> Result<Vec<u8>, String> {
    ensure_jpeg(input_bytes)?;
    let img = decode_image(input_bytes)?;
    let ss = subsampling_from_code(chroma_code);
    encode_jpeg_inner(&img, quality, ss)
}

#[wasm_bindgen]
pub fn resize_png(input_bytes: &[u8], resize_percent: u16) -> Result<Vec<u8>, String> {
    resize_png_with_filter(input_bytes, resize_percent, 2)
}

#[wasm_bindgen]
pub fn resize_jpeg(input_bytes: &[u8], resize_percent: u16) -> Result<Vec<u8>, String> {
    resize_jpeg_with_filter(input_bytes, resize_percent, 2)
}

#[wasm_bindgen]
pub fn resize_png_with_filter(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,
) -> Result<Vec<u8>, String> {
    ensure_png(input_bytes)?;
    let img = decode_image(input_bytes)?;
    let filter = filter_from_code(filter_code)?;
    let resized = resize_by_percent(img, resize_percent, filter)?;
    encode_png(&resized, DEFAULT_PNG_COMPRESSION)
}

#[wasm_bindgen]
pub fn resize_jpeg_with_filter(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,
) -> Result<Vec<u8>, String> {
    resize_jpeg_with_filter_and_quality(input_bytes, resize_percent, filter_code, DEFAULT_JPEG_QUALITY)
}

#[wasm_bindgen]
pub fn resize_jpeg_with_filter_and_quality(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,
    quality: u8,
) -> Result<Vec<u8>, String> {
    ensure_jpeg(input_bytes)?;
    let img = decode_image(input_bytes)?;
    let filter = filter_from_code(filter_code)?;
    let resized = resize_by_percent(img, resize_percent, filter)?;
    encode_jpeg(&resized, quality)
}

#[wasm_bindgen]
pub fn estimate_png_recompress_size(input_bytes: &[u8], compression: u8) -> Result<u32, String> {
    let out = recompress_png(input_bytes, compression)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_jpeg_recompress_size(input_bytes: &[u8], quality: u8) -> Result<u32, String> {
    let out = recompress_jpeg(input_bytes, quality)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_jpeg_recompress_with_options(
    input_bytes: &[u8],
    quality: u8,
    chroma_code: u8,
) -> Result<u32, String> {
    let out = recompress_jpeg_with_options(input_bytes, quality, chroma_code)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_resize_png_size(input_bytes: &[u8], resize_percent: u16, filter_code: u8) -> Result<u32, String> {
    let out = resize_png_with_filter(input_bytes, resize_percent, filter_code)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_resize_jpeg_size(input_bytes: &[u8], resize_percent: u16, filter_code: u8, quality: u8) -> Result<u32, String> {
    let out = resize_jpeg_with_filter_and_quality(input_bytes, resize_percent, filter_code, quality)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32) {
    core_utils::set_session_max_input_bytes(max_bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}

#[wasm_bindgen]
pub fn set_risk_mode(enabled: bool) {
    core_utils::set_risk_mode(enabled);
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::codecs::jpeg::JpegEncoder;
    use image::codecs::png::PngEncoder as ImagePngEncoder;
    use image::{ImageEncoder, RgbImage, RgbaImage};

    fn sample_png() -> Vec<u8> {
        let img = RgbImage::from_fn(32, 32, |x, y| {
            image::Rgb([(x * 8) as u8, (y * 8) as u8, 128])
        });
        let mut out = Vec::new();
        ImagePngEncoder::new(&mut out)
            .write_image(img.as_raw(), 32, 32, ExtendedColorType::Rgb8)
            .unwrap();
        out
    }

    fn sample_jpeg(quality: u8) -> Vec<u8> {
        let img = RgbImage::from_fn(64, 64, |x, y| {
            image::Rgb([(x * 4) as u8, (y * 4) as u8, 128])
        });
        let mut out = Vec::new();
        let mut enc = JpegEncoder::new_with_quality(&mut out, quality);
        enc.encode(img.as_raw(), 64, 64, ExtendedColorType::Rgb8).unwrap();
        out
    }

    #[test]
    fn recompress_png_roundtrip() {
        let png = sample_png();
        let out = recompress_png(&png, 9).expect("recompress");
        ensure_png(&out).unwrap();
        assert!(out.len() > 0);
    }

    #[test]
    fn resize_png_smaller() {
        let png = sample_png();
        let out = resize_png(&png, 50).expect("resize");
        let img = decode_image(&out).unwrap();
        assert_eq!(img.width(), 16);
        assert_eq!(img.height(), 16);
    }

    #[test]
    fn recompress_jpeg_roundtrip() {
        let jpg = sample_jpeg(85);
        let out = recompress_jpeg(&jpg, 75).expect("recompress");
        ensure_jpeg(&out).unwrap();
        assert!(out.len() > 0);
    }

    #[test]
    fn recompress_jpeg_with_subsampling_444() {
        let jpg = sample_jpeg(85);
        let out420 = recompress_jpeg_with_options(&jpg, 75, 0).expect("4:2:0");
        let out444 = recompress_jpeg_with_options(&jpg, 75, 2).expect("4:4:4");
        ensure_jpeg(&out420).unwrap();
        ensure_jpeg(&out444).unwrap();
        assert!(out444.len() >= out420.len(), "4:4:4 should be >= 4:2:0 in size");
    }

    #[test]
    fn recompress_jpeg_size_order() {
        let jpg = sample_jpeg(75);
        let out420 = recompress_jpeg_with_options(&jpg, 75, 0).expect("4:2:0");
        let out422 = recompress_jpeg_with_options(&jpg, 75, 1).expect("4:2:2");
        let out444 = recompress_jpeg_with_options(&jpg, 75, 2).expect("4:4:4");
        assert!(out420.len() <= out422.len(), "4:2:0 <= 4:2:2");
        assert!(out422.len() <= out444.len(), "4:2:2 <= 4:4:4");
    }

    #[test]
    fn png_color_type_preserved_rgb() {
        let png = sample_png();
        let out = recompress_png(&png, 6).expect("recompress");
        assert!(&out[0..8] == b"\x89PNG\r\n\x1a\n");
        assert_eq!(out[25], 2, "Color type should be RGB (2), not RGBA (6)");
    }

    #[test]
    fn png_color_type_preserved_rgba() {
        let img = RgbaImage::from_fn(32, 32, |x, y| {
            image::Rgba([(x * 8) as u8, (y * 8) as u8, 128, 200])
        });
        let mut png = Vec::new();
        ImagePngEncoder::new(&mut png)
            .write_image(img.as_raw(), 32, 32, ExtendedColorType::Rgba8)
            .unwrap();
        let out = recompress_png(&png, 6).expect("recompress");
        assert_eq!(out[25], 6, "Color type should be RGBA (6)");
    }
}
