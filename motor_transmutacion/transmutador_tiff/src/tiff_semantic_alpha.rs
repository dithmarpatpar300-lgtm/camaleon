//! Semantic alpha assessment for TIFF pages.

use core_utils::semantic_alpha::{assess_dynamic_image_probe, AlphaAssessment};

use crate::tiff_decode::{decode_tiff_page, inspect_and_validate, page_likely_has_alpha, validate_page_index};

pub fn assess_tiff_page_alpha(input: &[u8], page_index: u32) -> Result<AlphaAssessment, String> {
    let info = inspect_and_validate(input)?;
    validate_page_index(info.page_count, page_index)?;
    let page = &info.pages[page_index as usize];
    let has_channel = page_likely_has_alpha(page);
    if !has_channel {
        return Ok(AlphaAssessment::OPAQUE);
    }
    let img = decode_tiff_page(input, page_index)?;
    Ok(assess_dynamic_image_probe(&img, true))
}
