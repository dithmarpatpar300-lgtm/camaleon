//! RGB → YUV 4:2:0 color space conversion.
//!
//! Converts RGB pixel data to YUV planes with 4:2:0 chroma subsampling
//! using VP8's BT.601 integer arithmetic (RFC 6386 compatible).

/// Convert an RGB buffer (width × height × 3 bytes, R/G/B interleaved)
/// to YUV 4:2:0 planes.
///
/// Returns `(y_plane, u_plane, v_plane)` where:
/// - y_plane: width × height bytes (full resolution luma)
/// - u_plane: ceil(width/2) × ceil(height/2) bytes (subsampled chroma U)
/// - v_plane: ceil(width/2) × ceil(height/2) bytes (subsampled chroma V)
pub fn rgb_to_yuv_420(rgb: &[u8], width: usize, height: usize) -> (Vec<u8>, Vec<u8>, Vec<u8>) {
    let expected_len = width * height * 3;
    assert_eq!(
        rgb.len(),
        expected_len,
        "RGB buffer size mismatch: expected {expected_len}, got {}",
        rgb.len()
    );

    let uv_width = (width + 1) / 2;
    let uv_height = (height + 1) / 2;

    let mut y = vec![0u8; width * height];
    let mut u_full = vec![0u8; width * height];
    let mut v_full = vec![0u8; width * height];

    // Full-resolution YUV conversion
    for row in 0..height {
        for col in 0..width {
            let idx = (row * width + col) * 3;
            let r = rgb[idx] as i32;
            let g = rgb[idx + 1] as i32;
            let b = rgb[idx + 2] as i32;

            // BT.601 integer conversion
            let yi = (16839 * r + 33058 * g + 6421 * b + 32768) >> 16;
            let ui = ((-9714 * r - 19081 * g + 28784 * b) >> 16) + 128;
            let vi = ((28784 * r - 24103 * g - 4683 * b) >> 16) + 128;

            y[row * width + col] = clip_u8(yi);
            u_full[row * width + col] = clip_u8(ui);
            v_full[row * width + col] = clip_u8(vi);
        }
    }

    // 4:2:0 subsampling — average each 2×2 block
    let mut u = vec![0u8; uv_width * uv_height];
    let mut v = vec![0u8; uv_width * uv_height];

    for row in 0..uv_height {
        for col in 0..uv_width {
            let y0 = row * 2;
            let x0 = col * 2;
            let y1 = (y0 + 1).min(height - 1);
            let x1 = (x0 + 1).min(width - 1);

            let u00 = u_full[y0 * width + x0] as u32;
            let u01 = u_full[y0 * width + x1] as u32;
            let u10 = u_full[y1 * width + x0] as u32;
            let u11 = u_full[y1 * width + x1] as u32;

            let v00 = v_full[y0 * width + x0] as u32;
            let v01 = v_full[y0 * width + x1] as u32;
            let v10 = v_full[y1 * width + x0] as u32;
            let v11 = v_full[y1 * width + x1] as u32;

            u[row * uv_width + col] = ((u00 + u01 + u10 + u11 + 2) >> 2) as u8;
            v[row * uv_width + col] = ((v00 + v01 + v10 + v11 + 2) >> 2) as u8;
        }
    }

    (y, u, v)
}

/// Clamp an i32 to u8 range [0, 255].
fn clip_u8(val: i32) -> u8 {
    if val < 0 {
        0
    } else if val > 255 {
        255
    } else {
        val as u8
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rgb_gray_to_yuv() {
        // Gray RGB (R=G=B=128): Y ≈ 110 (BT.601 weighted luma),
        // U ≈ 128, V ≈ 128 (no chroma for gray)
        let rgb = [128u8, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128];
        let (y, u, v) = rgb_to_yuv_420(&rgb, 2, 2);
        // BT.601 Y = 0.257*R + 0.504*G + 0.098*B ≠ R for equal RGB.
        // For R=G=B=128: Y ≈ 110 (integer approximation).
        assert!((y[0] as i32 - 110).abs() <= 2, "gray Y should be ~110, got {}", y[0]);
        assert!((u[0] as i32 - 128).abs() <= 2, "gray U should be ~128");
        assert!((v[0] as i32 - 128).abs() <= 2, "gray V should be ~128");
    }

    #[test]
    fn rgb_red_to_yuv() {
        // Pure red (R=255,G=0,B=0): Y low, V high, U mid
        let rgb = [255u8, 0, 0, 255, 0, 0, 255, 0, 0, 255, 0, 0];
        let (y, u, v) = rgb_to_yuv_420(&rgb, 2, 2);
        // Red: Y ≈ 66 (low), V > 128 (toward red)
        assert!(y[0] < 100, "red Y should be low, got {}", y[0]);
        assert!(v[0] > 150, "red V should be high, got {}", v[0]);
    }

    #[test]
    fn yuv_output_dimensions() {
        let rgb = vec![0u8; 10 * 8 * 3];
        let (y, u, v) = rgb_to_yuv_420(&rgb, 10, 8);
        assert_eq!(y.len(), 80); // 10 × 8
        assert_eq!(u.len(), 20); // 5 × 4
        assert_eq!(v.len(), 20);
    }

    #[test]
    fn yuv_odd_dimensions() {
        let rgb = vec![0u8; 15 * 13 * 3];
        let (y, u, v) = rgb_to_yuv_420(&rgb, 15, 13);
        assert_eq!(y.len(), 195); // 15 × 13
        // ceil(15/2) = 8, ceil(13/2) = 7
        assert_eq!(u.len(), 56); // 8 × 7
        assert_eq!(v.len(), 56);
    }
}
