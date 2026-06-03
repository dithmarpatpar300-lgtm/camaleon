use image::{ImageBuffer, Rgb};

use transmutador_jpg::{jpg_bytes_to_png_bytes, transmutar_jpg_a_png_inner};

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

#[test]
fn rejects_empty_input() {
    let result = transmutar_jpg_a_png_inner(&[]);
    assert!(result.is_err(), "empty input should be rejected");
    assert!(
        result.unwrap_err().to_lowercase().contains("empty"),
        "error should mention empty input"
    );
}

#[test]
fn converts_valid_jpeg_to_png() {
    let jpg = create_valid_jpeg_bytes();
    let png = jpg_bytes_to_png_bytes(&jpg).expect("should convert valid JPEG");

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
    let result = jpg_bytes_to_png_bytes(&garbage);
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
    let mut fake: Vec<u8> = vec![0xFF, 0xD8, 0xFF, 0xE0]; // JPEG SOI + APP0 marker
    fake.extend(std::iter::repeat(0x00).take(1024));
    let result = jpg_bytes_to_png_bytes(&fake);
    assert!(result.is_err(), "should reject truncated/invalid JPEG");
}

// ------------------------------------------------------------------
// Metadata tests (StripAll — SPEC §5.10)
// ------------------------------------------------------------------

/// Insert an APP1 EXIF segment after the SOI in a valid JPEG byte stream.
fn insert_exif_app1(jpg: &[u8]) -> Vec<u8> {
    let exif_payload = b"CamaleonTest\x00\x00";
    let app1_data = [b"Exif\0\0".as_slice(), exif_payload.as_slice()].concat();
    let seg_len = 2 + app1_data.len();

    let mut out = Vec::with_capacity(jpg.len() + 2 + seg_len + 2);
    out.extend_from_slice(&jpg[..2]); // SOI
    out.push(0xFF);
    out.push(0xE1); // APP1
    out.extend_from_slice(&(seg_len as u16).to_be_bytes());
    out.extend_from_slice(&app1_data);
    out.extend_from_slice(&jpg[2..]); // rest of JPEG after SOI
    out
}

#[test]
fn source_jpeg_exif_not_in_output_png() {
    let jpg = create_valid_jpeg_bytes();

    assert!(
        jpg.len() > 100,
        "test fixture JPEG too small"
    );

    let jpg_with_exif = insert_exif_app1(&jpg);

    assert!(
        core_utils::jpeg_contains_exif_app1(&jpg_with_exif),
        "sanity: source must contain EXIF APP1"
    );

    let png = transmutar_jpg_a_png_inner(&jpg_with_exif)
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
