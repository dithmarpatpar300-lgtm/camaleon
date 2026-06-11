//! Lightweight AVIF container probe — metadata without full AV1 tile decode.
//!
//! Uses `zenavif-parse::AvifParser` (ISOBMFF parse only). Dimensions come from
//! `primary_metadata()` / grid / animation headers, not from decoding pixels.

use crate::avif_container::normalize_avif_input;
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

/// True only when the container has an animation track with more than one frame.
/// The `avis` compatible brand alone is not sufficient — many still-image encoders
/// declare `avis` without an `moov` animation sample table.
pub fn is_animated_avif(parser: &AvifParser) -> bool {
    parser
        .animation_info()
        .is_some_and(|info| info.frame_count > 1)
}

pub fn validate_frame_index(frame_count: u32, frame_index: u32) -> Result<(), String> {
    if frame_count == 0 {
        return Err("AVIF has no decodable frames".into());
    }
    if frame_index >= frame_count {
        return Err(format!(
            "AVIF frame index {} is out of range ({} frame{})",
            frame_index,
            frame_count,
            if frame_count == 1 { "" } else { "s" }
        ));
    }
    Ok(())
}

pub fn inspect_avif(input: &[u8]) -> Result<AvifInfo, String> {
    let input = normalize_avif_input(input);
    if input.len() < 12 {
        return Err("Invalid or corrupt AVIF data: file too short".into());
    }
    if &input[4..8] != b"ftyp" {
        return Err("Invalid or corrupt AVIF data: missing ftyp box".into());
    }

    let parser = AvifParser::from_bytes(&input).map_err(map_parse_err)?;

    let is_sequence = is_animated_avif(&parser);

    let frame_count = if is_sequence {
        parser
            .animation_info()
            .map(|a| u32::try_from(a.frame_count).unwrap_or(1).max(1))
            .unwrap_or(1)
    } else {
        1
    };

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

    let has_alpha_channel = parser.alpha_data().is_some()
        || parser
            .animation_info()
            .is_some_and(|info| info.has_alpha);

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

    #[test]
    fn avis_brand_alone_is_not_animated() {
        let mut bogus = vec![0u8; 32];
        bogus[4..8].copy_from_slice(b"ftyp");
        bogus[8..12].copy_from_slice(b"avis");
        let err = inspect_avif(&bogus);
        assert!(err.is_err());
        if let Ok(info) = err {
            assert!(!info.is_sequence);
        }
    }
}
