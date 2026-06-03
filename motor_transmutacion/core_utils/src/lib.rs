use core::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TransmutationError {
    EmptyInput,
    InputTooLarge { size: usize, max: usize },
    ConversionFailed(String),
}

impl fmt::Display for TransmutationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyInput => write!(f, "Input is empty; no bytes to transmute"),
            Self::InputTooLarge { size, max } => {
                write!(
                    f,
                    "Input size {} exceeds maximum allowed bytes ({})",
                    size, max
                )
            }
            Self::ConversionFailed(msg) => write!(f, "Transmutation failed: {}", msg),
        }
    }
}

pub const MAX_INPUT_BYTES: usize = 50 * 1024 * 1024;

pub fn validate_input(bytes: &[u8]) -> Result<(), String> {
    if bytes.is_empty() {
        return Err(TransmutationError::EmptyInput.to_string());
    }
    if bytes.len() > MAX_INPUT_BYTES {
        return Err(
            TransmutationError::InputTooLarge {
                size: bytes.len(),
                max: MAX_INPUT_BYTES,
            }
            .to_string(),
        );
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_empty_input() {
        let result = validate_input(&[]);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty"));
    }

    #[test]
    fn accepts_valid_input() {
        let result = validate_input(&[0u8; 1024]);
        assert!(result.is_ok());
    }

    #[test]
    fn rejects_oversized_input() {
        let result = validate_input(&[0u8; MAX_INPUT_BYTES + 1]);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("exceeds"));
    }

    #[test]
    fn error_display_is_descriptive() {
        let e = TransmutationError::EmptyInput;
        assert!(e.to_string().contains("empty"));

        let e = TransmutationError::InputTooLarge {
            size: 100,
            max: 50,
        };
        assert!(e.to_string().contains("100"));
        assert!(e.to_string().contains("50"));

        let e = TransmutationError::ConversionFailed("bad pixel".into());
        assert!(e.to_string().contains("bad pixel"));
    }
}
