//! Lightweight TIFF container probe — IFD metadata without full raster decode via `image`.

use std::io::Cursor;

use tiff::decoder::Decoder;
use tiff::tags::{CompressionMethod, PhotometricInterpretation, Tag};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TiffPageInfo {
    pub width: u32,
    pub height: u32,
    pub bits_per_sample: u8,
    pub samples_per_pixel: u16,
    pub photometric: u16,
    pub compression: u16,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TiffInfo {
    pub page_count: u32,
    pub pages: Vec<TiffPageInfo>,
}

fn photometric_label(v: u16) -> &'static str {
    match PhotometricInterpretation::from_u16(v) {
        Some(PhotometricInterpretation::WhiteIsZero) => "WhiteIsZero",
        Some(PhotometricInterpretation::BlackIsZero) => "BlackIsZero",
        Some(PhotometricInterpretation::RGB) => "RGB",
        Some(PhotometricInterpretation::RGBPalette) => "RGBPalette",
        Some(PhotometricInterpretation::TransparencyMask) => "TransparencyMask",
        Some(PhotometricInterpretation::CMYK) => "CMYK",
        Some(PhotometricInterpretation::YCbCr) => "YCbCr",
        Some(PhotometricInterpretation::CIELab) => "CIELab",
        Some(PhotometricInterpretation::IccLab) => "IccLab",
        Some(PhotometricInterpretation::ItuLab) => "ItuLab",
        _ => "Unknown",
    }
}

fn compression_label(v: u16) -> &'static str {
    match CompressionMethod::from_u16_exhaustive(v) {
        CompressionMethod::None => "None",
        CompressionMethod::LZW => "LZW",
        CompressionMethod::Deflate => "Deflate",
        CompressionMethod::PackBits => "PackBits",
        CompressionMethod::ModernJPEG => "JPEG",
        other => {
            let _ = other;
            "Other"
        }
    }
}

fn probe_page_metadata(decoder: &mut Decoder<Cursor<&[u8]>>) -> Result<TiffPageInfo, String> {
    let (width, height) = decoder
        .dimensions()
        .map_err(|e| format!("dimensions: {}", e))?;
    let bits_per_sample = decoder
        .find_tag_unsigned_vec::<u16>(Tag::BitsPerSample)
        .map_err(|e| format!("bits per sample: {}", e))?
        .and_then(|v| v.first().copied())
        .unwrap_or(8) as u8;
    let samples_per_pixel = decoder
        .find_tag_unsigned::<u16>(Tag::SamplesPerPixel)
        .map_err(|e| format!("samples per pixel: {}", e))?
        .unwrap_or(1);
    let photometric = decoder
        .find_tag_unsigned::<u16>(Tag::PhotometricInterpretation)
        .map_err(|e| format!("photometric: {}", e))?
        .unwrap_or(PhotometricInterpretation::BlackIsZero.to_u16());
    let compression = decoder
        .find_tag_unsigned::<u16>(Tag::Compression)
        .map_err(|e| format!("compression: {}", e))?
        .unwrap_or(CompressionMethod::None.to_u16());

    Ok(TiffPageInfo {
        width,
        height,
        bits_per_sample,
        samples_per_pixel,
        photometric,
        compression,
    })
}

pub fn inspect_tiff(input: &[u8]) -> Result<TiffInfo, String> {
    if input.len() < 8 {
        return Err("Invalid or corrupt TIFF data: file too short".into());
    }
    let le = input[0] == b'I' && input[1] == b'I';
    let be = input[0] == b'M' && input[1] == b'M';
    if !le && !be {
        return Err("Invalid or corrupt TIFF data: bad byte order marker".into());
    }

    let mut decoder = Decoder::new(Cursor::new(input))
        .map_err(|e| format!("Invalid or corrupt TIFF data: {}", e))?;

    let mut pages = Vec::new();
    loop {
        pages.push(probe_page_metadata(&mut decoder)?);
        match decoder.next_image() {
            Ok(()) => continue,
            Err(tiff::TiffError::FormatError(
                tiff::TiffFormatError::ImageFileDirectoryNotFound,
            )) => break,
            Err(e) => {
                if pages.len() == 1 {
                    return Err(format!("Failed to read TIFF IFD: {}", e));
                }
                break;
            }
        }
    }

    Ok(TiffInfo {
        page_count: pages.len() as u32,
        pages,
    })
}

pub fn page_photometric_name(page: &TiffPageInfo) -> &'static str {
    photometric_label(page.photometric)
}

pub fn page_compression_name(page: &TiffPageInfo) -> &'static str {
    compression_label(page.compression)
}

pub fn is_cmyk_page(page: &TiffPageInfo) -> bool {
    page.photometric == PhotometricInterpretation::CMYK.to_u16()
}

pub fn is_palette_page(page: &TiffPageInfo) -> bool {
    page.photometric == PhotometricInterpretation::RGBPalette.to_u16()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tiff::encoder::{colortype::RGB8, TiffEncoder};

    fn rgb8_tiff(w: u32, h: u32) -> Vec<u8> {
        let data: Vec<u8> = (0..(w * h * 3))
            .map(|i| ((i * 37) % 256) as u8)
            .collect();
        let mut buf = Cursor::new(Vec::new());
        let mut enc = TiffEncoder::new(&mut buf).expect("encoder");
        enc.write_image::<RGB8>(w, h, &data).expect("write");
        buf.into_inner()
    }

    #[test]
    fn inspect_single_page_rgb() {
        let tiff = rgb8_tiff(8, 8);
        let info = inspect_tiff(&tiff).expect("inspect");
        assert_eq!(info.page_count, 1);
        assert_eq!(info.pages[0].width, 8);
        assert_eq!(info.pages[0].height, 8);
    }
}
