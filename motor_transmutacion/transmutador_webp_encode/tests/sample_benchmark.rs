//! Sample corpus benchmark — compares Picture-VP8 Phase 1 output
//! against Google libwebp (convertio.co) on 4 sample images.

use image::ImageReader;
use std::path::PathBuf;
use transmutador_webp_encode::encode_webp_lossy;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

#[test]
fn validate_webp_decode() {
    let output_dir = repo_root().join("docs").join("planning").join("_private").join("sample_output_vp8");

    for name in ["007", "008", "009", "011"] {
        let webp_path = output_dir.join(format!("20250827_164417_{name}.webp"));
        if !webp_path.exists() {
            println!("SKIP: {name} not found");
            continue;
        }

        match ImageReader::open(&webp_path) {
            Ok(reader) => match reader.decode() {
                Ok(img) => {
                    println!("{name}: DECODE OK → {}x{}, {:?}", img.width(), img.height(), img.color());
                }
                Err(e) => println!("{name}: DECODE FAILED → {e}"),
            },
            Err(e) => println!("{name}: OPEN FAILED → {e}"),
        }
    }
}

#[test]
fn export_samples_to_disk() {
    let names = ["007", "008", "009", "011"];
    let sizes = [
        (7_402_052u64, 6_326_740u64),
        (7_399_936, 6_316_196),
        (7_401_646, 6_319_984),
        (7_398_070, 6_215_788),
    ];

    let sample_dir = repo_root().join("docs").join("planning").join("_private").join("sample_original");
    let output_dir = repo_root().join("docs").join("planning").join("_private").join("sample_output_vp8");
    std::fs::create_dir_all(&output_dir).ok();

    for (i, name) in names.iter().enumerate() {
        let jpg_path = sample_dir.join(format!("20250827_164417_{name}.jpg"));
        let webp_path = output_dir.join(format!("20250827_164417_{name}.webp"));

        if !jpg_path.exists() {
            eprintln!("SKIP: sample {name} not found at {jpg_path:?}");
            continue;
        }

        let img = ImageReader::open(&jpg_path)
            .expect("failed to open JPEG")
            .decode()
            .expect("failed to decode JPEG");
        let rgb = img.to_rgb8();
        let (w, h) = rgb.dimensions();
        let rgb_bytes = rgb.into_raw();

        let webp = encode_webp_lossy(&rgb_bytes, w as usize, h as usize, 75)
            .expect("encoding failed");

        std::fs::write(&webp_path, &webp).expect("failed to write WebP");
        let (jpg_sz, google_sz) = sizes[i];
        println!(
            "{name}: {w}×{h}  JPG={jpg_sz}  Google={google_sz}  Ours={}  → {}",
            webp.len(),
            webp_path.display()
        );
    }
}

fn benchmark_sample(name: &str, jpg_size: u64, google_webp_size: u64) {
    let sample_dir = repo_root().join("docs").join("planning").join("_private").join("sample_original");
    let jpg_path = sample_dir.join(format!("20250827_164417_{name}.jpg"));

    if !jpg_path.exists() {
        eprintln!("SKIP: sample {name} not found at {jpg_path:?}");
        return;
    }

    let img = ImageReader::open(&jpg_path)
        .expect("failed to open JPEG")
        .decode()
        .expect("failed to decode JPEG");
    let rgb = img.to_rgb8();
    let (width, height) = rgb.dimensions();
    let rgb_bytes = rgb.into_raw();

    let t0 = std::time::Instant::now();
    let webp = encode_webp_lossy(&rgb_bytes, width as usize, height as usize, 75)
        .expect("encoding failed");
    let elapsed = t0.elapsed();

    let our_size = webp.len() as u64;
    let jpg_ratio = (our_size as f64 / jpg_size as f64) * 100.0;
    let vs_google = (our_size as f64 / google_webp_size as f64) * 100.0;

    println!("\n=== Sample {name} ===");
    println!("  Resolution:    {width}×{height}");
    println!("  JPEG size:     {jpg_size:>12} bytes");
    println!("  Google WebP:   {google_webp_size:>12} bytes");
    println!("  Our WebP:      {our_size:>12} bytes ({jpg_ratio:.1}% of JPEG, {vs_google:.1}% of Google)");
    println!("  Encode time:   {elapsed:.2?}");
    println!("  Bytes/pixel:   {:.4} (ours)", our_size as f64 / (width as f64 * height as f64));

    assert_eq!(&webp[0..4], b"RIFF");
    assert_eq!(&webp[8..12], b"WEBP");
    assert_eq!(&webp[12..16], b"VP8 ");

    let vp8_offset = 20;
    assert_eq!(webp[vp8_offset + 3], 0x9D);
    assert_eq!(webp[vp8_offset + 4], 0x01);
    assert_eq!(webp[vp8_offset + 5], 0x2A);
}

#[test]
fn benchmark_sample_007() { benchmark_sample("007", 7_402_052, 6_326_740); }
#[test]
fn benchmark_sample_008() { benchmark_sample("008", 7_399_936, 6_316_196); }
#[test]
fn benchmark_sample_009() { benchmark_sample("009", 7_401_646, 6_319_984); }
#[test]
fn benchmark_sample_011() { benchmark_sample("011", 7_398_070, 6_215_788); }
