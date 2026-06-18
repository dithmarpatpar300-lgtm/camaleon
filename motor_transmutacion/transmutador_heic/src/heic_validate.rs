//! HEIC/HEIF input validation — ISOBMFF ftyp probe.

const HEIF_BRANDS: &[&[u8]] = &[
    b"heic", b"heix", b"hevc", b"hevx", b"mif1", b"msf1", b"heim", b"heis",
];

pub fn looks_like_heif(input: &[u8]) -> bool {
    if input.len() < 12 {
        return false;
    }
    if &input[4..8] != b"ftyp" {
        return false;
    }
    let brand_region = &input[8..input.len().min(32)];
    HEIF_BRANDS
        .iter()
        .any(|brand| brand_region.windows(brand.len()).any(|w| w == *brand))
}

pub fn validate_heic_input(input: &[u8]) -> Result<(), String> {
    core_utils::validate_input(input)?;
    if !looks_like_heif(input) {
        return Err("Invalid or corrupt HEIC data: missing HEIF ftyp brand".into());
    }
    Ok(())
}
