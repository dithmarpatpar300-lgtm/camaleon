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
