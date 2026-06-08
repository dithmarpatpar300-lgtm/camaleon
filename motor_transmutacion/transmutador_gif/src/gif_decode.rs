//! GIF frame decoding — `image` composites GIF89a disposal when collecting frames.

use image::codecs::gif::GifDecoder;
use image::{AnimationDecoder, ImageDecoder, RgbaImage};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GifInfo {
    pub width: u32,
    pub height: u32,
    pub frame_count: u32,
    pub is_animated: bool,
}

pub fn load_composited_frames(input: &[u8]) -> Result<(u32, u32, Vec<RgbaImage>), String> {
    load_composited_frames_with_progress(input, |_, _| {})
}

pub fn load_composited_frames_with_progress<F>(
    input: &[u8],
    mut on_frame: F,
) -> Result<(u32, u32, Vec<RgbaImage>), String>
where
    F: FnMut(u32, u32),
{
    let decoder = GifDecoder::new(std::io::Cursor::new(input))
        .map_err(|e| format!("Invalid or corrupt GIF data: {}", e))?;
    let (width, height) = decoder.dimensions();
    let mut buffers = Vec::new();
    for frame in decoder.into_frames() {
        let frame = frame.map_err(|e| format!("Failed to read GIF frames: {}", e))?;
        buffers.push(frame.into_buffer());
        let done = buffers.len() as u32;
        on_frame(done, done);
    }
    if buffers.is_empty() {
        return Err("GIF contains no frames".into());
    }
    Ok((width, height, buffers))
}

pub fn inspect_gif(input: &[u8]) -> Result<GifInfo, String> {
    let (width, height, frames) = load_composited_frames(input)?;
    let frame_count = frames.len() as u32;
    Ok(GifInfo {
        width,
        height,
        frame_count,
        is_animated: frame_count > 1,
    })
}

pub fn validate_frame_index(frame_count: u32, frame_index: u32) -> Result<(), String> {
    if frame_index >= frame_count {
        return Err(format!(
            "Frame index {} is out of range (GIF has {} frame(s))",
            frame_index, frame_count
        ));
    }
    Ok(())
}

/// Returns the fully composited RGBA buffer for `frame_index`.
pub fn composite_gif_frame(input: &[u8], frame_index: u32) -> Result<RgbaImage, String> {
    let (_width, _height, frames) = load_composited_frames(input)?;
    validate_frame_index(frames.len() as u32, frame_index)?;
    Ok(frames[frame_index as usize].clone())
}

pub fn composite_to_dynamic_image(
    input: &[u8],
    frame_index: u32,
) -> Result<image::DynamicImage, String> {
    let rgba = composite_gif_frame(input, frame_index)?;
    Ok(image::DynamicImage::ImageRgba8(rgba))
}
