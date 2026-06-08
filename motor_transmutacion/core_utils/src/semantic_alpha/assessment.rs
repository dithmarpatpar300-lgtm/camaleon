//! Semantic alpha assessment types (SPEC §5.5.3).

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum AlphaConfidence {
    /// No alpha channel possible for this format/page.
    None = 0,
    /// Header or container tags only; pixel data not examined.
    Structural = 1,
    /// Downscaled decode or statistical pixel sample.
    Sampled = 2,
    /// Full raster scan (encode path).
    Full = 3,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AlphaAssessment {
    pub has_alpha_channel: bool,
    pub has_meaningful_alpha: bool,
    pub confidence: AlphaConfidence,
}

impl AlphaAssessment {
    pub const OPAQUE: Self = Self {
        has_alpha_channel: false,
        has_meaningful_alpha: false,
        confidence: AlphaConfidence::None,
    };

    pub fn structural_only(has_alpha_channel: bool) -> Self {
        Self {
            has_alpha_channel,
            has_meaningful_alpha: false,
            confidence: AlphaConfidence::Structural,
        }
    }

    pub fn sampled(has_alpha_channel: bool, has_meaningful_alpha: bool) -> Self {
        Self {
            has_alpha_channel,
            has_meaningful_alpha,
            confidence: AlphaConfidence::Sampled,
        }
    }

    pub fn full(has_alpha_channel: bool, has_meaningful_alpha: bool) -> Self {
        Self {
            has_alpha_channel,
            has_meaningful_alpha,
            confidence: AlphaConfidence::Full,
        }
    }
}
