use image::{ImageBuffer, Rgba};

use transmutador_bmp::{assess_bmp_alpha, transmutar_bmp_a_jpg_inner};

fn opaque_bmp_32() -> Vec<u8> {
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_fn(16, 16, |x, y| Rgba([(x * 16) as u8, (y * 16) as u8, 64, 255]));
    let mut buf = std::io::Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Bmp).unwrap();
    buf.into_inner()
}

#[test]
fn assess_opaque_bmp_not_meaningful() {
    let bmp = opaque_bmp_32();
    let a = assess_bmp_alpha(&bmp).expect("assess");
    assert!(!a.has_meaningful_alpha);
}

#[test]
fn encode_opaque_bmp_background_invariant() {
    let bmp = opaque_bmp_32();
    assert!(!assess_bmp_alpha(&bmp).unwrap().has_meaningful_alpha);
    let white = transmutar_bmp_a_jpg_inner(&bmp, 85, 255, 255, 255).expect("jpg");
    let black = transmutar_bmp_a_jpg_inner(&bmp, 85, 0, 0, 0).expect("jpg");
    assert_eq!(white, black);
}
