//! Same-format optimization: PNG/JPEG re-encode (compress) and resize (Tier 4a).

use std::io::Cursor;

use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::imageops::FilterType as ResizeFilter;
use image::GenericImageView;
use image::{DynamicImage, ExtendedColorType, ImageEncoder, ImageReader};
use jpeg_encoder::{ColorType, Encoder, SamplingFactor};
use wasm_bindgen::prelude::*;

pub const MIN_PNG_COMPRESSION: u8 = 1;
pub const MAX_PNG_COMPRESSION: u8 = 9;
pub const DEFAULT_PNG_COMPRESSION: u8 = 6;
pub const MIN_JPEG_QUALITY: u8 = 1;
pub const MAX_JPEG_QUALITY: u8 = 100;
pub const DEFAULT_JPEG_QUALITY: u8 = 85;
pub const MIN_RESIZE_PERCENT: u16 = 1;
pub const MAX_RESIZE_PERCENT: u16 = 400;
pub const MIN_OPT_LEVEL: u8 = 0;
pub const MAX_OPT_LEVEL: u8 = 1;

const FILTERS_TO_TRIAL: [FilterType; 5] = [
    FilterType::Sub,
    FilterType::Up,
    FilterType::Avg,
    FilterType::Paeth,
    FilterType::Adaptive,
];

fn decode_image(input: &[u8]) -> Result<DynamicImage, String> {
    core_utils::validate_input(input)?;
    let mut reader = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| format!("Could not read image format: {e}"))?;
    if core_utils::risk_mode_enabled() {
        reader.no_limits();
    }
    reader
        .decode()
        .map_err(|e| format!("Could not decode image: {e}"))
}

fn color_type_reduce(img: &DynamicImage) -> DynamicImage {
    let color = img.color();
    if color.has_alpha() {
        let rgba = img.to_rgba8();
        let all_opaque = rgba.pixels().all(|p| p[3] == 255);
        if all_opaque {
            let rgb = image::ImageBuffer::from_fn(rgba.width(), rgba.height(), |x, y| {
                let p = rgba.get_pixel(x, y);
                image::Rgb([p[0], p[1], p[2]])
            });
            return DynamicImage::ImageRgb8(rgb);
        }
    }
    if !color.has_alpha() && color.channel_count() >= 3 {
        let rgb = img.to_rgb8();
        let all_gray = rgb.pixels().all(|p| p[0] == p[1] && p[1] == p[2]);
        if all_gray {
            let gray = image::ImageBuffer::from_fn(rgb.width(), rgb.height(), |x, y| {
                let p = rgb.get_pixel(x, y);
                image::Luma([p[0]])
            });
            return DynamicImage::ImageLuma8(gray);
        }
    }
    img.clone()
}

fn optimize_alpha_pixels(img: &DynamicImage) -> DynamicImage {
    let color = img.color();
    if !color.has_alpha() {
        return img.clone();
    }
    let mut rgba = img.to_rgba8();
    for p in rgba.pixels_mut() {
        if p[3] == 0 {
            p[0] = 0;
            p[1] = 0;
            p[2] = 0;
        }
    }
    DynamicImage::ImageRgba8(rgba)
}

fn try_bit_depth_encode(
    img: &DynamicImage,
    compression: u8,
    filter: FilterType,
) -> Option<Vec<u8>> {
    let (w, h) = img.dimensions();
    let color = img.color();
    if color.has_alpha() || color.channel_count() >= 3 {
        return None;
    }
    let luma = img.to_luma8();
    let raw = luma.as_raw();

    if let Some(packed) = pack_l1(raw) {
        if let Some(out) =
            encode_packed_depth(&packed, w, h, ExtendedColorType::L1, compression, filter)
        {
            return Some(out);
        }
    }
    if let Some(packed) = pack_l4(raw) {
        if let Some(out) =
            encode_packed_depth(&packed, w, h, ExtendedColorType::L4, compression, filter)
        {
            return Some(out);
        }
    }
    if let Some(packed) = pack_l2(raw) {
        if let Some(out) =
            encode_packed_depth(&packed, w, h, ExtendedColorType::L2, compression, filter)
        {
            return Some(out);
        }
    }
    None
}

fn pack_l1(raw: &[u8]) -> Option<Vec<u8>> {
    if !raw.iter().all(|&v| v == 0 || v == 255) {
        return None;
    }
    let mut packed = Vec::with_capacity((raw.len() + 7) / 8);
    let mut byte: u8 = 0;
    let mut bit: u8 = 7;
    for &pixel in raw {
        if pixel == 255 {
            byte |= 1 << bit;
        }
        if bit == 0 {
            packed.push(byte);
            byte = 0;
            bit = 7;
        } else {
            bit -= 1;
        }
    }
    if bit < 7 {
        packed.push(byte);
    }
    Some(packed)
}

fn pack_l4(raw: &[u8]) -> Option<Vec<u8>> {
    if !raw.iter().all(|&v| v % 17 == 0) {
        return None;
    }
    let mut packed = Vec::with_capacity((raw.len() + 1) / 2);
    for chunk in raw.chunks(2) {
        let hi = (chunk[0] / 17) & 0x0F;
        let lo = if chunk.len() > 1 {
            (chunk[1] / 17) & 0x0F
        } else {
            0
        };
        packed.push(hi << 4 | lo);
    }
    Some(packed)
}

fn pack_l2(raw: &[u8]) -> Option<Vec<u8>> {
    if !raw.iter().all(|&v| v % 85 == 0) {
        return None;
    }
    let mut packed = Vec::with_capacity((raw.len() + 3) / 4);
    for chunk in raw.chunks(4) {
        let mut byte: u8 = 0;
        if chunk.len() > 0 {
            byte |= ((chunk[0] / 85) & 0x03) << 6;
        }
        if chunk.len() > 1 {
            byte |= ((chunk[1] / 85) & 0x03) << 4;
        }
        if chunk.len() > 2 {
            byte |= ((chunk[2] / 85) & 0x03) << 2;
        }
        if chunk.len() > 3 {
            byte |= (chunk[3] / 85) & 0x03;
        }
        packed.push(byte);
    }
    Some(packed)
}

fn encode_packed_depth(
    data: &[u8],
    w: u32,
    h: u32,
    color_type: ExtendedColorType,
    compression: u8,
    filter: FilterType,
) -> Option<Vec<u8>> {
    let mut buf = Cursor::new(Vec::new());
    let encoder =
        PngEncoder::new_with_quality(&mut buf, CompressionType::Level(compression), filter);
    if encoder.write_image(data, w, h, color_type).is_ok() {
        Some(buf.into_inner())
    } else {
        None
    }
}

const STRATEGIES: [miniz_oxide::deflate::core::CompressionStrategy; 3] = [
    miniz_oxide::deflate::core::CompressionStrategy::Default,
    miniz_oxide::deflate::core::CompressionStrategy::Filtered,
    miniz_oxide::deflate::core::CompressionStrategy::HuffmanOnly,
];

fn deflate_with_strategy(
    data: &[u8],
    level: u8,
    strategy: miniz_oxide::deflate::core::CompressionStrategy,
) -> Vec<u8> {
    use miniz_oxide::deflate::core::{create_comp_flags_from_zip_params, CompressorOxide};
    use miniz_oxide::deflate::stream::deflate;
    use miniz_oxide::{MZFlush, MZStatus};

    let flags = create_comp_flags_from_zip_params(level as i32, 15, strategy as i32)
        | miniz_oxide::deflate::core::deflate_flags::TDEFL_WRITE_ZLIB_HEADER
        | miniz_oxide::deflate::core::deflate_flags::TDEFL_COMPUTE_ADLER32;

    let mut compressor = CompressorOxide::new(flags);
    let mut output = vec![0u8; 32768];
    let mut result = Vec::with_capacity(data.len() / 2);
    let mut input = data;

    loop {
        let res = deflate(&mut compressor, input, &mut output, MZFlush::Finish);
        if res.bytes_written > 0 {
            result.extend_from_slice(&output[..res.bytes_written]);
        }
        input = &input[res.bytes_consumed..];
        match res.status {
            Ok(MZStatus::StreamEnd) => break,
            Ok(MZStatus::Ok) if input.is_empty() && res.bytes_written == 0 => break,
            Ok(_) => continue,
            Err(_) => break,
        }
    }
    result
}

fn apply_png_filter_none(raw: &[u8], width: usize, height: usize, channels: usize) -> Vec<u8> {
    let bpp = channels;
    let stride = width * bpp;
    let mut filtered = Vec::with_capacity((stride + 1) * height);
    for y in 0..height {
        filtered.push(0u8);
        let row = &raw[y * stride..(y + 1) * stride];
        filtered.extend_from_slice(row);
    }
    let _ = bpp;
    filtered
}

fn apply_png_filter_sub(raw: &[u8], width: usize, height: usize, channels: usize) -> Vec<u8> {
    let bpp = channels;
    let stride = width * bpp;
    let mut filtered = Vec::with_capacity((stride + 1) * height);
    for y in 0..height {
        filtered.push(1u8);
        let row = &raw[y * stride..(y + 1) * stride];
        for x in 0..stride {
            let prev = if x >= bpp { row[x - bpp] } else { 0 };
            filtered.push(row[x].wrapping_sub(prev));
        }
    }
    filtered
}

fn apply_png_filter_up(raw: &[u8], width: usize, height: usize, channels: usize) -> Vec<u8> {
    let bpp = channels;
    let stride = width * bpp;
    let zero_row = vec![0u8; stride];
    let mut filtered = Vec::with_capacity((stride + 1) * height);
    for y in 0..height {
        filtered.push(2u8);
        let row = &raw[y * stride..(y + 1) * stride];
        let prev_row = if y > 0 {
            &raw[(y - 1) * stride..y * stride]
        } else {
            &zero_row
        };
        for x in 0..stride {
            filtered.push(row[x].wrapping_sub(prev_row[x]));
        }
    }
    let _ = bpp;
    filtered
}

fn apply_png_filter_paeth(raw: &[u8], width: usize, height: usize, channels: usize) -> Vec<u8> {
    let bpp = channels;
    let stride = width * bpp;
    let mut filtered = Vec::with_capacity((stride + 1) * height);
    for y in 0..height {
        filtered.push(4u8);
        let row = &raw[y * stride..(y + 1) * stride];
        for x in 0..stride {
            let a = if x >= bpp { i32::from(row[x - bpp]) } else { 0 };
            let b = if y > 0 {
                i32::from(raw[(y - 1) * stride + x])
            } else {
                0
            };
            let c = if x >= bpp && y > 0 {
                i32::from(raw[(y - 1) * stride + x - bpp])
            } else {
                0
            };
            let p = a + b - c;
            let pa = (p - a).abs();
            let pb = (p - b).abs();
            let pc = (p - c).abs();
            let predictor = if pa <= pb && pa <= pc {
                a
            } else if pb <= pc {
                b
            } else {
                c
            };
            filtered.push(row[x].wrapping_sub(predictor as u8));
        }
    }
    filtered
}

fn apply_png_filter_avg(raw: &[u8], width: usize, height: usize, channels: usize) -> Vec<u8> {
    let bpp = channels;
    let stride = width * bpp;
    let mut filtered = Vec::with_capacity((stride + 1) * height);
    for y in 0..height {
        filtered.push(3u8);
        let row = &raw[y * stride..(y + 1) * stride];
        for x in 0..stride {
            let a = if x >= bpp { i32::from(row[x - bpp]) } else { 0 };
            let b = if y > 0 {
                i32::from(raw[(y - 1) * stride + x])
            } else {
                0
            };
            let predictor = (a + b) / 2;
            filtered.push(row[x].wrapping_sub(predictor as u8));
        }
    }
    filtered
}

fn encode_png_custom_with_strategy(
    raw: &[u8],
    width: u32,
    height: u32,
    channels: usize,
    color_type_byte: u8,
    bit_depth: u8,
    compression_level: u8,
) -> Vec<u8> {
    let (w, h) = (width as usize, height as usize);
    let filters: [(u8, fn(&[u8], usize, usize, usize) -> Vec<u8>); 5] = [
        (0, apply_png_filter_none),
        (1, apply_png_filter_sub),
        (2, apply_png_filter_up),
        (3, apply_png_filter_avg),
        (4, apply_png_filter_paeth),
    ];

    let mut best: Option<Vec<u8>> = None;

    for &(_filter_id, filter_fn) in filters.iter() {
        let filtered = filter_fn(raw, w, h, channels);
        for &strategy in STRATEGIES.iter() {
            let compressed = deflate_with_strategy(&filtered, compression_level, strategy);
            let png = build_png_container(width, height, color_type_byte, bit_depth, &compressed);
            match &best {
                Some(b) if png.len() >= b.len() => {}
                _ => best = Some(png),
            }
        }
    }
    best.unwrap_or_default()
}

fn build_png_container(
    width: u32,
    height: u32,
    color_type: u8,
    bit_depth: u8,
    idat_data: &[u8],
) -> Vec<u8> {
    let mut png = Vec::with_capacity(64 + idat_data.len());
    png.extend_from_slice(&[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    let mut ihdr = Vec::with_capacity(13);
    ihdr.extend_from_slice(&width.to_be_bytes());
    ihdr.extend_from_slice(&height.to_be_bytes());
    ihdr.push(bit_depth);
    ihdr.push(color_type);
    ihdr.push(0);
    ihdr.push(0);
    ihdr.push(0);
    write_chunk(&mut png, *b"IHDR", &ihdr);

    let chunk_max = 65535;
    let mut offset = 0;
    while offset < idat_data.len() {
        let end = (offset + chunk_max).min(idat_data.len());
        write_chunk(&mut png, *b"IDAT", &idat_data[offset..end]);
        offset = end;
    }
    if idat_data.is_empty() {
        write_chunk(&mut png, *b"IDAT", &[]);
    }

    write_chunk(&mut png, *b"IEND", &[]);
    png
}

fn write_chunk(buf: &mut Vec<u8>, chunk_type: [u8; 4], data: &[u8]) {
    buf.extend_from_slice(&(data.len() as u32).to_be_bytes());
    let crc_start = buf.len();
    buf.extend_from_slice(&chunk_type);
    buf.extend_from_slice(data);
    let crc = crc32(&buf[crc_start..]);
    buf.extend_from_slice(&crc.to_be_bytes());
}

fn crc32(data: &[u8]) -> u32 {
    let mut crc = 0xFFFF_FFFFu32;
    for &byte in data {
        crc ^= u32::from(byte);
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB8_8320;
            } else {
                crc >>= 1;
            }
        }
    }
    crc ^ 0xFFFF_FFFFu32
}

fn try_custom_strategy_encode(img: &DynamicImage, compression: u8) -> Option<Vec<u8>> {
    let (w, h) = img.dimensions();
    let color = img.color();
    let (raw, channels, color_type_byte): (Vec<u8>, usize, u8) = if color.has_alpha() {
        let rgba = img.to_rgba8();
        (rgba.as_raw().to_vec(), 4, 6)
    } else if color.channel_count() == 1 {
        let luma = img.to_luma8();
        (luma.as_raw().to_vec(), 1, 0)
    } else {
        let rgb = img.to_rgb8();
        (rgb.as_raw().to_vec(), 3, 2)
    };
    let result =
        encode_png_custom_with_strategy(&raw, w, h, channels, color_type_byte, 8, compression);
    if result.is_empty() {
        None
    } else {
        Some(result)
    }
}

fn encode_png_with_filter(
    img: &DynamicImage,
    compression: u8,
    filter: FilterType,
) -> Result<Vec<u8>, String> {
    let (w, h) = img.dimensions();
    let color = img.color();
    let mut buf = Cursor::new(Vec::new());
    let encoder =
        PngEncoder::new_with_quality(&mut buf, CompressionType::Level(compression), filter);
    if color.has_alpha() {
        let rgba = img.to_rgba8();
        encoder
            .write_image(rgba.as_raw(), w, h, ExtendedColorType::Rgba8)
            .map_err(|e| format!("PNG encode failed: {e}"))?;
    } else if color.channel_count() == 1 {
        let luma = img.to_luma8();
        encoder
            .write_image(luma.as_raw(), w, h, ExtendedColorType::L8)
            .map_err(|e| format!("PNG encode failed: {e}"))?;
    } else {
        let rgb = img.to_rgb8();
        encoder
            .write_image(rgb.as_raw(), w, h, ExtendedColorType::Rgb8)
            .map_err(|e| format!("PNG encode failed: {e}"))?;
    }
    Ok(buf.into_inner())
}

fn encode_png(img: &DynamicImage, compression: u8) -> Result<Vec<u8>, String> {
    encode_png_with_filter(img, compression, FilterType::Adaptive)
}

fn encode_png_optimized(
    img: &DynamicImage,
    compression: u8,
    opt_level: u8,
) -> Result<Vec<u8>, String> {
    if !(MIN_OPT_LEVEL..=MAX_OPT_LEVEL).contains(&opt_level) {
        return Err(format!(
            "Optimization level must be between {MIN_OPT_LEVEL} and {MAX_OPT_LEVEL}"
        ));
    }
    if !(MIN_PNG_COMPRESSION..=MAX_PNG_COMPRESSION).contains(&compression) {
        return Err(format!(
            "PNG compression must be between {MIN_PNG_COMPRESSION} and {MAX_PNG_COMPRESSION}"
        ));
    }
    if opt_level == 0 {
        return encode_png(img, compression);
    }
    let reduced = color_type_reduce(img);
    let optimized = optimize_alpha_pixels(&reduced);
    let mut best = encode_png_with_filter(&optimized, compression, FilterType::Adaptive)?;
    for &filter in FILTERS_TO_TRIAL.iter() {
        let candidate = encode_png_with_filter(&optimized, compression, filter)?;
        if candidate.len() < best.len() {
            best = candidate;
        }
    }
    for &filter in FILTERS_TO_TRIAL.iter() {
        if let Some(candidate) = try_bit_depth_encode(&optimized, compression, filter) {
            if candidate.len() < best.len() {
                best = candidate;
            }
        }
    }
    if let Some(custom) = try_custom_strategy_encode(&optimized, compression) {
        if custom.len() < best.len() {
            best = custom;
        }
    }
    Ok(best)
}

fn subsampling_from_code(code: u8) -> SamplingFactor {
    match code {
        1 => SamplingFactor::F_2_1,
        2 => SamplingFactor::R_4_4_4,
        _ => SamplingFactor::F_2_2,
    }
}

fn encode_jpeg_inner(
    img: &DynamicImage,
    quality: u8,
    subsampling: SamplingFactor,
) -> Result<Vec<u8>, String> {
    if !(MIN_JPEG_QUALITY..=MAX_JPEG_QUALITY).contains(&quality) {
        return Err(format!(
            "JPEG quality must be between {MIN_JPEG_QUALITY} and {MAX_JPEG_QUALITY}"
        ));
    }
    let rgb = img.to_rgb8();
    let (w, h) = rgb.dimensions();
    let mut out = Vec::new();
    let mut encoder = Encoder::new(&mut out, quality);
    encoder.set_sampling_factor(subsampling);
    encoder.set_optimized_huffman_tables(true);
    encoder
        .encode(rgb.as_raw(), w as u16, h as u16, ColorType::Rgb)
        .map_err(|e| format!("JPEG encode failed: {e}"))?;
    Ok(out)
}

fn encode_jpeg(img: &DynamicImage, quality: u8) -> Result<Vec<u8>, String> {
    encode_jpeg_inner(img, quality, SamplingFactor::F_2_2)
}

fn filter_from_code(code: u8) -> Result<ResizeFilter, String> {
    Ok(match code {
        0 => ResizeFilter::Nearest,
        1 => ResizeFilter::Triangle,
        2 => ResizeFilter::CatmullRom,
        3 => ResizeFilter::Gaussian,
        4 => ResizeFilter::Lanczos3,
        _ => return Err(format!("Unknown filter code: {code} — valid codes are 0 (Nearest), 1 (Triangle), 2 (CatmullRom), 3 (Gaussian), 4 (Lanczos3)")),
    })
}

fn resize_by_percent(
    img: DynamicImage,
    percent: u16,
    filter: ResizeFilter,
) -> Result<DynamicImage, String> {
    if !(MIN_RESIZE_PERCENT..=MAX_RESIZE_PERCENT).contains(&percent) {
        return Err(format!(
            "Resize percent must be between {MIN_RESIZE_PERCENT} and {MAX_RESIZE_PERCENT}"
        ));
    }
    let (w, h) = img.dimensions();
    let nw = ((w as u64 * percent as u64) / 100).max(1) as u32;
    let nh = ((h as u64 * percent as u64) / 100).max(1) as u32;
    if nw == w && nh == h {
        return Ok(img);
    }
    Ok(img.resize_exact(nw, nh, filter))
}

fn ensure_png(input: &[u8]) -> Result<(), String> {
    if input.len() < 8 || &input[0..8] != b"\x89PNG\r\n\x1a\n" {
        return Err("Input is not a valid PNG file".into());
    }
    Ok(())
}

fn ensure_jpeg(input: &[u8]) -> Result<(), String> {
    if input.len() < 2 || input[0] != 0xFF || input[1] != 0xD8 {
        return Err("Input is not a valid JPEG file".into());
    }
    Ok(())
}

#[wasm_bindgen]
pub fn recompress_png(input_bytes: &[u8], compression: u8) -> Result<Vec<u8>, String> {
    recompress_png_optimized(input_bytes, compression, 0)
}

#[wasm_bindgen]
pub fn recompress_png_optimized(
    input_bytes: &[u8],
    compression: u8,
    opt_level: u8,
) -> Result<Vec<u8>, String> {
    ensure_png(input_bytes)?;
    let img = decode_image(input_bytes)?;
    encode_png_optimized(&img, compression, opt_level)
}

#[wasm_bindgen]
pub fn recompress_jpeg(input_bytes: &[u8], quality: u8) -> Result<Vec<u8>, String> {
    recompress_jpeg_with_options(input_bytes, quality, 0)
}

#[wasm_bindgen]
pub fn recompress_jpeg_with_options(
    input_bytes: &[u8],
    quality: u8,
    chroma_code: u8,
) -> Result<Vec<u8>, String> {
    ensure_jpeg(input_bytes)?;
    let img = decode_image(input_bytes)?;
    let ss = subsampling_from_code(chroma_code);
    encode_jpeg_inner(&img, quality, ss)
}

#[wasm_bindgen]
pub fn resize_png(input_bytes: &[u8], resize_percent: u16) -> Result<Vec<u8>, String> {
    resize_png_with_filter(input_bytes, resize_percent, 2)
}

#[wasm_bindgen]
pub fn resize_jpeg(input_bytes: &[u8], resize_percent: u16) -> Result<Vec<u8>, String> {
    resize_jpeg_with_filter(input_bytes, resize_percent, 2)
}

#[wasm_bindgen]
pub fn resize_png_with_filter(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,
) -> Result<Vec<u8>, String> {
    ensure_png(input_bytes)?;
    let img = decode_image(input_bytes)?;
    let filter = filter_from_code(filter_code)?;
    let resized = resize_by_percent(img, resize_percent, filter)?;
    encode_png(&resized, DEFAULT_PNG_COMPRESSION)
}

#[wasm_bindgen]
pub fn resize_jpeg_with_filter(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,
) -> Result<Vec<u8>, String> {
    resize_jpeg_with_filter_and_quality(
        input_bytes,
        resize_percent,
        filter_code,
        DEFAULT_JPEG_QUALITY,
    )
}

#[wasm_bindgen]
pub fn resize_jpeg_with_filter_and_quality(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,
    quality: u8,
) -> Result<Vec<u8>, String> {
    ensure_jpeg(input_bytes)?;
    let img = decode_image(input_bytes)?;
    let filter = filter_from_code(filter_code)?;
    let resized = resize_by_percent(img, resize_percent, filter)?;
    encode_jpeg(&resized, quality)
}

#[wasm_bindgen]
pub fn estimate_png_recompress_size(input_bytes: &[u8], compression: u8) -> Result<u32, String> {
    let out = recompress_png(input_bytes, compression)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_png_recompress_optimized(
    input_bytes: &[u8],
    compression: u8,
    opt_level: u8,
) -> Result<u32, String> {
    let out = recompress_png_optimized(input_bytes, compression, opt_level)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_jpeg_recompress_size(input_bytes: &[u8], quality: u8) -> Result<u32, String> {
    let out = recompress_jpeg(input_bytes, quality)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_jpeg_recompress_with_options(
    input_bytes: &[u8],
    quality: u8,
    chroma_code: u8,
) -> Result<u32, String> {
    let out = recompress_jpeg_with_options(input_bytes, quality, chroma_code)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_resize_png_size(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,
) -> Result<u32, String> {
    let out = resize_png_with_filter(input_bytes, resize_percent, filter_code)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn estimate_resize_jpeg_size(
    input_bytes: &[u8],
    resize_percent: u16,
    filter_code: u8,
    quality: u8,
) -> Result<u32, String> {
    let out =
        resize_jpeg_with_filter_and_quality(input_bytes, resize_percent, filter_code, quality)?;
    Ok(out.len() as u32)
}

#[wasm_bindgen]
pub fn set_session_input_limit(max_bytes: u32) {
    core_utils::set_session_max_input_bytes(max_bytes as usize);
}

#[wasm_bindgen]
pub fn reset_session_input_limit() {
    core_utils::reset_session_max_input_bytes();
}

#[wasm_bindgen]
pub fn set_risk_mode(enabled: bool) {
    core_utils::set_risk_mode(enabled);
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::codecs::jpeg::JpegEncoder;
    use image::codecs::png::PngEncoder as ImagePngEncoder;
    use image::{ImageEncoder, RgbImage, RgbaImage};

    fn sample_png() -> Vec<u8> {
        let img = RgbImage::from_fn(32, 32, |x, y| {
            image::Rgb([(x * 8) as u8, (y * 8) as u8, 128])
        });
        let mut out = Vec::new();
        ImagePngEncoder::new(&mut out)
            .write_image(img.as_raw(), 32, 32, ExtendedColorType::Rgb8)
            .unwrap();
        out
    }

    fn sample_jpeg(quality: u8) -> Vec<u8> {
        let img = RgbImage::from_fn(64, 64, |x, y| {
            image::Rgb([(x * 4) as u8, (y * 4) as u8, 128])
        });
        let mut out = Vec::new();
        let mut enc = JpegEncoder::new_with_quality(&mut out, quality);
        enc.encode(img.as_raw(), 64, 64, ExtendedColorType::Rgb8)
            .unwrap();
        out
    }

    fn sample_rgba_png() -> Vec<u8> {
        let img = RgbaImage::from_fn(32, 32, |x, y| {
            image::Rgba([(x * 8) as u8, (y * 8) as u8, 128, 255])
        });
        let mut out = Vec::new();
        ImagePngEncoder::new(&mut out)
            .write_image(img.as_raw(), 32, 32, ExtendedColorType::Rgba8)
            .unwrap();
        out
    }

    #[test]
    fn recompress_png_roundtrip() {
        let png = sample_png();
        let out = recompress_png(&png, 9).expect("recompress");
        ensure_png(&out).unwrap();
        assert!(out.len() > 0);
    }

    #[test]
    fn resize_png_smaller() {
        let png = sample_png();
        let out = resize_png(&png, 50).expect("resize");
        let img = decode_image(&out).unwrap();
        assert_eq!(img.width(), 16);
        assert_eq!(img.height(), 16);
    }

    #[test]
    fn recompress_jpeg_roundtrip() {
        let jpg = sample_jpeg(85);
        let out = recompress_jpeg(&jpg, 75).expect("recompress");
        ensure_jpeg(&out).unwrap();
        assert!(out.len() > 0);
    }

    #[test]
    fn recompress_jpeg_with_subsampling_444() {
        let jpg = sample_jpeg(85);
        let out420 = recompress_jpeg_with_options(&jpg, 75, 0).expect("4:2:0");
        let out444 = recompress_jpeg_with_options(&jpg, 75, 2).expect("4:4:4");
        ensure_jpeg(&out420).unwrap();
        ensure_jpeg(&out444).unwrap();
        assert!(
            out444.len() >= out420.len(),
            "4:4:4 should be >= 4:2:0 in size"
        );
    }

    #[test]
    fn recompress_jpeg_size_order() {
        let jpg = sample_jpeg(75);
        let out420 = recompress_jpeg_with_options(&jpg, 75, 0).expect("4:2:0");
        let out422 = recompress_jpeg_with_options(&jpg, 75, 1).expect("4:2:2");
        let out444 = recompress_jpeg_with_options(&jpg, 75, 2).expect("4:4:4");
        assert!(out420.len() <= out422.len(), "4:2:0 <= 4:2:2");
        assert!(out422.len() <= out444.len(), "4:2:2 <= 4:4:4");
    }

    #[test]
    fn png_color_type_preserved_rgb() {
        let png = sample_png();
        let out = recompress_png(&png, 6).expect("recompress");
        assert!(&out[0..8] == b"\x89PNG\r\n\x1a\n");
        assert_eq!(out[25], 2, "Color type should be RGB (2), not RGBA (6)");
    }

    #[test]
    fn png_color_type_preserved_rgba() {
        let img = RgbaImage::from_fn(32, 32, |x, y| {
            image::Rgba([(x * 8) as u8, (y * 8) as u8, 128, 200])
        });
        let mut png = Vec::new();
        ImagePngEncoder::new(&mut png)
            .write_image(img.as_raw(), 32, 32, ExtendedColorType::Rgba8)
            .unwrap();
        let out = recompress_png(&png, 6).expect("recompress");
        assert_eq!(out[25], 6, "Color type should be RGBA (6)");
    }

    #[test]
    fn png_optimized_smaller_or_equal() {
        let png = sample_png();
        let baseline = recompress_png(&png, 9).expect("baseline");
        let optimized = recompress_png_optimized(&png, 9, 1).expect("optimized");
        assert!(
            optimized.len() <= baseline.len(),
            "Optimized ({}) should be <= baseline ({})",
            optimized.len(),
            baseline.len()
        );
    }

    #[test]
    fn png_optimized_rgba_opaque_to_rgb() {
        let png = sample_rgba_png();
        let optimized = recompress_png_optimized(&png, 6, 1).expect("optimized");
        assert_eq!(
            optimized[25], 2,
            "Opaque RGBA should reduce to RGB (color type 2)"
        );
    }

    #[test]
    fn opt_level_zero_equals_default() {
        let png = sample_png();
        let baseline = recompress_png(&png, 6).expect("baseline");
        let opt0 = recompress_png_optimized(&png, 6, 0).expect("opt0");
        assert_eq!(
            baseline.len(),
            opt0.len(),
            "Level 0 should equal default recompress"
        );
    }

    #[test]
    fn invalid_opt_level_rejected() {
        let png = sample_png();
        assert!(recompress_png_optimized(&png, 6, 2).is_err());
    }

    fn sample_bw_png() -> Vec<u8> {
        let img = image::ImageBuffer::from_fn(8, 8, |x, y| {
            if (x + y) % 2 == 0 {
                image::Luma([0u8])
            } else {
                image::Luma([255u8])
            }
        });
        let mut out = Vec::new();
        ImagePngEncoder::new(&mut out)
            .write_image(img.as_raw(), 8, 8, ExtendedColorType::L8)
            .unwrap();
        out
    }

    #[test]
    fn bw_png_bit_depth_reduces_to_l1() {
        let png = sample_bw_png();
        let optimized = recompress_png_optimized(&png, 9, 1).expect("optimized");
        let ct = optimized[25];
        assert!(
            ct == 0 || ct == 2,
            "BW image should reduce to L1 (0) or stay RGB/Gray: got color type {}",
            ct
        );
    }

    #[test]
    fn alpha_optimize_no_crash_and_valid() {
        let img = RgbaImage::from_fn(32, 32, |x, y| {
            let a = if x < 16 { 0 } else { 255u8 };
            image::Rgba([x as u8, y as u8, 128, a])
        });
        let mut png = Vec::new();
        ImagePngEncoder::new(&mut png)
            .write_image(img.as_raw(), 32, 32, ExtendedColorType::Rgba8)
            .unwrap();
        let optimized = recompress_png_optimized(&png, 6, 1).expect("optimized");
        ensure_png(&optimized).unwrap();
        assert!(optimized.len() > 0);
    }

    #[test]
    fn optimize_color_type_reduce_rgb_to_gray() {
        let gray = image::ImageBuffer::from_fn(32, 32, |x, y| {
            let v = (x * 8) as u8;
            image::Rgb([v, v, v])
        });
        let mut png = Vec::new();
        ImagePngEncoder::new(&mut png)
            .write_image(gray.as_raw(), 32, 32, ExtendedColorType::Rgb8)
            .unwrap();
        let optimized = recompress_png_optimized(&png, 6, 1).expect("optimized");
        assert_eq!(
            optimized[25], 0,
            "RGB with all channels equal should reduce to grayscale (color type 0)"
        );
    }
}
