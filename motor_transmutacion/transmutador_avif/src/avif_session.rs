//! Interactive AVIF session — pre-decodes frames for scrubbing (mirrors GIF session).

use crate::avif_container::normalize_avif_input;
use crate::avif_decode::{decode_avif_frame_to_dynamic, pixel_buffer_to_dynamic};
use crate::avif_probe::{inspect_and_validate, validate_frame_index};
use image::DynamicImage;
use js_sys::Function;
use wasm_bindgen::prelude::*;
use zenavif::{AnimationDecoder, DecoderConfig, Unstoppable};

fn dynamic_to_rgba8(img: &DynamicImage) -> Vec<u8> {
    img.to_rgba8().into_raw()
}

fn load_avif_frames(input: &[u8]) -> Result<(u32, u32, Vec<Vec<u8>>), String> {
    let input = normalize_avif_input(input);
    let info = inspect_and_validate(&input)?;

    if !info.is_sequence {
        let img = decode_avif_frame_to_dynamic(&input, 0)?;
        let rgba = dynamic_to_rgba8(&img);
        return Ok((info.width, info.height, vec![rgba]));
    }

    let mut decoder = AnimationDecoder::new(&input, &DecoderConfig::default())
        .map_err(|e| format!("Failed to open animated AVIF: {}", e))?;

    let mut frames = Vec::with_capacity(info.frame_count as usize);
    while let Some(frame) = decoder
        .next_frame(&Unstoppable)
        .map_err(|e| format!("Failed to decode AVIF animation frame: {}", e))?
    {
        let img = pixel_buffer_to_dynamic(&frame.pixels)?;
        frames.push(dynamic_to_rgba8(&img));
    }

    if frames.is_empty() {
        return Err("Animated AVIF contains no decodable frames".into());
    }

    Ok((info.width, info.height, frames))
}

fn load_avif_frames_with_progress(
    input: &[u8],
    mut on_progress: impl FnMut(u32, u32),
) -> Result<(u32, u32, Vec<Vec<u8>>), String> {
    let input = normalize_avif_input(input);
    let info = inspect_and_validate(&input)?;

    if !info.is_sequence {
        on_progress(1, 1);
        let img = decode_avif_frame_to_dynamic(&input, 0)?;
        let rgba = dynamic_to_rgba8(&img);
        return Ok((info.width, info.height, vec![rgba]));
    }

    let mut decoder = AnimationDecoder::new(&input, &DecoderConfig::default())
        .map_err(|e| format!("Failed to open animated AVIF: {}", e))?;

    let total = info.frame_count;
    let mut frames = Vec::with_capacity(total as usize);
    let mut index = 0u32;
    while let Some(frame) = decoder
        .next_frame(&Unstoppable)
        .map_err(|e| format!("Failed to decode AVIF animation frame: {}", e))?
    {
        index += 1;
        on_progress(index, total);
        let img = pixel_buffer_to_dynamic(&frame.pixels)?;
        frames.push(dynamic_to_rgba8(&img));
    }

    if frames.is_empty() {
        return Err("Animated AVIF contains no decodable frames".into());
    }

    Ok((info.width, info.height, frames))
}

/// Pre-decoded RGBA frames for interactive scrubbing.
#[wasm_bindgen]
pub struct AvifSession {
    width: u32,
    height: u32,
    frames: Vec<Vec<u8>>,
}

#[wasm_bindgen]
impl AvifSession {
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

#[wasm_bindgen]
pub fn open_avif_session(input_bytes: &[u8]) -> Result<AvifSession, String> {
    core_utils::validate_input(input_bytes)?;
    let (width, height, frames) = load_avif_frames(input_bytes)?;
    Ok(AvifSession {
        width,
        height,
        frames,
    })
}

/// `on_progress(current_frame, total_frames)` — total is known up front for animations.
#[wasm_bindgen]
pub fn open_avif_session_with_progress(
    input_bytes: &[u8],
    on_progress: &Function,
) -> Result<AvifSession, String> {
    core_utils::validate_input(input_bytes)?;
    let (width, height, frames) = load_avif_frames_with_progress(input_bytes, |done, total| {
        let _ = on_progress.call2(
            &wasm_bindgen::JsValue::NULL,
            &wasm_bindgen::JsValue::from(done),
            &wasm_bindgen::JsValue::from(total),
        );
    })?;
    Ok(AvifSession {
        width,
        height,
        frames,
    })
}
