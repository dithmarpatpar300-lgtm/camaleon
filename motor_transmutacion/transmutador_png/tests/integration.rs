use image::{ImageBuffer, Rgba};

use transmutador_png::{png_bytes_to_jpg_bytes, transmutar_png_a_jpg_inner};

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

#[test]
fn converts_valid_png_to_jpg() {
    let png = create_valid_png_bytes();
    let jpg = png_bytes_to_jpg_bytes(&png).expect("should convert valid PNG");

    assert!(
        jpg.len() > 2,
        "JPEG output too short: {} bytes",
        jpg.len()
    );
    assert_eq!(&jpg[0..2], &[0xFF, 0xD8], "JPEG SOI magic bytes mismatch");
}

#[test]
fn rejects_empty_input() {
    let result = transmutar_png_a_jpg_inner(&[]);
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
    let result = png_bytes_to_jpg_bytes(&garbage);
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
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    ];
    fake.extend(std::iter::repeat(0x00).take(1024));
    let result = png_bytes_to_jpg_bytes(&fake);
    assert!(
        result.is_err(),
        "should reject truncated/invalid PNG after header"
    );
}

// ------------------------------------------------------------------
// Metadata tests (StripAll — SPEC §5.10)
// ------------------------------------------------------------------

/// Insert a tEXt chunk after IHDR in a valid PNG byte stream.
fn insert_text_chunk(png: &[u8]) -> Vec<u8> {
    // IHDR ends at byte 8 + 4 + 4 + 13 + 4 = 33
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

    // CRC32 for tEXt chunk
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

    let jpg = transmutar_png_a_jpg_inner(&png_with_text)
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
