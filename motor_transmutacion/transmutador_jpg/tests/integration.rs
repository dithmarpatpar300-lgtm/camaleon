use image::{ImageBuffer, ImageReader, Rgb};
use std::io::Cursor;

use transmutador_jpg::{
    jpg_bytes_to_png_bytes, png_ihdr_color_type, transmutar_jpg_a_png_inner,
    validate_compression, Compression, JpgToPngOptions, DEFAULT_PNG_COMPRESSION,
    MAX_PNG_COMPRESSION, MIN_PNG_COMPRESSION,
};

fn default_options() -> JpgToPngOptions {
    JpgToPngOptions::default()
}

fn create_valid_jpeg_bytes() -> Vec<u8> {
    let img: ImageBuffer<Rgb<u8>, Vec<u8>> =
        ImageBuffer::from_fn(16, 16, |x, y| {
            let r = (x * 16) as u8;
            let g = (y * 16) as u8;
            let b = 128u8;
            Rgb([r, g, b])
        });

    let mut jpg_bytes = std::io::Cursor::new(Vec::new());
    img.write_to(&mut jpg_bytes, image::ImageFormat::Jpeg)
        .expect("test fixture: failed to encode JPEG");
    jpg_bytes.into_inner()
}

fn create_grayscale_jpeg_bytes() -> Vec<u8> {
    let img: ImageBuffer<image::Luma<u8>, Vec<u8>> =
        ImageBuffer::from_fn(1, 1, |_x, _y| image::Luma([128u8]));

    let mut jpg_bytes = Cursor::new(Vec::new());
    img.write_to(&mut jpg_bytes, image::ImageFormat::Jpeg)
        .expect("test fixture: failed to encode grayscale JPEG");
    jpg_bytes.into_inner()
}

// ------------------------------------------------------------------
// Existing tests (adapted for options parameter)
// ------------------------------------------------------------------

#[test]
fn rejects_empty_input() {
    let opts = default_options();
    let result = transmutar_jpg_a_png_inner(&[], &opts);
    assert!(result.is_err(), "empty input should be rejected");
    assert!(
        result.unwrap_err().to_lowercase().contains("empty"),
        "error should mention empty input"
    );
}

#[test]
fn converts_valid_jpeg_to_png() {
    let jpg = create_valid_jpeg_bytes();
    let opts = default_options();
    let png =
        jpg_bytes_to_png_bytes(&jpg, &opts).expect("should convert valid JPEG");

    assert!(
        png.len() > 4,
        "PNG output too short: {} bytes",
        png.len()
    );
    assert_eq!(&png[0..4], &[0x89, 0x50, 0x4E, 0x47], "PNG magic bytes mismatch");
}

#[test]
fn rejects_corrupt_bytes() {
    let garbage: Vec<u8> = (0..255).collect();
    let opts = default_options();
    let result = jpg_bytes_to_png_bytes(&garbage, &opts);
    assert!(result.is_err(), "should reject garbage bytes");
    let err = result.unwrap_err();
    assert!(
        err.contains("Invalid") || err.contains("corrupt") || err.contains("decode"),
        "error message not descriptive: {}",
        err
    );
}

#[test]
fn rejects_invalid_jpeg_after_valid_header() {
    let mut fake: Vec<u8> = vec![0xFF, 0xD8, 0xFF, 0xE0];
    fake.extend(std::iter::repeat(0x00).take(1024));
    let opts = default_options();
    let result = jpg_bytes_to_png_bytes(&fake, &opts);
    assert!(result.is_err(), "should reject truncated/invalid JPEG");
}

// ------------------------------------------------------------------
// Color-type tests (SPEC §5.4.3 P2)
// ------------------------------------------------------------------

#[test]
fn output_png_ihdr_is_rgb_not_rgba() {
    let jpg = create_valid_jpeg_bytes();
    let opts = default_options();
    let png =
        jpg_bytes_to_png_bytes(&jpg, &opts).expect("should convert JPEG");

    let color_type = png_ihdr_color_type(&png).expect("should read IHDR color type");
    assert_eq!(
        color_type, 2,
        "PNG color type should be 2 (RGB), got {}",
        color_type
    );
}

#[test]
fn grayscale_jpeg_outputs_rgb_png() {
    let jpg = create_grayscale_jpeg_bytes();
    let opts = default_options();
    let png =
        jpg_bytes_to_png_bytes(&jpg, &opts).expect("should convert grayscale JPEG");

    let color_type = png_ihdr_color_type(&png).expect("should read IHDR color type");
    assert_eq!(
        color_type, 2,
        "grayscale JPEG→PNG should output RGB (type 2), got {}",
        color_type
    );

    // Decode and verify 3-channel RGB (Luma 128 → RGB [128,128,128] ± JPEG loss)
    let decoded = ImageReader::new(Cursor::new(&png))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap()
        .to_rgb8();

    let pixel = decoded.get_pixel(0, 0);
    let [r, g, b] = pixel.0;
    assert!((100..=160).contains(&r), "R={} should be ~128", r);
    assert!((100..=160).contains(&g), "G={} should be ~128", g);
    assert!((100..=160).contains(&b), "B={} should be ~128", b);
}

#[test]
fn pixel_values_preserved_after_rgb_conversion() {
    let jpg = create_valid_jpeg_bytes();
    let opts = default_options();
    let png =
        jpg_bytes_to_png_bytes(&jpg, &opts).expect("should convert JPEG");

    let decoded = ImageReader::new(Cursor::new(&png))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap()
        .to_rgb8();

    // Source: 16×16 gradient; pixel (8,8) should be near (128,128,128)
    let pixel = decoded.get_pixel(8, 8);
    let [r, g, b] = pixel.0;
    assert!((100..=160).contains(&r), "R={} should be ~128", r);
    assert!((100..=160).contains(&g), "G={} should be ~128", g);
    assert!((100..=160).contains(&b), "B={} should be ~128", b);
}

// ------------------------------------------------------------------
// Compression validation tests
// ------------------------------------------------------------------

#[test]
fn rejects_compression_zero() {
    let err = validate_compression(0).unwrap_err();
    assert!(
        err.contains("at least 1") || err.contains("0"),
        "unexpected error: {}",
        err
    );
}

#[test]
fn rejects_compression_over_nine() {
    let err = validate_compression(10).unwrap_err();
    assert!(err.contains("exceeds") || err.contains("10"));
}

#[test]
fn accepts_compression_in_range() {
    assert!(validate_compression(MIN_PNG_COMPRESSION).is_ok());
    assert!(validate_compression(DEFAULT_PNG_COMPRESSION).is_ok());
    assert!(validate_compression(MAX_PNG_COMPRESSION).is_ok());
}

#[test]
fn higher_compression_smaller_or_equal_output() {
    let jpg = create_valid_jpeg_bytes();
    let opts_high = JpgToPngOptions { compression: 1 };
    let opts_low = JpgToPngOptions { compression: 9 };

    let png_high = jpg_bytes_to_png_bytes(&jpg, &opts_high)
        .expect("compression 1 should succeed");
    let png_low = jpg_bytes_to_png_bytes(&jpg, &opts_low)
        .expect("compression 9 should succeed");

    assert!(
        png_low.len() <= png_high.len(),
        "compression 9 ({} bytes) should be ≤ compression 1 ({} bytes)",
        png_low.len(),
        png_high.len()
    );
}

#[test]
fn default_options_compression_is_six() {
    let opts = JpgToPngOptions::default();
    assert_eq!(opts.compression, 6);
}

// ------------------------------------------------------------------
// Compression newtype tests (§5.11.4)
// ------------------------------------------------------------------

#[test]
fn compression_try_new_rejects_zero() {
    assert!(Compression::try_new(0).is_err());
}

#[test]
fn compression_try_new_accepts_range() {
    assert!(Compression::try_new(1).is_ok());
    assert!(Compression::try_new(6).is_ok());
    assert!(Compression::try_new(9).is_ok());
}

#[test]
fn compression_try_new_rejects_over_9() {
    assert!(Compression::try_new(10).is_err());
}

#[test]
fn compression_default_is_6() {
    assert_eq!(Compression::DEFAULT.value(), 6);
}

// ------------------------------------------------------------------
// Metadata tests (StripAll — SPEC §5.10)
// ------------------------------------------------------------------

fn insert_exif_app1(jpg: &[u8]) -> Vec<u8> {
    let exif_payload = b"CamaleonTest\x00\x00";
    let app1_data = [b"Exif\0\0".as_slice(), exif_payload.as_slice()].concat();
    let seg_len = 2 + app1_data.len();

    let mut out = Vec::with_capacity(jpg.len() + 2 + seg_len + 2);
    out.extend_from_slice(&jpg[..2]);
    out.push(0xFF);
    out.push(0xE1);
    out.extend_from_slice(&(seg_len as u16).to_be_bytes());
    out.extend_from_slice(&app1_data);
    out.extend_from_slice(&jpg[2..]);
    out
}

#[test]
fn source_jpeg_exif_not_in_output_png() {
    let jpg = create_valid_jpeg_bytes();

    assert!(jpg.len() > 100, "test fixture JPEG too small");

    let jpg_with_exif = insert_exif_app1(&jpg);

    assert!(
        core_utils::jpeg_contains_exif_app1(&jpg_with_exif),
        "sanity: source must contain EXIF APP1"
    );

    let opts = default_options();
    let png = transmutar_jpg_a_png_inner(&jpg_with_exif, &opts)
        .expect("should convert JPEG with EXIF to PNG");

    assert!(
        png.len() > 8 && &png[0..8] == &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
        "output should be valid PNG"
    );

    assert!(
        !core_utils::png_contains_exif_chunk(&png),
        "output PNG must not contain eXIf chunk"
    );

    let text = std::str::from_utf8(&png).unwrap_or("");
    assert!(
        !text.contains("CamaleonTest"),
        "output PNG must not contain source EXIF payload text"
    );
}

// ------------------------------------------------------------------
// IHDR color type helper test
// ------------------------------------------------------------------

#[test]
fn ihdr_color_type_reader_identifies_rgb() {
    let jpg = create_valid_jpeg_bytes();
    let opts = default_options();
    let png =
        jpg_bytes_to_png_bytes(&jpg, &opts).expect("should convert JPEG");
    assert_eq!(png_ihdr_color_type(&png), Some(2));
}

#[test]
fn ihdr_color_type_reader_rejects_non_png() {
    assert_eq!(png_ihdr_color_type(b"not a PNG"), None);
    assert_eq!(png_ihdr_color_type(&[]), None);
}
