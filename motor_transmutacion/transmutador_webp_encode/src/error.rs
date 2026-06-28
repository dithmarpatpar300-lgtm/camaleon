//! Error types for Picture-VP8.

#[derive(Debug)]
pub enum Vp8EncodeError {
    /// Input image dimensions are zero or exceed limits.
    InvalidDimensions { width: u32, height: u32 },
    /// Input RGB buffer does not match width × height × 3.
    BufferSizeMismatch { expected: usize, actual: usize },
    /// Quality parameter out of range (must be 0-100).
    InvalidQuality { value: u8 },
    /// Internal encoder failure.
    Internal(String),
}

impl std::fmt::Display for Vp8EncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidDimensions { width, height } => write!(
                f,
                "Invalid image dimensions: {width}x{height}"
            ),
            Self::BufferSizeMismatch { expected, actual } => write!(
                f,
                "RGB buffer size mismatch: expected {expected} bytes, got {actual}"
            ),
            Self::InvalidQuality { value } => write!(
                f,
                "Invalid quality parameter: {value} (must be 0-100)"
            ),
            Self::Internal(msg) => write!(f, "VP8 encode error: {msg}"),
        }
    }
}

impl std::error::Error for Vp8EncodeError {}
