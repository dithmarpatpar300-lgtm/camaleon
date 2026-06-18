//! Lightweight HEIC/HEIF probe — metadata without full HEVC tile decode.
//!
//! Uses `heic::ImageInfo::from_bytes` (container + parameter sets only).

use heic::ImageInfo;

use crate::heic_validate::looks_like_heif;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HeicInfo {
    pub width: u32,
    pub height: u32,
    pub bit_depth: u8,
    pub has_alpha_channel: bool,
    pub has_thumbnail: bool,
    pub has_depth_aux: bool,
    pub has_hdr_gain_map: bool,
    pub has_exif: bool,
    pub brand: String,
}

fn map_probe_err(e: heic::ProbeError) -> String {
    match e {
        heic::ProbeError::NeedMoreData => {
            "Invalid or corrupt HEIC data: file too short".into()
        }
        heic::ProbeError::InvalidFormat => {
            "Invalid or corrupt HEIC data: not a HEIF/HEIC file".into()
        }
        heic::ProbeError::Corrupt(msg) => format!("Invalid or corrupt HEIC data: {}", msg),
        _ => format!("Invalid or corrupt HEIC data: {:?}", e),
    }
}

fn read_major_brand(input: &[u8]) -> String {
    if input.len() >= 12 && &input[4..8] == b"ftyp" {
        String::from_utf8_lossy(&input[8..12]).trim_end_matches('\0').to_string()
    } else {
        String::new()
    }
}

pub fn inspect_heic(input: &[u8]) -> Result<HeicInfo, String> {
    if input.len() < 12 {
        return Err("Invalid or corrupt HEIC data: file too short".into());
    }
    if !looks_like_heif(input) {
        return Err("Invalid or corrupt HEIC data: missing HEIF ftyp brand".into());
    }

    let info = ImageInfo::from_bytes(input).map_err(map_probe_err)?;

    if info.width == 0 || info.height == 0 {
        return Err("HEIC image has invalid empty dimensions".into());
    }

    Ok(HeicInfo {
        width: info.width,
        height: info.height,
        bit_depth: info.bit_depth,
        has_alpha_channel: info.has_alpha,
        has_thumbnail: info.has_thumbnail,
        has_depth_aux: info.has_depth,
        has_hdr_gain_map: info.has_gain_map,
        has_exif: info.has_exif,
        brand: read_major_brand(input),
    })
}

pub fn inspect_and_validate(input: &[u8]) -> Result<HeicInfo, String> {
    let info = inspect_heic(input)?;

    let pc = core_utils::pixel_count(info.width, info.height)?;
    if pc > core_utils::MAX_PIXELS && !core_utils::risk_mode_enabled() {
        return Err(
            core_utils::TransmutationError::DimensionsTooLarge {
                width: info.width,
                height: info.height,
                pixel_count: pc,
                max_pixels: core_utils::MAX_PIXELS,
            }
            .to_string(),
        );
    }

    Ok(info)
}
