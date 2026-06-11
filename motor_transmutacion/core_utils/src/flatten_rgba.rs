//! Alpha flatten onto an opaque RGB background (E1.2 — slice/chunk hot path for autovec).

use image::{RgbImage, RgbaImage};

/// Composites `rgba` over a solid `(bg_r, bg_g, bg_b)` background into a new RGB image.
pub fn flatten_rgba_on_background(
    rgba: &RgbaImage,
    bg_r: u8,
    bg_g: u8,
    bg_b: u8,
) -> RgbImage {
    let (w, h) = rgba.dimensions();
    let mut rgb = RgbImage::new(w, h);
    let src = rgba.as_raw();
    let dst = rgb.as_mut();

    let br = bg_r as u32;
    let bg = bg_g as u32;
    let bb = bg_b as u32;

    let (pixels, src_tail) = src.as_chunks::<4>();
    let (rows, dst_tail) = dst.as_chunks_mut::<3>();
    debug_assert!(src_tail.is_empty() && dst_tail.is_empty());

    for (px, out) in pixels.iter().zip(rows.iter_mut()) {
        let [r, g, b, a] = *px;
        let a = a as u32;
        let inv = 255 - a;
        out[0] = ((a * r as u32 + inv * br + 127) / 255) as u8;
        out[1] = ((a * g as u32 + inv * bg + 127) / 255) as u8;
        out[2] = ((a * b as u32 + inv * bb + 127) / 255) as u8;
    }

    let _ = (w, h);
    rgb
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba};

    #[test]
    fn transparent_pixel_on_white() {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_pixel(1, 1, Rgba([100, 150, 200, 0]));
        let rgb = flatten_rgba_on_background(&img, 255, 255, 255);
        assert_eq!(rgb.get_pixel(0, 0).0, [255, 255, 255]);
    }

    #[test]
    fn opaque_pixel_unchanged_on_white() {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_pixel(1, 1, Rgba([10, 20, 30, 255]));
        let rgb = flatten_rgba_on_background(&img, 255, 255, 255);
        assert_eq!(rgb.get_pixel(0, 0).0, [10, 20, 30]);
    }

    #[test]
    fn half_alpha_blends_on_black() {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_pixel(1, 1, Rgba([200, 0, 0, 128]));
        let rgb = flatten_rgba_on_background(&img, 0, 0, 0);
        assert_eq!(rgb.get_pixel(0, 0).0[0], 100);
    }
}
