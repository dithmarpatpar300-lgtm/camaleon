//! ICO/CUR container probe — ICONDIR metadata without full raster decode.

use std::io::{Cursor, Read};

const PNG_MAGIC: [u8; 8] = [137, 80, 78, 71, 13, 10, 26, 10];

const ICO_IMAGE_TYPE: u16 = 1;
const CUR_IMAGE_TYPE: u16 = 2;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IcoContainerKind {
    Icon,
    Cursor,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IcoEntryFormat {
    Png,
    Bmp,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IcoEntryInfo {
    pub width: u32,
    pub height: u32,
    pub bits_per_pixel: u16,
    pub format: IcoEntryFormat,
    pub image_offset: u32,
    pub image_length: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IcoInfo {
    pub container: IcoContainerKind,
    pub entry_count: u32,
    pub entries: Vec<IcoEntryInfo>,
    pub default_entry_index: u32,
}

#[derive(Debug, Clone, Copy, Default)]
struct DirEntry {
    width: u8,
    height: u8,
    bits_per_pixel: u16,
    image_length: u32,
    image_offset: u32,
}

fn read_u16_le(r: &mut Cursor<&[u8]>) -> Result<u16, String> {
    let mut buf = [0u8; 2];
    r.read_exact(&mut buf)
        .map_err(|_| "Invalid or corrupt ICO data: unexpected end of file".to_string())?;
    Ok(u16::from_le_bytes(buf))
}

fn read_u32_le(r: &mut Cursor<&[u8]>) -> Result<u32, String> {
    let mut buf = [0u8; 4];
    r.read_exact(&mut buf)
        .map_err(|_| "Invalid or corrupt ICO data: unexpected end of file".to_string())?;
    Ok(u32::from_le_bytes(buf))
}

impl DirEntry {
    fn real_width(&self) -> u32 {
        match self.width {
            0 => 256,
            w => u32::from(w),
        }
    }

    fn real_height(&self) -> u32 {
        match self.height {
            0 => 256,
            h => u32::from(h),
        }
    }
}

fn read_byte(r: &mut Cursor<&[u8]>) -> Result<u8, String> {
    let mut b = [0u8; 1];
    r.read_exact(&mut b)
        .map_err(|_| "Invalid or corrupt ICO data: unexpected end of file".to_string())?;
    Ok(b[0])
}

fn read_dir_entry(r: &mut Cursor<&[u8]>) -> Result<DirEntry, String> {
    let width = read_byte(r)?;
    let height = read_byte(r)?;
    let _color_count = read_byte(r)?;
    let _reserved = read_byte(r)?;
    let num_color_planes = read_u16_le(r)?;
    if num_color_planes > 256 {
        return Err("ICO entry has invalid color planes or cursor hotspot".into());
    }
    let bits_per_pixel = read_u16_le(r)?;
    if bits_per_pixel > 256 {
        return Err("ICO entry has invalid bits per pixel or cursor hotspot".into());
    }
    let image_length = read_u32_le(r)?;
    let image_offset = read_u32_le(r)?;
    Ok(DirEntry {
        width,
        height,
        bits_per_pixel,
        image_length,
        image_offset,
    })
}

fn sniff_png_at(input: &[u8], offset: u32) -> bool {
    let start = offset as usize;
    start + PNG_MAGIC.len() <= input.len() && input[start..start + PNG_MAGIC.len()] == PNG_MAGIC
}

fn entry_format(input: &[u8], entry: &DirEntry) -> IcoEntryFormat {
    if sniff_png_at(input, entry.image_offset) {
        IcoEntryFormat::Png
    } else {
        IcoEntryFormat::Bmp
    }
}

fn score_entry(entry: &IcoEntryInfo) -> (u32, u32) {
    (
        u32::from(entry.bits_per_pixel),
        entry.width.saturating_mul(entry.height),
    )
}

pub fn default_entry_index(entries: &[IcoEntryInfo]) -> u32 {
    let mut best = 0u32;
    let mut best_score = score_entry(&entries[0]);
    for (i, entry) in entries.iter().enumerate().skip(1) {
        let score = score_entry(entry);
        if score > best_score {
            best = i as u32;
            best_score = score;
        }
    }
    best
}

pub fn inspect_ico(input: &[u8]) -> Result<IcoInfo, String> {
    if input.len() < 6 {
        return Err("Invalid or corrupt ICO data: file too short".into());
    }

    let mut cursor = Cursor::new(input);
    let _reserved = read_u16_le(&mut cursor)?;
    let image_type = read_u16_le(&mut cursor)?;
    let container = match image_type {
        ICO_IMAGE_TYPE => IcoContainerKind::Icon,
        CUR_IMAGE_TYPE => IcoContainerKind::Cursor,
        _ => return Err("Unsupported ICO container type".into()),
    };
    let count = read_u16_le(&mut cursor)? as u32;
    if count == 0 {
        return Err("ICO directory contains no images".into());
    }

    let mut entries = Vec::with_capacity(count as usize);
    for _ in 0..count {
        let raw = read_dir_entry(&mut cursor)?;
        let width = raw.real_width();
        let height = raw.real_height();
        if width == 0 || height == 0 || width > 256 || height > 256 {
            return Err(format!(
                "ICO entry dimensions {}×{} are outside the 1–256 range",
                width, height
            ));
        }
        let format = entry_format(input, &raw);
        entries.push(IcoEntryInfo {
            width,
            height,
            bits_per_pixel: raw.bits_per_pixel,
            format,
            image_offset: raw.image_offset,
            image_length: raw.image_length,
        });
    }

    let default_entry_index = default_entry_index(&entries);
    Ok(IcoInfo {
        container,
        entry_count: count,
        entries,
        default_entry_index,
    })
}

pub fn validate_entry_index(entry_count: u32, entry_index: u32) -> Result<(), String> {
    if entry_index >= entry_count {
        return Err(format!(
            "ICO entry index {} is out of range (file has {} entries)",
            entry_index, entry_count
        ));
    }
    Ok(())
}

pub fn entry_likely_has_alpha(entry: &IcoEntryInfo) -> bool {
    match entry.format {
        IcoEntryFormat::Png => true,
        IcoEntryFormat::Bmp => entry.bits_per_pixel >= 32,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_entry_picks_largest_area() {
        let entries = vec![
            IcoEntryInfo {
                width: 16,
                height: 16,
                bits_per_pixel: 32,
                format: IcoEntryFormat::Png,
                image_offset: 0,
                image_length: 0,
            },
            IcoEntryInfo {
                width: 256,
                height: 256,
                bits_per_pixel: 32,
                format: IcoEntryFormat::Png,
                image_offset: 0,
                image_length: 0,
            },
        ];
        assert_eq!(default_entry_index(&entries), 1);
    }
}
