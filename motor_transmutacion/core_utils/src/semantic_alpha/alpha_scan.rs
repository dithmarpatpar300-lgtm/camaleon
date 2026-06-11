//! Full-raster meaningful-alpha detection (E1.3 — Wasm SIMD128 + scalar fallback).

/// True when any RGBA pixel has alpha &lt; 255 in a tightly packed `width×height×4` buffer.
pub fn rgba_raw_has_meaningful_alpha(raw: &[u8]) -> bool {
    if raw.len() < 4 {
        return false;
    }
    #[cfg(target_arch = "wasm32")]
    {
        // SAFETY: crate Wasm builds use `+simd128`; body uses simd128 ops only.
        return unsafe { simd128::rgba_raw_has_meaningful_alpha(raw) };
    }
    #[cfg(not(target_arch = "wasm32"))]
    rgba_raw_has_meaningful_alpha_scalar(raw)
}

/// Scalar path — host tests and SIMD tail.
#[inline]
pub fn rgba_raw_has_meaningful_alpha_scalar(raw: &[u8]) -> bool {
    raw.chunks_exact(4).any(|px| px[3] < 255)
}

#[cfg(target_arch = "wasm32")]
mod simd128 {
    use core::arch::wasm32::*;

    #[inline]
    unsafe fn alpha_mask() -> v128 {
        u8x16(
            0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
        )
    }

    #[target_feature(enable = "simd128")]
    pub unsafe fn rgba_raw_has_meaningful_alpha(raw: &[u8]) -> bool {
        let ptr = raw.as_ptr();
        let len = raw.len();
        let mask = alpha_mask();
        let opaque = mask;
        let mut offset = 0usize;

        while offset + 64 <= len {
            let base = ptr.add(offset);
            for block in 0..4 {
                let v = v128_load(base.add(block * 16) as *const v128);
                let masked = v128_and(v, mask);
                let eq = u8x16_eq(masked, opaque);
                if !u8x16_all_true(eq) {
                    return true;
                }
            }
            offset += 64;
        }

        while offset + 16 <= len {
            let v = v128_load(ptr.add(offset) as *const v128);
            let masked = v128_and(v, mask);
            let eq = u8x16_eq(masked, opaque);
            if !u8x16_all_true(eq) {
                return true;
            }
            offset += 16;
        }

        super::rgba_raw_has_meaningful_alpha_scalar(&raw[offset..])
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba};

    fn make_opaque(w: u32, h: u32) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
        ImageBuffer::from_fn(w, h, |_, _| Rgba([1, 2, 3, 255]))
    }

    #[test]
    fn scalar_empty_and_short() {
        assert!(!rgba_raw_has_meaningful_alpha_scalar(&[]));
        assert!(!rgba_raw_has_meaningful_alpha_scalar(&[1, 2, 3]));
    }

    #[test]
    fn scalar_finds_single_transparent_pixel() {
        let mut img = make_opaque(64, 64);
        img.put_pixel(40, 40, Rgba([0, 0, 0, 0]));
        assert!(rgba_raw_has_meaningful_alpha_scalar(img.as_raw()));
    }

    #[test]
    fn scalar_all_opaque_large() {
        let img = make_opaque(512, 512);
        assert!(!rgba_raw_has_meaningful_alpha_scalar(img.as_raw()));
    }

    #[test]
    fn public_api_matches_scalar_on_host() {
        let mut img = make_opaque(128, 128);
        img.put_pixel(0, 0, Rgba([9, 9, 9, 127]));
        let raw = img.as_raw();
        assert_eq!(
            rgba_raw_has_meaningful_alpha(raw),
            rgba_raw_has_meaningful_alpha_scalar(raw)
        );
    }

    #[test]
    fn public_api_opaque_image() {
        let img = make_opaque(200, 150);
        assert!(!rgba_raw_has_meaningful_alpha(img.as_raw()));
    }

    #[test]
    fn transparent_at_tail_boundary() {
        let mut img = make_opaque(5, 5);
        img.put_pixel(4, 4, Rgba([0, 0, 0, 1]));
        assert!(rgba_raw_has_meaningful_alpha(img.as_raw()));
    }
}
