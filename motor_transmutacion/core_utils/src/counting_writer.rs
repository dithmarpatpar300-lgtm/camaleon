use std::io::{self, Seek, SeekFrom, Write};

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
        match pos {
            SeekFrom::Start(0) => Ok(0),
            SeekFrom::Current(0) | SeekFrom::End(0) => Ok(self.bytes_written),
            SeekFrom::Start(n) => Ok(n),
            SeekFrom::Current(n) => Ok(((self.bytes_written as i64) + n).max(0) as u64),
            SeekFrom::End(n) => Ok(((self.bytes_written as i64) + n).max(0) as u64),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
