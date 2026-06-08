//! Lightweight BMP header probe — no full raster decode.

const BMP_MAGIC: [u8; 2] = [0x42, 0x4D];
const BI_RGB: u32 = 0;
const BI_RLE8: u32 = 1;
const BI_RLE4: u32 = 2;
use core_utils::semantic_alpha::{sample_bgra_bytes_meaningful_alpha, MAX_ALPHA_PROBE_SAMPLES};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BmpInfo {
    pub width: u32,
    pub height: u32,
    pub bit_count: u16,
    pub compression: u32,
    pub has_meaningful_alpha: bool,
}

fn read_u16_le(bytes: &[u8], offset: usize) -> Option<u16> {
    bytes.get(offset..offset + 2).map(|s| u16::from_le_bytes([s[0], s[1]]))
}

fn read_u32_le(bytes: &[u8], offset: usize) -> Option<u32> {
    bytes
        .get(offset..offset + 4)
        .map(|s| u32::from_le_bytes([s[0], s[1], s[2], s[3]]))
}

fn read_i32_le(bytes: &[u8], offset: usize) -> Option<i32> {
    bytes
        .get(offset..offset + 4)
        .map(|s| i32::from_le_bytes([s[0], s[1], s[2], s[3]]))
}

pub fn inspect_bmp(input: &[u8]) -> Result<BmpInfo, String> {
    if input.len() < 54 {
        return Err("Invalid or corrupt BMP data: header too short".into());
    }
    if input[0] != BMP_MAGIC[0] || input[1] != BMP_MAGIC[1] {
        return Err("Invalid or corrupt BMP data: bad signature".into());
    }

    let pixel_offset = read_u32_le(input, 10).ok_or("Invalid BMP: missing pixel offset")? as usize;
    let width = read_u32_le(input, 18).ok_or("Invalid BMP: missing width")?;
    let raw_height = read_i32_le(input, 22).ok_or("Invalid BMP: missing height")?;
    let height = raw_height.unsigned_abs();
    let bit_count = read_u16_le(input, 28).ok_or("Invalid BMP: missing bit count")?;
    let compression = read_u32_le(input, 30).ok_or("Invalid BMP: missing compression")?;

    if width == 0 || height == 0 {
        return Err(format!("Invalid BMP dimensions: {}x{}", width, height));
    }
    if pixel_offset >= input.len() {
        return Err("Invalid BMP: pixel data offset beyond file".into());
    }

    let has_meaningful_alpha = if bit_count == 32
        && (compression == BI_RGB || compression == BI_RLE8 || compression == BI_RLE4)
    {
        sample_bgra_bytes_meaningful_alpha(
            input,
            pixel_offset,
            width,
            height,
            raw_height < 0,
            MAX_ALPHA_PROBE_SAMPLES,
        )
    } else {
        false
    };

    Ok(BmpInfo {
        width,
        height,
        bit_count,
        compression,
        has_meaningful_alpha,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba};

    fn encode_bmp(rgba_fn: impl Fn(u32, u32) -> Rgba<u8>) -> Vec<u8> {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_fn(16, 16, rgba_fn);
        let mut buf = std::io::Cursor::new(Vec::new());
        img.write_to(&mut buf, image::ImageFormat::Bmp)
            .expect("encode bmp");
        buf.into_inner()
    }

    fn minimal_bmp32_with_alpha() -> Vec<u8> {
        let width = 4u32;
        let height = 4u32;
        let stride = 16usize;
        let pixel_bytes = stride * height as usize;
        let pixel_offset = 54usize;
        let mut v = vec![0u8; pixel_offset + pixel_bytes];
        let file_size = v.len() as u32;
        v[0] = 0x42;
        v[1] = 0x4d;
        v[2..6].copy_from_slice(&file_size.to_le_bytes());
        v[10..14].copy_from_slice(&(pixel_offset as u32).to_le_bytes());
        v[14..18].copy_from_slice(&40u32.to_le_bytes());
        v[18..22].copy_from_slice(&width.to_le_bytes());
        v[22..26].copy_from_slice(&(height as i32).to_le_bytes());
        v[28..30].copy_from_slice(&32u16.to_le_bytes());
        // Top-left image pixel (bottom-up row 3) with alpha 100
        v[pixel_offset + 3 * stride + 3] = 100;
        v
    }

    #[test]
    fn inspect_detects_transparent_bmp() {
        let bmp = minimal_bmp32_with_alpha();
        let info = inspect_bmp(&bmp).expect("inspect");
        assert_eq!(info.width, 4);
        assert_eq!(info.height, 4);
        assert_eq!(info.bit_count, 32);
        assert!(info.has_meaningful_alpha);
    }

    #[test]
    fn inspect_opaque_32bit_has_no_alpha() {
        let bmp = encode_bmp(|x, y| Rgba([x as u8, y as u8, 128, 255]));
        let info = inspect_bmp(&bmp).expect("inspect");
        assert!(!info.has_meaningful_alpha);
    }
}
