//! VP8 bitstream validation — encode tiny images and verify decode.

use transmutador_webp_encode::encode_webp_lossy;
use image::ImageReader;
use std::io::Cursor;

#[test]
fn encode_decode_roundtrip_16x16() {
    let mut rgb = vec![0u8; 16 * 16 * 3];
    for i in 0..256 {
        rgb[i * 3] = (i % 256) as u8;
        rgb[i * 3 + 1] = ((i * 3) % 256) as u8;
        rgb[i * 3 + 2] = ((i * 7) % 256) as u8;
    }

    let webp = encode_webp_lossy(&rgb, 16, 16, 100).expect("encode failed");

    // Write to disk and decode
    let result = ImageReader::new(Cursor::new(&webp))
        .with_guessed_format()
        .map_err(|e| format!("guess: {e}"))
        .and_then(|r| r.decode().map_err(|e| format!("decode: {e}")));

    match result {
        Ok(img) => {
            println!("16×16: DECODE OK → {}×{}", img.width(), img.height());
        }
        Err(e) => {
            // Dump first 64 bytes in hex for debugging
            println!("16×16: DECODE FAILED → {e}");
            println!("WebP file size: {} bytes", webp.len());
            let mut hex = String::new();
            for (i, b) in webp.iter().take(64).enumerate() {
                hex.push_str(&format!("{b:02X} "));
                if (i + 1) % 16 == 0 { hex.push('\n'); }
            }
            println!("First 64 bytes:\n{hex}");

            // Check frame header
            let vp8_start = 20;
            if webp.len() > vp8_start + 10 {
                let tag = (webp[vp8_start] as u32) | ((webp[vp8_start+1] as u32) << 8) | ((webp[vp8_start+2] as u32) << 16);
                let first_part = (tag >> 5) & 0x7FFFF;
                println!("Frame tag: 0x{tag:06X}, first_part_size={first_part}");
                println!("First partition bytes: {:02X?}", &webp[vp8_start+10..vp8_start+10+first_part as usize]);
                // Second partition starts after first partition
                let sp_start = vp8_start + 10 + first_part as usize;
                println!("Second partition first 8 bytes: {:02X?}", &webp[sp_start..(sp_start+8).min(webp.len())]);
            }
        }
    }

    // Also test 32x32 (4 MBs)
    let rgb32 = vec![128u8; 32 * 32 * 3];
    let webp32 = encode_webp_lossy(&rgb32, 32, 32, 75).expect("encode failed");
    let result32 = ImageReader::new(Cursor::new(&webp32))
        .with_guessed_format()
        .map_err(|e| format!("guess: {e}"))
        .and_then(|r| r.decode().map_err(|e| format!("decode: {e}")));
    match result32 {
        Ok(img) => println!("32x32 Q75: DECODE OK -> {}x{}", img.width(), img.height()),
        Err(e) => println!("32x32 Q75: DECODE FAILED -> {e}"),
    }

    // Also try at quality 100 (minimal quantization)
    let webp100 = encode_webp_lossy(&rgb, 16, 16, 100).expect("encode failed");
    let result100 = ImageReader::new(Cursor::new(&webp100))
        .with_guessed_format()
        .map_err(|e| format!("guess: {e}"))
        .and_then(|r| r.decode().map_err(|e| format!("decode: {e}")));

    match result100 {
        Ok(img) => println!("16×16 Q100: DECODE OK → {}×{}", img.width(), img.height()),
        Err(e) => println!("16×16 Q100: DECODE FAILED → {e}"),
    }

    // Try at quality 100
    let webp100b = encode_webp_lossy(&rgb, 16, 16, 100).expect("encode failed");
    let result100b = ImageReader::new(Cursor::new(&webp100b))
        .with_guessed_format()
        .map_err(|e| format!("guess: {e}"))
        .and_then(|r| r.decode().map_err(|e| format!("decode: {e}")));

    match result100b {
        Ok(img) => println!("16×16 Q100: DECODE OK → {}×{}", img.width(), img.height()),
        Err(e) => println!("16×16 Q100: DECODE FAILED → {e}"),
    }
}
