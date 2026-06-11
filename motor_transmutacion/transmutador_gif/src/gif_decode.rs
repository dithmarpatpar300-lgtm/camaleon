//! GIF frame decoding — `image` composites GIF89a disposal when collecting frames.

use std::io::Cursor;

use gif::DecodeOptions;
use image::codecs::gif::GifDecoder;
use image::{AnimationDecoder, ImageDecoder, RgbaImage};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GifInfo {
    pub width: u32,
    pub height: u32,
    pub frame_count: u32,
    pub is_animated: bool,
}

/// Count frames and read logical screen size without LZW decompression (E0.1).
pub fn inspect_gif(input: &[u8]) -> Result<GifInfo, String> {
    let mut opts = DecodeOptions::new();
    opts.skip_frame_decoding(true);
    let mut decoder = opts
        .read_info(Cursor::new(input))
        .map_err(|e| format!("Invalid or corrupt GIF data: {}", e))?;
    let width = decoder.width() as u32;
    let height = decoder.height() as u32;
    let mut frame_count = 0u32;
    while decoder
        .read_next_frame()
        .map_err(|e| format!("Failed to read GIF frame headers: {}", e))?
        .is_some()
    {
        frame_count += 1;
    }
    if frame_count == 0 {
        return Err("GIF contains no frames".into());
    }
    Ok(GifInfo {
        width,
        height,
        frame_count,
        is_animated: frame_count > 1,
    })
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
    let decoder = GifDecoder::new(Cursor::new(input))
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

pub fn validate_frame_index(frame_count: u32, frame_index: u32) -> Result<(), String> {
    if frame_index >= frame_count {
        return Err(format!(
            "Frame index {} is out of range (GIF has {} frame(s))",
            frame_index, frame_count
        ));
    }
    Ok(())
}

/// Returns the fully composited RGBA buffer for `frame_index` (E0.2 — stops after target frame).
pub fn composite_gif_frame(input: &[u8], frame_index: u32) -> Result<RgbaImage, String> {
    let decoder = GifDecoder::new(Cursor::new(input))
        .map_err(|e| format!("Invalid or corrupt GIF data: {}", e))?;
    let mut idx = 0u32;
    for frame in decoder.into_frames() {
        let frame = frame.map_err(|e| format!("Failed to read GIF frames: {}", e))?;
        let buffer = frame.into_buffer();
        if idx == frame_index {
            return Ok(buffer);
        }
        idx += 1;
    }
    validate_frame_index(idx, frame_index)?;
    Err("GIF contains no frames".into())
}

pub fn composite_to_dynamic_image(
    input: &[u8],
    frame_index: u32,
) -> Result<image::DynamicImage, String> {
    let rgba = composite_gif_frame(input, frame_index)?;
    Ok(image::DynamicImage::ImageRgba8(rgba))
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::codecs::gif::{GifEncoder, Repeat};
    use image::{Delay, Frame, ImageBuffer, Rgba};

    fn create_animated_gif_two_frames() -> Vec<u8> {
        let frame1: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_pixel(8, 8, Rgba([255, 0, 0, 255]));
        let frame2: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_pixel(8, 8, Rgba([0, 255, 0, 255]));
        let mut bytes = Vec::new();
        {
            let mut encoder = GifEncoder::new(&mut bytes);
            encoder.set_repeat(Repeat::Infinite).expect("set_repeat");
            encoder
                .encode_frame(Frame::from_parts(
                    frame1,
                    0,
                    0,
                    Delay::from_numer_denom_ms(100, 1),
                ))
                .expect("frame1");
            encoder
                .encode_frame(Frame::from_parts(
                    frame2,
                    0,
                    0,
                    Delay::from_numer_denom_ms(100, 1),
                ))
                .expect("frame2");
        }
        bytes
    }

    #[test]
    fn inspect_gif_counts_frames_without_full_decode() {
        let gif = create_animated_gif_two_frames();
        let info = inspect_gif(&gif).expect("inspect");
        assert_eq!(info.frame_count, 2);
        assert!(info.is_animated);
        assert_eq!(info.width, 8);
        assert_eq!(info.height, 8);
    }

    #[test]
    fn composite_gif_frame_stops_at_index() {
        let gif = create_animated_gif_two_frames();
        let frame0 = composite_gif_frame(&gif, 0).expect("frame0");
        let frame1 = composite_gif_frame(&gif, 1).expect("frame1");
        assert_eq!(frame0.get_pixel(0, 0)[0], 255);
        assert_eq!(frame1.get_pixel(0, 0)[1], 255);
    }
}
