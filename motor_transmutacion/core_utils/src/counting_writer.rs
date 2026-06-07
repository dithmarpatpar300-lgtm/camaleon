use std::io::{self, Write};

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
