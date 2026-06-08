//! Structural alpha-channel detection from container headers (no full decode).

const PNG_SIG: &[u8] = &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

/// IHDR color types 4/6 or `tRNS` chunk present.
pub fn png_has_alpha_channel(bytes: &[u8]) -> bool {
    if bytes.len() < 26 || &bytes[0..8] != PNG_SIG {
        return false;
    }
    let color_type = bytes[25];
    if color_type == 4 || color_type == 6 {
        return true;
    }

    let limit = bytes.len().min(64 * 1024);
    let mut pos = 8usize;
    while pos + 12 <= limit {
        let data_len = u32::from_be_bytes([
            bytes[pos],
            bytes[pos + 1],
            bytes[pos + 2],
            bytes[pos + 3],
        ]) as usize;
        if &bytes[pos + 4..pos + 8] == b"tRNS" {
            return true;
        }
        pos += 12 + data_len;
    }
    false
}

/// VP8X extended header alpha bit.
pub fn webp_has_alpha_channel(bytes: &[u8]) -> bool {
    if bytes.len() < 30 {
        return false;
    }
    if &bytes[0..4] != b"RIFF" || &bytes[8..12] != b"WEBP" {
        return false;
    }

    let mut pos = 12usize;
    let limit = bytes.len().min(64 * 1024);
    while pos + 8 <= limit {
        let four_cc = &bytes[pos..pos + 4];
        let chunk_size = u32::from_le_bytes([
            bytes[pos + 4],
            bytes[pos + 5],
            bytes[pos + 6],
            bytes[pos + 7],
        ]) as usize;
        if four_cc == b"VP8X" && pos + 8 + chunk_size <= limit {
            return bytes[pos + 8] & 0x10 != 0;
        }
        pos += 8 + chunk_size;
        if chunk_size % 2 != 0 {
            pos += 1;
        }
    }
    false
}

/// GCE transparent color index flag in any frame region.
pub fn gif_has_alpha_channel(bytes: &[u8]) -> bool {
    if bytes.len() < 13 {
        return false;
    }
    if &bytes[0..3] != b"GIF" {
        return false;
    }
    for i in 0..bytes.len().saturating_sub(7) {
        if bytes[i] == 0x21 && bytes[i + 1] == 0xf9 && (bytes[i + 3] & 0x01) != 0 {
            return true;
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn png_rgb_has_no_channel() {
        let mut png = vec![
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
            0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02,
        ];
        png.extend([0x00, 0x00, 0x00]); // compression, filter, interlace
        assert!(!png_has_alpha_channel(&png));
    }

    #[test]
    fn png_rgba_has_channel() {
        let mut png = vec![
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
            0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
        ];
        png.extend([0x00, 0x00, 0x00]);
        assert!(png_has_alpha_channel(&png));
    }
}
