//! Wasm bindings for `AlphaAssessment` (enabled with `core_utils/wasm` feature).

use super::AlphaAssessment;
use super::AlphaConfidence;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct AlphaAssessmentJs {
    inner: AlphaAssessment,
}

#[wasm_bindgen]
impl AlphaAssessmentJs {
    #[wasm_bindgen(getter)]
    pub fn has_alpha_channel(&self) -> bool {
        self.inner.has_alpha_channel
    }

    #[wasm_bindgen(getter)]
    pub fn has_meaningful_alpha(&self) -> bool {
        self.inner.has_meaningful_alpha
    }

    /// `AlphaConfidence` as u8: 0=None, 1=Structural, 2=Sampled, 3=Full.
    #[wasm_bindgen(getter)]
    pub fn confidence(&self) -> u8 {
        self.inner.confidence as u8
    }
}

impl From<AlphaAssessment> for AlphaAssessmentJs {
    fn from(inner: AlphaAssessment) -> Self {
        Self { inner }
    }
}

impl AlphaAssessmentJs {
    pub fn from_assessment(assessment: AlphaAssessment) -> Self {
        assessment.into()
    }
}

#[allow(dead_code)]
pub fn confidence_label(c: AlphaConfidence) -> &'static str {
    match c {
        AlphaConfidence::None => "none",
        AlphaConfidence::Structural => "structural",
        AlphaConfidence::Sampled => "sampled",
        AlphaConfidence::Full => "full",
    }
}
