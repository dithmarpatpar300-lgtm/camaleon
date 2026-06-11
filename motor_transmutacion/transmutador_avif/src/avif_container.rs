//! AVIF/HEIF container normalization — MIAF-compatible inputs that use `mif1` major brand.

use std::borrow::Cow;

const FTYP: &[u8; 4] = b"ftyp";
const BRAND_AVIF: &[u8; 4] = b"avif";
const BRAND_AVIS: &[u8; 4] = b"avis";
const BRAND_MIF1: &[u8; 4] = b"mif1";
const BRAND_MIAF: &[u8; 4] = b"miaf";

fn read_u32_be(bytes: &[u8], offset: usize) -> Option<u32> {
    let chunk = bytes.get(offset..offset + 4)?;
    Some(u32::from_be_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
}

fn brand_at(bytes: &[u8], offset: usize) -> Option<[u8; 4]> {
    let chunk = bytes.get(offset..offset + 4)?;
    Some([chunk[0], chunk[1], chunk[2], chunk[3]])
}

fn compatible_includes_avif(bytes: &[u8], ftyp_end: usize) -> bool {
    let mut offset = 16;
    while offset + 4 <= ftyp_end {
        if let Some(brand) = brand_at(bytes, offset) {
            if &brand == BRAND_AVIF || &brand == BRAND_AVIS {
                return true;
            }
        }
        offset += 4;
    }
    false
}

/// Many encoders (Convertio, Squoosh, etc.) emit MIAF with major brand `mif1` + compatible `avif`.
/// zenavif-parse requires major brand `avif`/`avis`; patch in-memory when safe.
pub fn normalize_avif_input(input: &[u8]) -> Cow<'_, [u8]> {
    if input.len() < 16 {
        return Cow::Borrowed(input);
    }
    if &input[4..8] != FTYP {
        return Cow::Borrowed(input);
    }

    let Some(box_size) = read_u32_be(input, 0) else {
        return Cow::Borrowed(input);
    };
    let ftyp_end = box_size as usize;
    if ftyp_end < 16 || ftyp_end > input.len() {
        return Cow::Borrowed(input);
    }

    let Some(major) = brand_at(input, 8) else {
        return Cow::Borrowed(input);
    };

    if major == *BRAND_AVIF || major == *BRAND_AVIS {
        return Cow::Borrowed(input);
    }

    if (major == *BRAND_MIF1 || major == *BRAND_MIAF) && compatible_includes_avif(input, ftyp_end) {
        let mut patched = input.to_vec();
        patched[8..12].copy_from_slice(BRAND_AVIF);
        return Cow::Owned(patched);
    }

    Cow::Borrowed(input)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn patches_mif1_major_when_avif_compatible() {
        let mut buf = vec![0u8; 32];
        buf[0..4].copy_from_slice(&28u32.to_be_bytes());
        buf[4..8].copy_from_slice(b"ftyp");
        buf[8..12].copy_from_slice(b"mif1");
        buf[12..16].copy_from_slice(&0u32.to_be_bytes());
        buf[16..20].copy_from_slice(b"mif1");
        buf[20..24].copy_from_slice(b"avif");
        buf[24..28].copy_from_slice(b"miaf");

        let norm = normalize_avif_input(&buf);
        assert!(norm.len() >= 12);
        assert_eq!(&norm[8..12], b"avif");
    }
}
