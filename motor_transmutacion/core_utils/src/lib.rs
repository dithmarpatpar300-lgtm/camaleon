use core::fmt;

pub mod counting_writer;
pub mod flatten_rgba;
pub mod semantic_alpha;

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TransmutationError {
    EmptyInput,
    InputTooLarge { size: usize, max: usize },
    DimensionsTooLarge {
        width: u32,
        height: u32,
        pixel_count: u64,
        max_pixels: u64,
    },
    InvalidDimensions { reason: String },
    ConversionFailed(String),
}

impl fmt::Display for TransmutationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyInput => write!(f, "Input is empty; no bytes to transmute"),
            Self::InputTooLarge { size, max } => {
                write!(
                    f,
                    "Input size {} exceeds maximum allowed bytes ({})",
                    size, max
                )
            }
            Self::DimensionsTooLarge {
                width,
                height,
                pixel_count,
                max_pixels,
            } => {
                write!(
                    f,
                    "Image dimensions {}x{} ({} pixels) exceed maximum allowed ({} pixels)",
                    width, height, pixel_count, max_pixels
                )
            }
            Self::InvalidDimensions { reason } => {
                write!(f, "Invalid image dimensions: {}", reason)
            }
            Self::ConversionFailed(msg) => write!(f, "Transmutation failed: {}", msg),
        }
    }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

pub const MAX_INPUT_BYTES: usize = 50 * 1024 * 1024;

/// Hard ceiling for user-consented elevated sessions (desktop).
pub const ABSOLUTE_MAX_INPUT_BYTES: usize = 150 * 1024 * 1024;

pub const MAX_PIXELS: u64 = 40_000_000;

const PNG_SIGNATURE: &[u8] = &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

const JPEG_SOI: &[u8] = &[0xFF, 0xD8];

const BMP_SIGNATURE: &[u8] = &[0x42, 0x4D];

/// Maximum bytes to scan when searching for JPEG SOF markers.
/// Phone/camera JPEGs often place SOF after large APP1 (EXIF) segments (>64 KiB).
const JPEG_SCAN_LIMIT: usize = 512 * 1024;

use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

static SESSION_MAX_INPUT_BYTES: AtomicUsize = AtomicUsize::new(MAX_INPUT_BYTES);
static RISK_MODE_ENABLED: AtomicBool = AtomicBool::new(false);

/// Raised hard byte ceiling when Risk mode is active (desktop).
pub const RISK_MAX_INPUT_BYTES_DESKTOP: usize = 500 * 1024 * 1024;

/// Raised hard byte ceiling when Risk mode is active (mobile / ≤4 GB RAM).
pub const RISK_MAX_INPUT_BYTES_MOBILE: usize = 250 * 1024 * 1024;

/// Opt-in: user accepts bypassing Camaleon pixel and standard byte rails (not browser limits).
pub fn set_risk_mode(enabled: bool) {
    RISK_MODE_ENABLED.store(enabled, Ordering::Relaxed);
}

pub fn risk_mode_enabled() -> bool {
    RISK_MODE_ENABLED.load(Ordering::Relaxed)
}

pub fn absolute_max_input_bytes() -> usize {
    if risk_mode_enabled() {
        RISK_MAX_INPUT_BYTES_DESKTOP
    } else {
        ABSOLUTE_MAX_INPUT_BYTES
    }
}

/// Override per Wasm instance for elevated user-consented sessions.
pub fn set_session_max_input_bytes(max: usize) {
    let ceiling = absolute_max_input_bytes();
    let clamped = max.clamp(1, ceiling);
    SESSION_MAX_INPUT_BYTES.store(clamped, Ordering::Relaxed);
}

pub fn reset_session_max_input_bytes() {
    SESSION_MAX_INPUT_BYTES.store(MAX_INPUT_BYTES, Ordering::Relaxed);
}

pub fn session_max_input_bytes() -> usize {
    SESSION_MAX_INPUT_BYTES.load(Ordering::Relaxed)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

pub fn pixel_count(width: u32, height: u32) -> Result<u64, String> {
    let w = width as u64;
    let h = height as u64;
    w.checked_mul(h)
        .ok_or_else(|| "Pixel count overflow".to_string())
}

pub fn probe_dimensions(bytes: &[u8]) -> Result<(u32, u32), String> {
    if bytes.len() < 24 && bytes.starts_with(PNG_SIGNATURE) {
        return Err(TransmutationError::InvalidDimensions {
            reason: "Input too short to contain PNG header".into(),
        }
        .to_string());
    }

    if bytes.len() < 4 && bytes.starts_with(JPEG_SOI) {
        return Err(TransmutationError::InvalidDimensions {
            reason: "Input too short to contain JPEG header".into(),
        }
        .to_string());
    }

    if bytes.starts_with(PNG_SIGNATURE) {
        return probe_png_dimensions(bytes);
    }

    if bytes.starts_with(JPEG_SOI) && bytes.len() >= 4 {
        return probe_jpeg_dimensions(bytes);
    }

    if bytes.starts_with(BMP_SIGNATURE) {
        return probe_bmp_dimensions(bytes);
    }

    Err(TransmutationError::InvalidDimensions {
        reason: "Unknown image format; cannot probe dimensions".into(),
    }
    .to_string())
}

pub fn validate_input(bytes: &[u8]) -> Result<(), String> {
    validate_input_with_limit(bytes, session_max_input_bytes())
}

pub fn validate_input_with_limit(bytes: &[u8], max_bytes: usize) -> Result<(), String> {
    if bytes.is_empty() {
        return Err(TransmutationError::EmptyInput.to_string());
    }
    if bytes.len() > max_bytes {
        return Err(
            TransmutationError::InputTooLarge {
                size: bytes.len(),
                max: max_bytes,
            }
            .to_string(),
        );
    }

    let is_bmp = bytes.len() >= 2 && bytes.starts_with(BMP_SIGNATURE);
    let magic_known =
        bytes.starts_with(PNG_SIGNATURE) || bytes.starts_with(JPEG_SOI) || is_bmp;

    if magic_known {
        let (width, height) = probe_dimensions(bytes)?;

        if width == 0 || height == 0 {
            return Err(TransmutationError::InvalidDimensions {
                reason: format!("Zero dimension: {}x{}", width, height),
            }
            .to_string());
        }

        let pc = pixel_count(width, height)?;

        if !risk_mode_enabled() && pc > MAX_PIXELS {
            return Err(
                TransmutationError::DimensionsTooLarge {
                    width,
                    height,
                    pixel_count: pc,
                    max_pixels: MAX_PIXELS,
                }
                .to_string(),
            );
        }
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Internal format probes
// ---------------------------------------------------------------------------

fn probe_png_dimensions(bytes: &[u8]) -> Result<(u32, u32), String> {
    if bytes.len() < 24 {
        return Err(TransmutationError::InvalidDimensions {
            reason: "Truncated PNG: header too short for IHDR".into(),
        }
        .to_string());
    }

    let width = read_be_u32(bytes, 16);
    let height = read_be_u32(bytes, 20);

    if width == 0 || height == 0 {
        return Err(TransmutationError::InvalidDimensions {
            reason: format!("PNG IHDR has zero dimension: {}x{}", width, height),
        }
        .to_string());
    }

    Ok((width, height))
}

fn probe_bmp_dimensions(bytes: &[u8]) -> Result<(u32, u32), String> {
    if bytes.len() < 26 {
        return Err(TransmutationError::InvalidDimensions {
            reason: "Truncated BMP: header too short".into(),
        }
        .to_string());
    }
    if !bytes.starts_with(BMP_SIGNATURE) {
        return Err(TransmutationError::InvalidDimensions {
            reason: "Not a BMP file".into(),
        }
        .to_string());
    }

    let width = read_le_u32(bytes, 18);
    let raw_height = read_le_i32(bytes, 22);
    let height = raw_height.unsigned_abs();

    if width == 0 || height == 0 {
        return Err(TransmutationError::InvalidDimensions {
            reason: format!("BMP has zero dimension: {}x{}", width, height),
        }
        .to_string());
    }

    Ok((width, height))
}

fn read_le_u32(bytes: &[u8], offset: usize) -> u32 {
    u32::from_le_bytes([
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3],
    ])
}

fn read_le_i32(bytes: &[u8], offset: usize) -> i32 {
    i32::from_le_bytes([
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3],
    ])
}

fn probe_jpeg_dimensions(bytes: &[u8]) -> Result<(u32, u32), String> {
    let limit = bytes.len().min(JPEG_SCAN_LIMIT);
    let mut pos = 2;

    while pos + 4 <= limit {
        if bytes[pos] != 0xFF {
            return Err(TransmutationError::InvalidDimensions {
                reason: format!("Invalid JPEG: expected marker at offset {}", pos),
            }
            .to_string());
        }

        let marker = bytes[pos + 1];

        if is_sof_marker(marker) {
            if pos + 9 > limit {
                return Err(TransmutationError::InvalidDimensions {
                    reason: "Truncated JPEG: SOF marker extends past input".into(),
                }
                .to_string());
            }

            let height = read_be_u16(bytes, pos + 5) as u32;
            let width = read_be_u16(bytes, pos + 7) as u32;

            if width == 0 || height == 0 {
                return Err(TransmutationError::InvalidDimensions {
                    reason: format!("JPEG SOF has zero dimension: {}x{}", width, height),
                }
                .to_string());
            }

            return Ok((width, height));
        }

        if marker == 0xD8 || marker == 0x00 {
            pos += 1;
            continue;
        }

        if (0xD0..=0xD7).contains(&marker) {
            pos += 2;
            continue;
        }

        if marker == 0xD9 {
            break;
        }

        if marker == 0xDA {
            break;
        }

        if pos + 2 > limit {
            break;
        }

        let seg_len = read_be_u16(bytes, pos + 2) as usize;

        if seg_len < 2 {
            return Err(TransmutationError::InvalidDimensions {
                reason: format!(
                    "Invalid JPEG: marker {:02X} has length {} < 2",
                    marker, seg_len
                ),
            }
            .to_string());
        }

        pos += 2 + seg_len;
    }

    Err(TransmutationError::InvalidDimensions {
        reason: "No SOF marker found in JPEG data".into(),
    }
    .to_string())
}

fn is_sof_marker(marker: u8) -> bool {
    matches!(
        marker,
        0xC0 | 0xC1 | 0xC2 | 0xC3 | 0xC5 | 0xC6 | 0xC7 | 0xC9 | 0xCA | 0xCB | 0xCD | 0xCE | 0xCF
    )
}

// ---------------------------------------------------------------------------
// Byte-level helpers (no std dependency beyond core)
// ---------------------------------------------------------------------------

fn read_be_u16(bytes: &[u8], offset: usize) -> u16 {
    ((bytes[offset] as u16) << 8) | (bytes[offset + 1] as u16)
}

fn read_be_u32(bytes: &[u8], offset: usize) -> u32 {
    ((bytes[offset] as u32) << 24)
        | ((bytes[offset + 1] as u32) << 16)
        | ((bytes[offset + 2] as u32) << 8)
        | (bytes[offset + 3] as u32)
}

// ---------------------------------------------------------------------------
// Output validation (SPEC §5.11)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputFormat {
    Png,
    Jpeg,
    WebP,
    Avif,
}

pub fn validate_output(bytes: &[u8], format: OutputFormat) -> Result<(), String> {
    if bytes.is_empty() {
        return Err(TransmutationError::ConversionFailed(
            "encoder produced empty output".into(),
        )
        .to_string());
    }

    match format {
        OutputFormat::Png => {
            if bytes.len() < 8 || &bytes[0..8] != PNG_SIGNATURE {
                return Err(TransmutationError::ConversionFailed(
                    "output is not a valid PNG (missing signature)".into(),
                )
                .to_string());
            }
        }
        OutputFormat::Jpeg => {
            if bytes.len() < 2 || &bytes[0..2] != JPEG_SOI {
                return Err(TransmutationError::ConversionFailed(
                    "output is not a valid JPEG (missing SOI)".into(),
                )
                .to_string());
            }
        }
        OutputFormat::WebP => {
            if bytes.len() < 12 {
                return Err(TransmutationError::ConversionFailed(
                    "output is not a valid WebP (too short)".into(),
                )
                .to_string());
            }
            if &bytes[0..4] != b"RIFF" || &bytes[8..12] != b"WEBP" {
                return Err(TransmutationError::ConversionFailed(
                    "output is not a valid WebP (missing RIFF/WEBP signature)".into(),
                )
                .to_string());
            }
        }
        OutputFormat::Avif => {
            if bytes.len() < 12 {
                return Err(TransmutationError::ConversionFailed(
                    "output is not a valid AVIF (too short)".into(),
                )
                .to_string());
            }
            if &bytes[4..8] != b"ftyp" {
                return Err(TransmutationError::ConversionFailed(
                    "output is not a valid AVIF (missing ftyp box)".into(),
                )
                .to_string());
            }
        }
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Metadata scanners (StripAll policy — SPEC §5.10)
// ---------------------------------------------------------------------------

pub fn jpeg_contains_exif_app1(bytes: &[u8]) -> bool {
    if bytes.len() < 4 || &bytes[0..2] != JPEG_SOI {
        return false;
    }

    let limit = bytes.len().min(JPEG_SCAN_LIMIT);
    let mut pos = 2;

    while pos + 4 <= limit {
        if bytes[pos] != 0xFF {
            break;
        }

        let marker = bytes[pos + 1];

        if marker == 0xE1 {
            if pos + 10 > limit {
                return false;
            }
            let seg_len = read_be_u16(bytes, pos + 2) as usize;
            if seg_len >= 8 && pos + 2 + seg_len <= limit {
                let ident_start = pos + 4;
                if &bytes[ident_start..ident_start + 6] == b"Exif\0\0" {
                    return true;
                }
            }
        }

        if marker == 0xD8 || marker == 0x00 {
            pos += 1;
            continue;
        }

        if marker == 0xD9 || marker == 0xDA {
            break;
        }

        if pos + 2 > limit {
            break;
        }

        let seg_len = read_be_u16(bytes, pos + 2) as usize;
        if seg_len < 2 {
            break;
        }
        pos += 2 + seg_len;
    }

    false
}

pub fn png_contains_text_chunk(bytes: &[u8]) -> bool {
    png_has_chunk(bytes, &[0x74, 0x45, 0x58, 0x74])   // tEXt
        || png_has_chunk(bytes, &[0x69, 0x54, 0x58, 0x74]) // iTXt
}

pub fn png_contains_exif_chunk(bytes: &[u8]) -> bool {
    png_has_chunk(bytes, &[0x65, 0x58, 0x49, 0x66]) // eXIf
}

pub fn png_contains_iccp_chunk(bytes: &[u8]) -> bool {
    png_has_chunk(bytes, &[0x69, 0x43, 0x43, 0x50]) // iCCP
}

fn png_has_chunk(bytes: &[u8], chunk_type: &[u8; 4]) -> bool {
    if bytes.len() < 8 || &bytes[0..8] != PNG_SIGNATURE {
        return false;
    }

    let mut pos: usize = 8;
    let limit = bytes.len();

    while pos + 12 <= limit {
        let data_len = read_be_u32(bytes, pos) as usize;

        if &bytes[pos + 4..pos + 8] == chunk_type {
            return true;
        }

        let next = pos.saturating_add(12).saturating_add(data_len);
        if next <= pos || next > limit {
            break;
        }
        pos = next;
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    // ------------------------------------------------------------------
    // Existing tests (preserved)
    // ------------------------------------------------------------------

    #[test]
    fn rejects_empty_input() {
        let result = validate_input(&[]);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty"));
    }

    #[test]
    fn accepts_valid_non_image_input() {
        let result = validate_input(&[0u8; 1024]);
        assert!(result.is_ok());
    }

    #[test]
    fn rejects_oversized_input() {
        let result = validate_input(&[0u8; MAX_INPUT_BYTES + 1]);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("exceeds"));
    }

    #[test]
    fn error_display_is_descriptive() {
        let e = TransmutationError::EmptyInput;
        assert!(e.to_string().contains("empty"));

        let e = TransmutationError::InputTooLarge {
            size: 100,
            max: 50,
        };
        assert!(e.to_string().contains("100"));
        assert!(e.to_string().contains("50"));

        let e = TransmutationError::ConversionFailed("bad pixel".into());
        assert!(e.to_string().contains("bad pixel"));

        let e = TransmutationError::DimensionsTooLarge {
            width: 10000,
            height: 10000,
            pixel_count: 100_000_000,
            max_pixels: 40_000_000,
        };
        let msg = e.to_string();
        assert!(msg.contains("10000x10000"));
        assert!(msg.contains("100000000"));
        assert!(msg.contains("40000000"));

        let e = TransmutationError::InvalidDimensions {
            reason: "zero width".into(),
        };
        assert!(e.to_string().contains("zero width"));
    }

    // ------------------------------------------------------------------
    // Helper: create a minimal valid PNG in memory
    // ------------------------------------------------------------------

    fn make_minimal_png(width: u32, height: u32) -> Vec<u8> {
        let sig = PNG_SIGNATURE;

        let mut chunk_data = Vec::new();
        chunk_data.extend_from_slice(&width.to_be_bytes());
        chunk_data.extend_from_slice(&height.to_be_bytes());
        chunk_data.push(8); // bit depth
        chunk_data.push(2); // color type (RGB)
        chunk_data.extend_from_slice(&[0, 0, 0]); // compression, filter, interlace

        let ihdr_type = b"IHDR";
        let len = (chunk_data.len() as u32).to_be_bytes();

        let mut crc_input = Vec::new();
        crc_input.extend_from_slice(ihdr_type);
        crc_input.extend_from_slice(&chunk_data);
        let crc = crc32(&crc_input);

        let mut png = Vec::new();
        png.extend_from_slice(sig);
        png.extend_from_slice(&len);
        png.extend_from_slice(ihdr_type);
        png.extend_from_slice(&chunk_data);
        png.extend_from_slice(&crc.to_be_bytes());
        png
    }

    fn crc32(data: &[u8]) -> u32 {
        let mut crc: u32 = 0xFFFF_FFFF;
        for &byte in data {
            crc ^= byte as u32;
            for _ in 0..8 {
                if crc & 1 != 0 {
                    crc = (crc >> 1) ^ 0xEDB8_8320;
                } else {
                    crc >>= 1;
                }
            }
        }
        !crc
    }

    // ------------------------------------------------------------------
    // Helper: create a minimal valid JPEG with SOF0 in memory
    // ------------------------------------------------------------------

    fn make_minimal_jpeg(width: u16, height: u16) -> Vec<u8> {
        let mut jpg = Vec::new();
        jpg.extend_from_slice(JPEG_SOI);

        // APP0 / JFIF marker
        jpg.push(0xFF);
        jpg.push(0xE0);
        jpg.extend_from_slice(&16u16.to_be_bytes()); // length
        jpg.extend_from_slice(b"JFIF\0");
        jpg.push(1); // major version
        jpg.push(2); // minor version
        jpg.push(0); // units
        jpg.extend_from_slice(&[0, 1, 0, 1]); // x/y density
        jpg.push(0); // thumbnail w
        jpg.push(0); // thumbnail h

        // DQT marker (quantization table — placeholder)
        jpg.push(0xFF);
        jpg.push(0xDB);
        jpg.extend_from_slice(&67u16.to_be_bytes()); // length
        jpg.push(0); // table info
        jpg.extend(std::iter::repeat(1u8).take(64));

        // SOF0 marker
        jpg.push(0xFF);
        jpg.push(0xC0);
        jpg.extend_from_slice(&17u16.to_be_bytes()); // length
        jpg.push(8); // precision
        jpg.extend_from_slice(&height.to_be_bytes());
        jpg.extend_from_slice(&width.to_be_bytes());
        jpg.push(3); // 3 components
        // Y component
        jpg.push(1); // id
        jpg.push(0x22); // sampling
        jpg.push(0); // qt table
        // Cb component
        jpg.push(2);
        jpg.push(0x11);
        jpg.push(1);
        // Cr component
        jpg.push(3);
        jpg.push(0x11);
        jpg.push(1);

        jpg
    }

    // ------------------------------------------------------------------
    // pixel_count tests
    // ------------------------------------------------------------------

    #[test]
    fn pixel_count_normal() {
        assert_eq!(pixel_count(100, 200).unwrap(), 20_000);
    }

    #[test]
    fn pixel_count_zero() {
        assert_eq!(pixel_count(0, 100).unwrap(), 0);
        assert_eq!(pixel_count(100, 0).unwrap(), 0);
    }

    // ------------------------------------------------------------------
    // probe_dimensions: PNG
    // ------------------------------------------------------------------

    #[test]
    fn probe_valid_minimal_png() {
        let png = make_minimal_png(64, 32);
        let (w, h) = probe_dimensions(&png).unwrap();
        assert_eq!(w, 64);
        assert_eq!(h, 32);
    }

    #[test]
    fn probe_truncated_png_header() {
        let data = PNG_SIGNATURE.to_vec();
        let err = probe_dimensions(&data).unwrap_err();
        assert!(
            err.contains("short") || err.contains("Truncated"),
            "unexpected error: {}",
            err
        );
    }

    #[test]
    fn probe_truncated_jpeg_too_short() {
        let jpg = JPEG_SOI.to_vec();
        let err = probe_dimensions(&jpg).unwrap_err();
        assert!(err.contains("short") || err.contains("truncat"));
    }

    // ------------------------------------------------------------------
    // probe_dimensions: JPEG
    // ------------------------------------------------------------------

    #[test]
    fn probe_valid_minimal_jpeg() {
        let jpg = make_minimal_jpeg(80, 60);
        let (w, h) = probe_dimensions(&jpg).unwrap();
        assert_eq!(w, 80);
        assert_eq!(h, 60);
    }

    #[test]
    fn probe_jpeg_no_sof() {
        let mut jpg = Vec::new();
        jpg.extend_from_slice(JPEG_SOI);
        jpg.push(0xFF);
        jpg.push(0xD9); // EOI immediately
        let err = probe_dimensions(&jpg).unwrap_err();
        assert!(err.contains("No SOF"));
    }

    #[test]
    fn probe_jpeg_sof_after_large_app_segment() {
        let base = make_minimal_jpeg(4000, 3000);
        let app_data_len = 65_533usize;
        let mut large = Vec::with_capacity(4 + app_data_len + base.len() - 2);
        large.extend_from_slice(JPEG_SOI);
        large.push(0xFF);
        large.push(0xE1);
        large.extend_from_slice(&65_535u16.to_be_bytes());
        large.extend_from_slice(b"Exif\0\0");
        large.extend(std::iter::repeat(0u8).take(app_data_len - 6));
        large.extend_from_slice(&base[2..]);
        assert!(large.len() > 65_536);
        let (w, h) = probe_dimensions(&large).unwrap();
        assert_eq!(w, 4000);
        assert_eq!(h, 3000);
    }

    // ------------------------------------------------------------------
    // validate_input with dimensions
    // ------------------------------------------------------------------

    #[test]
    fn valid_small_png_passes_validate() {
        let png = make_minimal_png(64, 64);
        assert!(validate_input(&png).is_ok());
    }

    #[test]
    fn valid_small_jpeg_passes_validate() {
        let jpg = make_minimal_jpeg(64, 64);
        assert!(validate_input(&jpg).is_ok());
    }

    #[test]
    fn png_over_max_pixels_fails_validate() {
        let huge = make_minimal_png(65535, 65535);
        let err = validate_input(&huge).unwrap_err();
        assert!(err.contains("pixels"));
        assert!(err.contains("exceed"));
    }

    #[test]
    fn jpeg_over_max_pixels_fails_validate() {
        let huge = make_minimal_jpeg(65535, 65535);
        let err = validate_input(&huge).unwrap_err();
        assert!(err.contains("pixels"));
        assert!(err.contains("exceed"));
    }

    #[test]
    fn png_zero_dimensions_fails_validate() {
        let bad = make_minimal_png(0, 100);
        let err = validate_input(&bad).unwrap_err();
        assert!(err.contains("zero") || err.contains("Invalid"));
    }

    #[test]
    fn unknown_magic_skips_dimension_check() {
        let data = vec![0xAAu8; 1024];
        assert!(validate_input(&data).is_ok());
    }

    #[test]
    fn unknown_but_empty_still_fails() {
        let err = validate_input(&[]).unwrap_err();
        assert!(err.contains("empty"));
    }

    #[test]
    fn probe_unknown_format_returns_error() {
        let data = b"GIF89a............";
        let err = probe_dimensions(data).unwrap_err();
        assert!(err.contains("Unknown"));
    }

    // ------------------------------------------------------------------
    // Metadata scanner tests
    // ------------------------------------------------------------------

    fn make_jpeg_with_exif_app1() -> Vec<u8> {
        let mut jpg = Vec::new();
        jpg.extend_from_slice(JPEG_SOI);

        let exif_payload = b"CamaleonTest\x00\x00";
        let app1_data_len = 6 + exif_payload.len(); // 6 for "Exif\0\0"
        let seg_len = 2 + app1_data_len; // 2 for length field itself

        jpg.push(0xFF);
        jpg.push(0xE1); // APP1
        jpg.extend_from_slice(&(seg_len as u16).to_be_bytes());
        jpg.extend_from_slice(b"Exif\0\0");
        jpg.extend_from_slice(exif_payload);

        // APP0 / JFIF
        jpg.push(0xFF);
        jpg.push(0xE0);
        jpg.extend_from_slice(&16u16.to_be_bytes());
        jpg.extend_from_slice(b"JFIF\0");
        jpg.extend_from_slice(&[1, 2, 0, 0, 1, 0, 1, 0, 0]);

        // DQT
        jpg.push(0xFF);
        jpg.push(0xDB);
        jpg.extend_from_slice(&67u16.to_be_bytes());
        jpg.push(0);
        jpg.extend(std::iter::repeat(1u8).take(64));

        // SOF0
        jpg.push(0xFF);
        jpg.push(0xC0);
        jpg.extend_from_slice(&17u16.to_be_bytes());
        jpg.push(8);
        jpg.extend_from_slice(&8u16.to_be_bytes()); // height
        jpg.extend_from_slice(&8u16.to_be_bytes()); // width
        jpg.extend_from_slice(&[3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);

        jpg
    }

    fn make_png_with_text_chunk() -> Vec<u8> {
        let base = make_minimal_png(16, 16);
        let split = 8 + 4 + 4 + 13 + 4; // sig + len + type + IHDR data + CRC = 33

        let keyword = b"Author";
        let text = b"CamaleonTest";
        let chunk_data: Vec<u8> = keyword
            .iter()
            .copied()
            .chain(std::iter::once(0))
            .chain(text.iter().copied())
            .collect();

        let chunk_type = b"tEXt";
        let len = (chunk_data.len() as u32).to_be_bytes();

        let mut crc_input = Vec::new();
        crc_input.extend_from_slice(chunk_type);
        crc_input.extend_from_slice(&chunk_data);
        let crc = crc32(&crc_input);

        let mut png = Vec::new();
        png.extend_from_slice(&base[..split]);
        png.extend_from_slice(&len);
        png.extend_from_slice(chunk_type);
        png.extend_from_slice(&chunk_data);
        png.extend_from_slice(&crc.to_be_bytes());
        png.extend_from_slice(&base[split..]);
        png
    }

    fn make_png_with_exif_chunk() -> Vec<u8> {
        let base = make_minimal_png(16, 16);
        let split = 8 + 4 + 4 + 13 + 4;

        let chunk_type = b"eXIf";
        let chunk_data = b"CamaleonExifPayload\x00\x00";
        let len = (chunk_data.len() as u32).to_be_bytes();

        let mut crc_input = Vec::new();
        crc_input.extend_from_slice(chunk_type);
        crc_input.extend_from_slice(chunk_data);
        let crc = crc32(&crc_input);

        let mut png = Vec::new();
        png.extend_from_slice(&base[..split]);
        png.extend_from_slice(&len);
        png.extend_from_slice(chunk_type);
        png.extend_from_slice(chunk_data);
        png.extend_from_slice(&crc.to_be_bytes());
        png.extend_from_slice(&base[split..]);
        png
    }

    #[test]
    fn detects_exif_app1_in_jpeg() {
        let jpg = make_jpeg_with_exif_app1();
        assert!(jpeg_contains_exif_app1(&jpg));
    }

    #[test]
    fn detects_no_exif_in_minimal_jpeg() {
        let jpg = make_minimal_jpeg(16, 16);
        assert!(!jpeg_contains_exif_app1(&jpg));
    }

    #[test]
    fn detects_text_chunk_in_png() {
        let png = make_png_with_text_chunk();
        assert!(png_contains_text_chunk(&png));
    }

    #[test]
    fn detects_exif_chunk_in_png() {
        let png = make_png_with_exif_chunk();
        assert!(png_contains_exif_chunk(&png));
    }

    #[test]
    fn minimal_png_no_sensitive_chunks() {
        let png = make_minimal_png(16, 16);
        assert!(!png_contains_text_chunk(&png));
        assert!(!png_contains_exif_chunk(&png));
        assert!(!png_contains_iccp_chunk(&png));
    }

    #[test]
    fn jpeg_exif_scanner_handles_truncated() {
        let jpg = vec![0xFF, 0xD8, 0xFF, 0xE1];
        assert!(!jpeg_contains_exif_app1(&jpg));
    }

    #[test]
    fn png_scanner_handles_truncated() {
        let png = vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        assert!(!png_contains_text_chunk(&png));
        assert!(!png_contains_exif_chunk(&png));
    }

    // ------------------------------------------------------------------
    // Output validation tests (§5.11)
    // ------------------------------------------------------------------

    #[test]
    fn validate_output_rejects_empty() {
        let err = validate_output(&[], OutputFormat::Png).unwrap_err();
        assert!(err.contains("empty"));
    }

    #[test]
    fn validate_output_png_ok() {
        let png = make_minimal_png(8, 8);
        assert!(validate_output(&png, OutputFormat::Png).is_ok());
    }

    #[test]
    fn validate_output_png_bad_magic() {
        let err = validate_output(b"not a PNG file content", OutputFormat::Png).unwrap_err();
        assert!(err.contains("PNG") || err.contains("signature"));
    }

    #[test]
    fn validate_output_jpeg_ok() {
        let jpg = make_minimal_jpeg(8, 8);
        assert!(validate_output(&jpg, OutputFormat::Jpeg).is_ok());
    }

    #[test]
    fn validate_output_jpeg_bad_magic() {
        let err = validate_output(b"not a JPEG file content", OutputFormat::Jpeg).unwrap_err();
        assert!(err.contains("JPEG") || err.contains("SOI"));
    }

    #[test]
    fn validate_output_webp_ok() {
        let mut webp = Vec::new();
        webp.extend_from_slice(b"RIFF");
        webp.extend_from_slice(&4u32.to_le_bytes());
        webp.extend_from_slice(b"WEBP");
        assert!(validate_output(&webp, OutputFormat::WebP).is_ok());
    }

    #[test]
    fn validate_output_webp_bad_magic() {
        let err = validate_output(b"not a WebP file", OutputFormat::WebP).unwrap_err();
        assert!(err.contains("WebP") || err.contains("RIFF"));
    }

    #[test]
    fn validate_output_avif_ok() {
        let mut avif = Vec::new();
        avif.extend_from_slice(&8u32.to_le_bytes());
        avif.extend_from_slice(b"ftyp");
        avif.extend_from_slice(b"avif");
        assert!(validate_output(&avif, OutputFormat::Avif).is_ok());
    }

    #[test]
    fn validate_output_avif_bad_magic() {
        let err = validate_output(b"not an AVIF file", OutputFormat::Avif).unwrap_err();
        assert!(err.contains("AVIF") || err.contains("ftyp"));
    }

    fn minimal_bmp_header(width: u32, height: u32, bit_count: u16, compression: u32) -> Vec<u8> {
        let mut buf = vec![0u8; 54];
        buf[0..2].copy_from_slice(b"BM");
        buf[18..22].copy_from_slice(&width.to_le_bytes());
        buf[22..26].copy_from_slice(&height.to_le_bytes());
        buf[26..28].copy_from_slice(&1u16.to_le_bytes());
        buf[28..30].copy_from_slice(&bit_count.to_le_bytes());
        buf[30..34].copy_from_slice(&compression.to_le_bytes());
        buf
    }

    #[test]
    fn probe_bmp_dimensions_from_header() {
        let bmp = minimal_bmp_header(1920, 1080, 24, 0);
        let (w, h) = probe_dimensions(&bmp).expect("probe");
        assert_eq!(w, 1920);
        assert_eq!(h, 1080);
    }

    #[test]
    fn probe_bmp_negative_height_uses_absolute() {
        let mut bmp = minimal_bmp_header(64, 64, 24, 0);
        bmp[22..26].copy_from_slice(&(-64i32).to_le_bytes());
        let (w, h) = probe_dimensions(&bmp).expect("probe");
        assert_eq!(w, 64);
        assert_eq!(h, 64);
    }

    #[test]
    fn validate_input_respects_session_limit() {
        reset_session_max_input_bytes();
        set_risk_mode(false);
        let over_soft = vec![0u8; MAX_INPUT_BYTES + 1];
        assert!(validate_input(&over_soft).is_err());

        set_session_max_input_bytes(ABSOLUTE_MAX_INPUT_BYTES);
        assert!(validate_input(&over_soft).is_ok());
        reset_session_max_input_bytes();
    }

    #[test]
    fn risk_mode_bypasses_pixel_limit() {
        set_risk_mode(false);
        reset_session_max_input_bytes();
        let huge = make_minimal_png(9000, 9000);
        assert!(validate_input(&huge).is_err());

        set_risk_mode(true);
        set_session_max_input_bytes(RISK_MAX_INPUT_BYTES_DESKTOP);
        assert!(validate_input(&huge).is_ok());

        set_risk_mode(false);
        reset_session_max_input_bytes();
    }
}
