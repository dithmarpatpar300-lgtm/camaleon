//! Lightweight AVIF container probe — metadata without full AV1 tile decode.
//!
//! Uses `zenavif-parse::AvifParser` (ISOBMFF parse only). Dimensions come from
//! `primary_metadata()` / grid / animation headers, not from decoding pixels.

use zenavif_parse::AvifParser;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AvifInfo {
    pub width: u32,
    pub height: u32,
    pub bit_depth: u8,
    pub has_alpha_channel: bool,
    pub is_sequence: bool,
    pub frame_count: u32,
    pub lossless: Option<bool>,
}

fn map_parse_err(e: zenavif_parse::Error) -> String {
    format!("Invalid or corrupt AVIF data: {}", e)
}

fn brand_is_sequence(major: &[u8; 4], compatible: &[[u8; 4]]) -> bool {
    if major == b"avis" {
        return true;
    }
    compatible.iter().any(|b| b == b"avis")
}

pub fn inspect_avif(input: &[u8]) -> Result<AvifInfo, String> {
    if input.len() < 12 {
        return Err("Invalid or corrupt AVIF data: file too short".into());
    }
    if &input[4..8] != b"ftyp" {
        return Err("Invalid or corrupt AVIF data: missing ftyp box".into());
    }

    let parser = AvifParser::from_bytes(input).map_err(map_parse_err)?;

    let major = parser.major_brand();
    let compatible = parser.compatible_brands();
    let is_sequence = brand_is_sequence(major, compatible);

    let animation = parser.animation_info();
    let frame_count = animation
        .map(|a| u32::try_from(a.frame_count).unwrap_or(1).max(1))
        .unwrap_or(1);

    let meta = parser
        .primary_metadata()
        .map_err(|e| format!("Invalid or corrupt AVIF data: {}", e))?;

    let mut width = meta.max_frame_width.get();
    let mut height = meta.max_frame_height.get();

    if let Some(grid) = parser.grid_config() {
        if grid.output_width > 0 {
            width = grid.output_width;
        }
        if grid.output_height > 0 {
            height = grid.output_height;
        }
    }

    let bit_depth = parser
        .av1_config()
        .map(|c| c.bit_depth)
        .unwrap_or(meta.bit_depth);
    let lossless = meta.lossless;

    if width == 0 || height == 0 {
        return Err("AVIF image has invalid empty dimensions".into());
    }

    let has_alpha_channel = parser.alpha_data().is_some();

    Ok(AvifInfo {
        width,
        height,
        bit_depth,
        has_alpha_channel,
        is_sequence,
        frame_count,
        lossless,
    })
}

pub fn inspect_and_validate(input: &[u8]) -> Result<AvifInfo, String> {
    let info = inspect_avif(input)?;

    if info.is_sequence {
        return Err("Animated AVIF is not supported yet".into());
    }

    let pc = core_utils::pixel_count(info.width, info.height)?;
    if pc > core_utils::MAX_PIXELS {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_short_input() {
        assert!(inspect_avif(&[0u8; 8]).is_err());
    }

    #[test]
    fn rejects_non_ftyp() {
        let bogus = b"not a valid avif file at all";
        assert!(inspect_avif(bogus).is_err());
    }
}
