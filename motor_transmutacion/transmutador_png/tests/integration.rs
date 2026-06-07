use image::{ImageBuffer, ImageReader, Rgba};
use std::io::Cursor;

use transmutador_png::{
    estimate_png_to_jpg_size, png_bytes_to_jpg_bytes, transmutar_png_a_jpg_inner,
    validate_quality, BackgroundFill, PngToJpgOptions, Quality, DEFAULT_JPEG_QUALITY,
    MAX_JPEG_QUALITY, MIN_JPEG_QUALITY,
};

fn default_options() -> PngToJpgOptions {
    PngToJpgOptions::default()
}

fn create_valid_png_bytes() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_fn(16, 16, |x, y| {
            let r = (x * 16) as u8;
            let g = (y * 16) as u8;
            let b = 128u8;
            Rgba([r, g, b, 255])
        });

    let mut png_bytes = std::io::Cursor::new(Vec::new());
    img.write_to(&mut png_bytes, image::ImageFormat::Png)
        .expect("test fixture: failed to encode PNG");
    png_bytes.into_inner()
}

/// Opt-in round-trip sanity (SPEC §5.11.3): output decodes to same dimensions as input.
fn assert_roundtrip_dimensions(input: &[u8], output: &[u8]) {
    let (iw, ih) = core_utils::probe_dimensions(input).expect("input dimensions");
    let decoded = ImageReader::new(Cursor::new(output))
        .with_guessed_format()
        .expect("guess output format")
        .decode()
        .expect("decode output");
    assert_eq!(decoded.width(), iw, "width mismatch after PNG→JPG");
    assert_eq!(decoded.height(), ih, "height mismatch after PNG→JPG");
}

fn create_transparent_png_bytes() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(1, 1, |_x, _y| {
        Rgba([255, 0, 0, 128])
    });

    let mut png_bytes = Cursor::new(Vec::new());
    img.write_to(&mut png_bytes, image::ImageFormat::Png)
        .expect("test fixture: failed to encode transparent PNG");
    png_bytes.into_inner()
}

// ------------------------------------------------------------------
// Existing tests (adapted for options parameter)
// ------------------------------------------------------------------

#[test]
fn converts_valid_png_to_jpg() {
    let png = create_valid_png_bytes();
    let opts = default_options();
    let jpg =
        png_bytes_to_jpg_bytes(&png, &opts).expect("should convert valid PNG");

    assert!(jpg.len() > 2, "JPEG output too short: {} bytes", jpg.len());
    assert_eq!(&jpg[0..2], &[0xFF, 0xD8], "JPEG SOI magic bytes mismatch");
    assert_roundtrip_dimensions(&png, &jpg);
}

#[test]
fn roundtrip_via_inner_pipeline() {
    let png = create_valid_png_bytes();
    let jpg = transmutar_png_a_jpg_inner(&png, &default_options()).expect("inner pipeline");
    assert_roundtrip_dimensions(&png, &jpg);
}

#[test]
fn rejects_empty_input() {
    let opts = default_options();
    let result = transmutar_png_a_jpg_inner(&[], &opts);
    assert!(result.is_err(), "should reject empty input");
    let err = result.unwrap_err();
    assert!(
        err.contains("empty"),
        "error message not descriptive: {}",
        err
    );
}

#[test]
fn rejects_corrupt_bytes() {
    let garbage: Vec<u8> = (0..255).collect();
    let opts = default_options();
    let result = png_bytes_to_jpg_bytes(&garbage, &opts);
    assert!(result.is_err(), "should reject garbage bytes");
    let err = result.unwrap_err();
    assert!(
        err.contains("Invalid") || err.contains("corrupt") || err.contains("decode"),
        "error message not descriptive: {}",
        err
    );
}

#[test]
fn rejects_truncated_png() {
    let mut fake: Vec<u8> = vec![
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    ];
    fake.extend(std::iter::repeat(0x00).take(1024));
    let opts = default_options();
    let result = png_bytes_to_jpg_bytes(&fake, &opts);
    assert!(
        result.is_err(),
        "should reject truncated/invalid PNG after header"
    );
}

// ------------------------------------------------------------------
// Alpha flatten tests
// ------------------------------------------------------------------

#[test]
fn flatten_transparent_pixel_on_white() {
    let png = create_transparent_png_bytes();
    let opts = PngToJpgOptions {
        quality: 100,
        background: BackgroundFill::WHITE,
    };
    let jpg = png_bytes_to_jpg_bytes(&png, &opts)
        .expect("should convert transparent PNG");

    let decoded = ImageReader::new(Cursor::new(&jpg))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap()
        .to_rgb8();

    let pixel = decoded.get_pixel(0, 0);
    let [r, g, b] = pixel.0;

    // Expected RGB ≈ (255, 127, 127) before JPEG loss; allow tolerance at q=100.
    assert!(r > 200, "red channel {} should be high (white bg)", r);
    assert!(g > 100, "green channel {} should be grayish (blended with white)", g);
    assert!(b > 100, "blue channel {} should be grayish (blended with white)", b);
}

#[test]
fn flatten_transparent_pixel_on_black() {
    let png = create_transparent_png_bytes();
    let opts = PngToJpgOptions {
        quality: 100,
        background: BackgroundFill {
            r: 0,
            g: 0,
            b: 0,
        },
    };
    let jpg = png_bytes_to_jpg_bytes(&png, &opts)
        .expect("should convert transparent PNG");

    let decoded = ImageReader::new(Cursor::new(&jpg))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap()
        .to_rgb8();

    let pixel = decoded.get_pixel(0, 0);
    let [r, g, b] = pixel.0;

    // Red (255,0,0) at alpha 128 on black (0,0,0):
    // R = (128*255 + 127*0 + 127)/255 = 32640+127/255 ≈ 128
    // G/B ≈ 0
    assert!(r > 100 && r < 160, "red channel {} should be ~128", r);
    assert!(g < 30, "green channel {} should be near 0", g);
    assert!(b < 30, "blue channel {} should be near 0", b);
}

#[test]
fn opaque_rgb_not_altered_by_flatten_pass() {
    let png = create_valid_png_bytes(); // opaque RGBA
    let opts = default_options();
    let jpg = png_bytes_to_jpg_bytes(&png, &opts)
        .expect("should convert opaque PNG");

    let decoded = ImageReader::new(Cursor::new(&jpg))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap()
        .to_rgb8();

    // Check a pixel at (8,8) — should be a color near (128,128,128)
    let pixel = decoded.get_pixel(8, 8);
    let [r, g, b] = pixel.0;
    // Allow JPEG lossiness
    assert!((100..=160).contains(&r), "red {} should be ~128", r);
    assert!((100..=160).contains(&g), "green {} should be ~128", g);
    assert!((100..=160).contains(&b), "blue {} should be ~128", b);
}

// ------------------------------------------------------------------
// Quality validation tests
// ------------------------------------------------------------------

#[test]
fn rejects_quality_zero() {
    let err = validate_quality(0).unwrap_err();
    assert!(
        err.contains("at least 1") || err.contains("0"),
        "unexpected error: {}",
        err
    );
}

#[test]
fn rejects_quality_over_100() {
    let err = validate_quality(101).unwrap_err();
    assert!(err.contains("exceeds") || err.contains("101"));
}

#[test]
fn accepts_quality_in_range() {
    assert!(validate_quality(MIN_JPEG_QUALITY).is_ok());
    assert!(validate_quality(DEFAULT_JPEG_QUALITY).is_ok());
    assert!(validate_quality(MAX_JPEG_QUALITY).is_ok());
}

#[test]
fn lower_quality_produces_smaller_or_equal_output() {
    let png = create_valid_png_bytes();
    let opts_high = PngToJpgOptions {
        quality: 95,
        background: BackgroundFill::WHITE,
    };
    let opts_low = PngToJpgOptions {
        quality: 50,
        background: BackgroundFill::WHITE,
    };

    let jpg_high = png_bytes_to_jpg_bytes(&png, &opts_high)
        .expect("q95 should succeed");
    let jpg_low = png_bytes_to_jpg_bytes(&png, &opts_low)
        .expect("q50 should succeed");

    assert!(
        jpg_low.len() <= jpg_high.len(),
        "q50 ({} bytes) should be ≤ q95 ({} bytes)",
        jpg_low.len(),
        jpg_high.len()
    );
}

// ------------------------------------------------------------------
// Metadata tests (StripAll — SPEC §5.10)
// ------------------------------------------------------------------

fn insert_text_chunk(png: &[u8]) -> Vec<u8> {
    let ihdr_end = 8 + 4 + 4 + 13 + 4;

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

    let mut out = Vec::new();
    out.extend_from_slice(&png[..ihdr_end]);
    out.extend_from_slice(&len);
    out.extend_from_slice(chunk_type);
    out.extend_from_slice(&chunk_data);
    out.extend_from_slice(&crc.to_be_bytes());
    out.extend_from_slice(&png[ihdr_end..]);
    out
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

#[test]
fn source_png_text_not_in_output_jpeg() {
    let png = create_valid_png_bytes();
    let png_with_text = insert_text_chunk(&png);

    assert!(
        core_utils::png_contains_text_chunk(&png_with_text),
        "sanity: source must contain tEXt chunk"
    );

    let opts = default_options();
    let jpg = transmutar_png_a_jpg_inner(&png_with_text, &opts)
        .expect("should convert PNG with tEXt to JPEG");

    assert!(
        jpg.len() > 2 && &jpg[0..2] == &[0xFF, 0xD8],
        "output should be valid JPEG"
    );

    assert!(
        !core_utils::jpeg_contains_exif_app1(&jpg),
        "output JPEG must not contain EXIF APP1"
    );

    let text = std::str::from_utf8(&jpg).unwrap_or("");
    assert!(
        !text.contains("CamaleonTest"),
        "output JPEG must not contain source tEXt payload text"
    );
}

// ------------------------------------------------------------------
// Options tests
// ------------------------------------------------------------------

#[test]
fn default_options_quality_is_85() {
    let opts = PngToJpgOptions::default();
    assert_eq!(opts.quality, 85);
    assert_eq!(opts.background, BackgroundFill::WHITE);
}

#[test]
fn background_fill_white_const() {
    assert_eq!(BackgroundFill::WHITE.r, 255);
    assert_eq!(BackgroundFill::WHITE.g, 255);
    assert_eq!(BackgroundFill::WHITE.b, 255);
}

// ------------------------------------------------------------------
// Quality newtype tests (§5.11.4)
// ------------------------------------------------------------------

#[test]
fn quality_try_new_rejects_zero() {
    assert!(Quality::try_new(0).is_err());
}

#[test]
fn quality_try_new_accepts_range() {
    assert!(Quality::try_new(1).is_ok());
    assert!(Quality::try_new(85).is_ok());
    assert!(Quality::try_new(100).is_ok());
}

#[test]
fn quality_try_new_rejects_over_100() {
    assert!(Quality::try_new(101).is_err());
}

#[test]
fn quality_default_is_85() {
    assert_eq!(Quality::DEFAULT.value(), 85);
}

// ------------------------------------------------------------------
// Custom background tests (v0.5.6)
// ------------------------------------------------------------------

#[test]
fn custom_background_red_flattens_correctly() {
    let png = create_transparent_png_bytes(); // (255,0,0,128)
    let opts = PngToJpgOptions {
        quality: 100,
        background: BackgroundFill {
            r: 0,
            g: 0,
            b: 255,
        }, // blue
    };
    let jpg = png_bytes_to_jpg_bytes(&png, &opts)
        .expect("should convert with custom bg");

    let decoded = ImageReader::new(Cursor::new(&jpg))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap()
        .to_rgb8();

    let pixel = decoded.get_pixel(0, 0);
    let [r, _g, b] = pixel.0;

    // Red at alpha 128 on blue (0,0,255):
    // R = (128*255 + 127*0 + 127)/255 ≈ 128
    // B = (128*0 + 127*255 + 127)/255 ≈ 128
    assert!(r > 100 && r < 160, "red channel {} should be ~128", r);
    assert!(b > 100 && b < 160, "blue channel {} should be ~128 (blue bg)", b);
}

#[test]
fn custom_background_opaque_image_unaffected() {
    let png = create_valid_png_bytes(); // opaque RGBA (255,255,255,255 at some pixels)
    let opts = PngToJpgOptions {
        quality: 100,
        background: BackgroundFill {
            r: 0,
            g: 255,
            b: 0,
        }, // green — should not affect opaque pixels
    };
    let jpg = png_bytes_to_jpg_bytes(&png, &opts)
        .expect("should convert opaque PNG with non-white bg");

    let decoded = ImageReader::new(Cursor::new(&jpg))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap()
        .to_rgb8();

    let pixel = decoded.get_pixel(8, 8);
    let [r, g, b] = pixel.0;
    // Pixel near (128,128,128) — should not be shifted green
    assert!((100..=160).contains(&r), "red should be ~128, got {}", r);
    assert!((100..=160).contains(&g), "green should be ~128, got {}", g);
    assert!((100..=160).contains(&b), "blue should be ~128, got {}", b);
}

#[test]
fn with_options_quality_zero_rejected() {
    let err = validate_quality(0).unwrap_err();
    assert!(err.contains("at least 1") || err.contains("0"));
}

#[test]
fn estimate_size_matches_full_transmute() {
    let png = create_valid_png_bytes();
    let opts = default_options();
    let full = transmutar_png_a_jpg_inner(&png, &opts).expect("transmute");
    let estimated = estimate_png_to_jpg_size(
        &png,
        opts.quality,
        opts.background.r,
        opts.background.g,
        opts.background.b,
    )
    .expect("estimate");
    assert_eq!(estimated as usize, full.len());
}
