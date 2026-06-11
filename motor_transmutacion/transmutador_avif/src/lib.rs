//! AVIF transmutator (Tier 3 Phase 3.1).
//!
//! Spike (3.1.0): `inspect_avif_meta` + `decode_avif_to_image` via zenavif (pure Rust).

mod avif_decode;
mod avif_probe;

pub use avif_decode::decode_avif_to_dynamic;
pub use avif_probe::{inspect_and_validate, inspect_avif, AvifInfo};

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct AvifMeta {
    inner: AvifInfo,
}

#[wasm_bindgen]
impl AvifMeta {
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.inner.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.inner.height
    }

    #[wasm_bindgen(getter)]
    pub fn bit_depth(&self) -> u8 {
        self.inner.bit_depth
    }

    #[wasm_bindgen(getter)]
    pub fn has_alpha_channel(&self) -> bool {
        self.inner.has_alpha_channel
    }

    #[wasm_bindgen(getter)]
    pub fn is_sequence(&self) -> bool {
        self.inner.is_sequence
    }

    #[wasm_bindgen(getter)]
    pub fn frame_count(&self) -> u32 {
        self.inner.frame_count
    }

    #[wasm_bindgen(getter)]
    pub fn lossless(&self) -> bool {
        self.inner.lossless.unwrap_or(false)
    }
}

#[wasm_bindgen]
pub fn inspect_avif_meta(input_bytes: &[u8]) -> Result<AvifMeta, String> {
    core_utils::validate_input(input_bytes)?;
    Ok(AvifMeta {
        inner: inspect_and_validate(input_bytes)?,
    })
}

/// Spike export: full decode to 8-bit RGB/RGBA PNG bytes (compression level 1) for prepare previews.
#[wasm_bindgen]
pub fn decode_avif_preview_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input_bytes)?;
    inspect_and_validate(input_bytes)?;

    let img = decode_avif_to_dynamic(input_bytes)?;
    encode_preview_png(&img)
}

fn encode_preview_png(img: &image::DynamicImage) -> Result<Vec<u8>, String> {
    use image::codecs::png::{CompressionType, FilterType, PngEncoder};
    use image::{ExtendedColorType, ImageEncoder};
    use std::io::Cursor;

    let mut buf = Cursor::new(Vec::new());
    let encoder = PngEncoder::new_with_quality(
        &mut buf,
        CompressionType::Fast,
        FilterType::Adaptive,
    );

    if img.color().has_alpha() {
        let rgba = img.to_rgba8();
        encoder
            .write_image(
                rgba.as_raw(),
                rgba.width(),
                rgba.height(),
                ExtendedColorType::Rgba8,
            )
            .map_err(|e| format!("Failed to encode preview PNG: {}", e))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(
                rgb.as_raw(),
                rgb.width(),
                rgb.height(),
                ExtendedColorType::Rgb8,
            )
            .map_err(|e| format!("Failed to encode preview PNG: {}", e))?;
    }

    Ok(buf.into_inner())
}

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32) {
    core_utils::set_session_max_input_bytes(max_bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}
