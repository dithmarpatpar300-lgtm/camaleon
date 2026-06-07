use std::io::{self, Seek, SeekFrom, Write};
use std::ops::Deref;

use image::{EncodableLayout, ImageBuffer, ImageFormat, Pixel, PixelWithColorType};

/// A writer that counts bytes written and discards the payload.
/// Used for size-only estimation without allocating output buffers.
#[derive(Debug, Default)]
pub struct CountingWriter {
    pub bytes_written: u64,
}

impl Write for CountingWriter {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.bytes_written += buf.len() as u64;
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

/// No-op seek sink — satisfies encoders (e.g. WebP) that patch RIFF headers via `Seek`.
impl Seek for CountingWriter {
    fn seek(&mut self, pos: SeekFrom) -> io::Result<u64> {
        seek_counting_sink(self.bytes_written, pos)
    }
}

/// Count lossless WebP bytes without allocating an output buffer.
///
/// WebP encoders require `Write + Seek`; keeping `write_to` in this crate avoids
/// cross-crate trait-resolution gaps in rust-analyzer.
pub fn count_webp_bytes<P, Container>(image: &ImageBuffer<P, Container>) -> Result<u64, String>
where
    P: Pixel + PixelWithColorType,
    [P::Subpixel]: EncodableLayout,
    Container: Deref<Target = [P::Subpixel]>,
{
    let mut writer = CountingWriter::default();
    image
        .write_to(&mut writer, ImageFormat::WebP)
        .map_err(|e| format!("Failed to encode WebP: {}", e))?;
    Ok(writer.bytes_written)
}

fn seek_counting_sink(bytes_written: u64, pos: SeekFrom) -> io::Result<u64> {
    match pos {
        SeekFrom::Start(0) => Ok(0),
        SeekFrom::Current(0) | SeekFrom::End(0) => Ok(bytes_written),
        SeekFrom::Start(n) => Ok(n),
        SeekFrom::Current(n) => Ok(((bytes_written as i64) + n).max(0) as u64),
        SeekFrom::End(n) => Ok(((bytes_written as i64) + n).max(0) as u64),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgba;

    #[test]
    fn counts_small_writes() {
        let mut w = CountingWriter::default();
        w.write_all(&[1u8; 10]).unwrap();
        assert_eq!(w.bytes_written, 10);
    }

    #[test]
    fn counts_large_writes() {
        let mut w = CountingWriter::default();
        w.write_all(&[0u8; 1_000_000]).unwrap();
        assert_eq!(w.bytes_written, 1_000_000);
    }

    #[test]
    fn seek_current_reports_bytes_written() {
        let mut w = CountingWriter::default();
        w.write_all(&[1, 2, 3]).unwrap();
        assert_eq!(w.seek(SeekFrom::Current(0)).unwrap(), 3);
    }

    #[test]
    fn count_webp_bytes_returns_positive_size() {
        let img = ImageBuffer::from_pixel(4, 4, Rgba::<u8>([10, 20, 30, 255]));
        let bytes = count_webp_bytes(&img).expect("webp count");
        assert!(bytes > 0);
    }
}
