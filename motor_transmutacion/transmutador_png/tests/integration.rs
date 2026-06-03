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
