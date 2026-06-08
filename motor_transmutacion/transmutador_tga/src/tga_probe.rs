//! Lightweight TGA header probe — metadata without full raster decode.

use std::io::{Cursor, Read};

const ALPHA_BIT_MASK: u8 = 0x0F;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TgaImageType {
    NoData,
    RawColorMap,
    RawTrueColor,
    RawGrayScale,
    RunColorMap,
    RunTrueColor,
    RunGrayScale,
    Unknown,
}

impl TgaImageType {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Self::NoData,
            1 => Self::RawColorMap,
            2 => Self::RawTrueColor,
            3 => Self::RawGrayScale,
            9 => Self::RunColorMap,
            10 => Self::RunTrueColor,
            11 => Self::RunGrayScale,
            _ => Self::Unknown,
        }
    }

    pub fn is_rle(self) -> bool {
        matches!(
            self,
            Self::RunColorMap | Self::RunTrueColor | Self::RunGrayScale
        )
    }

    pub fn is_color_mapped(self) -> bool {
        matches!(self, Self::RawColorMap | Self::RunColorMap)
    }

    pub fn is_supported_mvp(self) -> bool {
        matches!(
            self,
            Self::RawColorMap
                | Self::RawTrueColor
                | Self::RawGrayScale
                | Self::RunColorMap
                | Self::RunTrueColor
                | Self::RunGrayScale
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TgaOrientation {
    BottomLeft,
    BottomRight,
    TopLeft,
    TopRight,
}

impl TgaOrientation {
    pub fn from_image_desc(value: u8) -> Self {
        if value & (1 << 4) == 0 {
            if value & (1 << 5) == 0 {
                Self::BottomLeft
            } else {
                Self::TopLeft
            }
        } else if value & (1 << 5) == 0 {
            Self::BottomRight
        } else {
            Self::TopRight
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TgaInfo {
    pub width: u32,
    pub height: u32,
    pub pixel_depth: u8,
    pub image_type: TgaImageType,
    pub orientation: TgaOrientation,
    /// Header indicates an alpha channel (32-bit RGBA or 8-bit gray+alpha).
    pub has_alpha_channel: bool,
    /// 15/16-bit RGB — attribute bit is not semantic alpha.
    pub is_rgb555: bool,
}

fn read_u8(r: &mut Cursor<&[u8]>) -> Result<u8, String> {
    let mut b = [0u8; 1];
    r.read_exact(&mut b)
        .map_err(|_| "Invalid or corrupt TGA data: unexpected end of file".to_string())?;
    Ok(b[0])
}

fn read_u16_le(r: &mut Cursor<&[u8]>) -> Result<u16, String> {
    let mut buf = [0u8; 2];
    r.read_exact(&mut buf)
        .map_err(|_| "Invalid or corrupt TGA data: unexpected end of file".to_string())?;
    Ok(u16::from_le_bytes(buf))
}

pub fn inspect_tga(input: &[u8]) -> Result<TgaInfo, String> {
    if input.len() < 18 {
        return Err("Invalid or corrupt TGA data: header too short".into());
    }

    let mut r = Cursor::new(input);
    let id_length = read_u8(&mut r)?;
    let map_type = read_u8(&mut r)?;
    let image_type = TgaImageType::from_u8(read_u8(&mut r)?);
    let _map_origin = read_u16_le(&mut r)?;
    let _map_length = read_u16_le(&mut r)?;
    let map_entry_size = read_u8(&mut r)?;
    let _x_origin = read_u16_le(&mut r)?;
    let _y_origin = read_u16_le(&mut r)?;
    let width = read_u16_le(&mut r)? as u32;
    let height = read_u16_le(&mut r)? as u32;
    let pixel_depth = read_u8(&mut r)?;
    let image_desc = read_u8(&mut r)?;

    let header_end = 18 + id_length as usize;
    if input.len() < header_end {
        return Err("Invalid or corrupt TGA data: ID field truncated".into());
    }

    if image_type == TgaImageType::NoData {
        return Err("TGA file contains no image data".into());
    }
    if image_type == TgaImageType::Unknown {
        return Err(format!("Unsupported TGA image type ({})", input[2]));
    }
    if width == 0 || height == 0 {
        return Err("TGA image has invalid empty dimensions".into());
    }

    if image_type.is_color_mapped() && map_type != 1 {
        return Err("Color-mapped TGA must use color map type 1".into());
    }

    let num_attrib_bits = image_desc & ALPHA_BIT_MASK;
    let is_color = matches!(
        image_type,
        TgaImageType::RawColorMap
            | TgaImageType::RawTrueColor
            | TgaImageType::RunColorMap
            | TgaImageType::RunTrueColor
    );

    let total_pixel_bits = if image_type.is_color_mapped() {
        map_entry_size
    } else {
        pixel_depth
    };

    let num_other_bits = total_pixel_bits.saturating_sub(num_attrib_bits);
    let is_rgb555 = is_color && matches!(num_other_bits, 15 | 16) && num_attrib_bits <= 1;

    let has_alpha_channel = match (num_attrib_bits, num_other_bits, is_color) {
        (8, 24, true) | (0, 32, true) => true,
        (8, 8, false) => true,
        _ => false,
    };

    if image_type.is_color_mapped() && ![8, 16].contains(&pixel_depth) {
        return Err("Color-mapped TGA must use 8 or 16-bit indices".into());
    }

    let _ = (map_entry_size, header_end);

    Ok(TgaInfo {
        width,
        height,
        pixel_depth,
        image_type,
        orientation: TgaOrientation::from_image_desc(image_desc),
        has_alpha_channel,
        is_rgb555,
    })
}

pub fn inspect_and_validate(input: &[u8]) -> Result<TgaInfo, String> {
    let info = inspect_tga(input)?;
    if !info.image_type.is_supported_mvp() {
        return Err("Unsupported TGA image type".into());
    }
    Ok(info)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_short_header() {
        assert!(inspect_tga(&[0u8; 10]).is_err());
    }
}
