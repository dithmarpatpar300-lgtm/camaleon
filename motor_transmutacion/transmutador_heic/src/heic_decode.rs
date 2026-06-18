//! HEVC decode via pure-Rust `heic` crate.

use heic::{DecoderConfig, Limits, PixelLayout};
use image::{DynamicImage, RgbaImage};

use crate::heic_probe::inspect_and_validate;

fn map_decode_err(e: heic::At<heic::HeicError>) -> String {
    format!("Failed to decode HEIC: {}", e.error())
}

fn decoder_limits() -> Limits {
    let mut limits = Limits::default();
    limits.max_pixels = Some(if core_utils::risk_mode_enabled() {
        u64::from(u32::MAX)
    } else {
        core_utils::MAX_PIXELS
    });
    limits
}

pub fn decode_heic_to_rgba(input: &[u8]) -> Result<(RgbaImage, u32, u32), String> {
    inspect_and_validate(input)?;

    let layout = PixelLayout::Rgba8;

    let buf_size = heic::ImageInfo::from_bytes(input)
        .map_err(|e| format!("Invalid or corrupt HEIC data: {:?}", e))?
        .output_buffer_size(layout)
        .ok_or_else(|| "HEIC output buffer size overflow".to_string())?;

    let mut buf = vec![0u8; buf_size];
    let limits = decoder_limits();

    let (w, h) = DecoderConfig::new()
        .decode_request(input)
        .with_output_layout(layout)
        .with_limits(&limits)
        .decode_into(&mut buf)
        .map_err(map_decode_err)?;

    let img = RgbaImage::from_raw(w, h, buf)
        .ok_or_else(|| "Invalid raster buffer after HEIC decode".to_string())?;

    Ok((img, w, h))
}

pub fn decode_heic_to_dynamic(input: &[u8]) -> Result<DynamicImage, String> {
    let (rgba, _, _) = decode_heic_to_rgba(input)?;
    Ok(DynamicImage::ImageRgba8(rgba))
}

pub fn verify_heic_decodable(input: &[u8]) -> Result<(), String> {
    decode_heic_to_dynamic(input).map(|_| ())
}
