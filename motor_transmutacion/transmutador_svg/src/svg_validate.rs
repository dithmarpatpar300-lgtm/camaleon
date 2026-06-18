use core_utils::{pixel_count, MAX_INPUT_BYTES, MAX_PIXELS};

/// SVG/XML magic — not a raster codec; dimension probe in `validate_input` does not apply.
pub fn looks_like_svg(bytes: &[u8]) -> bool {
    if bytes.starts_with(b"<?xml") || bytes.starts_with(b"<svg") || bytes.starts_with(b"<SVG") {
        return true;
    }
    // Skip UTF-8 BOM / whitespace before root element.
    let trimmed = bytes
        .iter()
        .position(|b| !b.is_ascii_whitespace())
        .map(|i| &bytes[i..])
        .unwrap_or(bytes);
    trimmed.starts_with(b"<?xml")
        || trimmed.starts_with(b"<svg")
        || trimmed.starts_with(b"<SVG")
        || (trimmed.starts_with(b"\x1f\x8b") && trimmed.len() > 2) // gzip svgz
}

pub fn validate_svg_input(bytes: &[u8]) -> Result<(), String> {
    if bytes.is_empty() {
        return Err(core_utils::TransmutationError::EmptyInput.to_string());
    }
    let max = core_utils::session_max_input_bytes().max(MAX_INPUT_BYTES);
    if bytes.len() > max {
        return Err(
            core_utils::TransmutationError::InputTooLarge {
                size: bytes.len(),
                max,
            }
            .to_string(),
        );
    }
    if !looks_like_svg(bytes) {
        return Err("Invalid or corrupt SVG data: unrecognized document header".into());
    }
    Ok(())
}

pub fn validate_output_dimensions(out_w: u32, out_h: u32) -> Result<(), String> {
    if out_w == 0 || out_h == 0 {
        return Err("Output dimensions must be greater than zero".into());
    }
    let pc = pixel_count(out_w, out_h)?;
    if !core_utils::risk_mode_enabled() && pc > MAX_PIXELS {
        return Err(format!(
            "Output dimensions {}x{} exceed maximum pixel count ({})",
            out_w, out_h, MAX_PIXELS
        ));
    }
    Ok(())
}

/// Reject remote/local file references before parse (defense in depth).
pub fn detect_external_hrefs(bytes: &[u8]) -> bool {
    let Ok(text) = std::str::from_utf8(bytes) else {
        return false;
    };
    let lower = text.to_ascii_lowercase();
    for needle in [
        "href=\"http://",
        "href=\"https://",
        "href='http://",
        "href='https://",
        "xlink:href=\"http://",
        "xlink:href=\"https://",
        "xlink:href='http://",
        "xlink:href='https://",
        "href=\"file:",
        "xlink:href=\"file:",
    ] {
        if lower.contains(needle) {
            return true;
        }
    }
    false
}
