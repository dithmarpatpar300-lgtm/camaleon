//! Pixel-level semantic alpha detection.

use super::alpha_scan;
use image::RgbaImage;

/// Global budget for prepare-time alpha probes (matches BMP probe).
pub const MAX_ALPHA_PROBE_SAMPLES: usize = 8192;

/// Max long edge when downscaling for prepare-time probe decode.
pub const MAX_PROBE_EDGE: u32 = 512;

/// True when any pixel has alpha below 255 (full raster scan).
pub fn rgba_has_meaningful_alpha(rgba: &RgbaImage) -> bool {
    alpha_scan::rgba_raw_has_meaningful_alpha(rgba.as_raw())
}

/// Stratified grid sample over RGBA pixels; full scan when image is small.
pub fn rgba_has_meaningful_alpha_sampled(rgba: &RgbaImage, max_samples: usize) -> bool {
    let (w, h) = rgba.dimensions();
    let w = w as usize;
    let h = h as usize;
    if w == 0 || h == 0 {
        return false;
    }

    let total = w * h;
    if total <= max_samples {
        return rgba_has_meaningful_alpha(rgba);
    }

    let step = (total / max_samples).max(1);
    let mut sampled = 0usize;

    let raw = rgba.as_raw();
    for i in (0..total).step_by(step) {
        if sampled >= max_samples {
            break;
        }
        let alpha_idx = i * 4 + 3;
        if raw[alpha_idx] < 255 {
            return true;
        }
        sampled += 1;
    }

    false
}

/// Sample BGRA row-major pixel bytes (BMP 32-bit) without full decode.
pub fn sample_bgra_bytes_meaningful_alpha(
    bytes: &[u8],
    pixel_offset: usize,
    width: u32,
    height: u32,
    top_down: bool,
    max_samples: usize,
) -> bool {
    let w = width as usize;
    let h = height as usize;
    if w == 0 || h == 0 {
        return false;
    }

    let stride = ((32 * w + 31) / 32) * 4;
    let total_pixels = w * h;
    let step = (total_pixels / max_samples).max(1);
    let mut sampled = 0usize;

    for i in (0..total_pixels).step_by(step) {
        if sampled >= max_samples {
            break;
        }
        let x = i % w;
        let row = if top_down { i / w } else { h - 1 - (i / w) };
        let alpha_offset = pixel_offset + row * stride + x * 4 + 3;
        if alpha_offset >= bytes.len() {
            break;
        }
        if bytes[alpha_offset] < 255 {
            return true;
        }
        sampled += 1;
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba};

    #[test]
    fn all_opaque_returns_false() {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_fn(32, 32, |_, _| Rgba([10, 20, 30, 255]));
        assert!(!rgba_has_meaningful_alpha(&img));
    }

    #[test]
    fn single_transparent_pixel_returns_true() {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_fn(64, 64, |x, y| {
                if x == 0 && y == 0 {
                    Rgba([0, 0, 0, 0])
                } else {
                    Rgba([255, 255, 255, 255])
                }
            });
        assert!(rgba_has_meaningful_alpha_sampled(&img, 100));
    }

    #[test]
    fn small_image_uses_full_scan() {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_fn(4, 4, |x, _| {
                if x == 3 {
                    Rgba([0, 0, 0, 127])
                } else {
                    Rgba([255, 255, 255, 255])
                }
            });
        assert!(rgba_has_meaningful_alpha_sampled(&img, MAX_ALPHA_PROBE_SAMPLES));
    }
}
