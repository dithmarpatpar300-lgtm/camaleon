//! Staged AVIF diagnosis — container parse vs AV1 decode, for support and CLI tooling.

use crate::avif_container::normalize_avif_input;
use crate::avif_probe::{inspect_avif, is_animated_avif};
use zenavif::detect::{probe as detect_probe, ChromaSampling};
use zenavif_parse::AvifParser;

#[derive(Debug, Clone)]
pub struct AvifDiagnosis {
    pub file_bytes: usize,
    pub major_brand: String,
    pub compatible_brands: Vec<String>,
    pub container_ok: bool,
    pub container_error: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub bit_depth: Option<u8>,
    pub av1_profile: Option<u8>,
    pub chroma_sampling: Option<String>,
    pub monochrome: Option<bool>,
    pub has_alpha: Option<bool>,
    pub has_animation: Option<bool>,
    pub is_grid: bool,
    pub has_icc_profile: bool,
    pub has_gain_map: bool,
    pub lossless: Option<bool>,
    pub decode_ok: bool,
    pub decode_error: Option<String>,
    pub failure_stage: Option<&'static str>,
}

fn brand_label(b: &[u8; 4]) -> String {
    String::from_utf8_lossy(b).to_string()
}

pub fn diagnose_avif(input: &[u8]) -> AvifDiagnosis {
    let input = normalize_avif_input(input);
    let mut diag = AvifDiagnosis {
        file_bytes: input.len(),
        major_brand: String::new(),
        compatible_brands: Vec::new(),
        container_ok: false,
        container_error: None,
        width: None,
        height: None,
        bit_depth: None,
        av1_profile: None,
        chroma_sampling: None,
        monochrome: None,
        has_alpha: None,
        has_animation: None,
        is_grid: false,
        has_icc_profile: false,
        has_gain_map: false,
        lossless: None,
        decode_ok: false,
        decode_error: None,
        failure_stage: None,
    };

    if input.len() < 12 {
        diag.container_error = Some("file too short for ISOBMFF".into());
        diag.failure_stage = Some("container");
        return diag;
    }

    if let Ok(parser) = AvifParser::from_bytes(&input) {
        diag.major_brand = brand_label(parser.major_brand());
        diag.compatible_brands = parser
            .compatible_brands()
            .iter()
            .map(brand_label)
            .collect();
        diag.is_grid = parser.grid_config().is_some();
        diag.has_gain_map = parser.gain_map_metadata().is_some();
    }

    match inspect_avif(&input) {
        Ok(info) => {
            diag.container_ok = true;
            diag.width = Some(info.width);
            diag.height = Some(info.height);
            diag.bit_depth = Some(info.bit_depth);
            diag.has_alpha = Some(info.has_alpha_channel);
            diag.has_animation = Some(info.is_sequence);
            diag.lossless = info.lossless;
        }
        Err(e) => {
            diag.container_error = Some(e);
            diag.failure_stage = Some("container");
            return diag;
        }
    }

    if let Ok(p) = detect_probe(&input) {
        diag.av1_profile = Some(p.profile);
        diag.monochrome = Some(p.monochrome);
        diag.chroma_sampling = Some(format!("{:?}", p.chroma_sampling));
        diag.has_icc_profile = p.has_icc_profile;
        if diag.has_gain_map {
            // detect probe does not expose gain map; parser already checked
        }
        if diag.bit_depth.is_none() {
            diag.bit_depth = Some(p.bit_depth);
        }
    }

    // Re-check animation via parser (authoritative for frame count)
    if let Ok(parser) = AvifParser::from_bytes(&input) {
        diag.has_animation = Some(is_animated_avif(&parser));
    }

    match crate::avif_decode::decode_avif_to_dynamic(&input) {
        Ok(_) => {
            diag.decode_ok = true;
        }
        Err(e) => {
            diag.decode_error = Some(format_decode_failure(&input, &e));
            diag.failure_stage = Some("decode");
        }
    }

    diag
}

pub fn format_decode_failure(input: &[u8], base: &str) -> String {
    let mut parts = vec![base.to_string()];

    if let Ok(p) = detect_probe(input) {
        parts.push(format!(
            "AV1 probe: {}x{}, {}-bit, profile {}, chroma {:?}, ICC={}, animated={}",
            p.width,
            p.height,
            p.bit_depth,
            p.profile,
            p.chroma_sampling,
            p.has_icc_profile,
            p.has_animation
        ));
        if p.chroma_sampling == ChromaSampling::Yuv422 {
            parts.push(
                "Hint: 4:2:2 chroma is less common on the web; some Wasm decoders are tested mainly on 4:2:0.".into(),
            );
        }
        if p.has_icc_profile {
            parts.push(
                "Hint: embedded ICC profile present — Windows Photos uses WIC color management; browser Wasm path outputs 8-bit SDR RGB.".into(),
            );
        }
    }

    if let Ok(parser) = AvifParser::from_bytes(input) {
        if parser.grid_config().is_some() {
            parts.push("Hint: grid (tiled) AVIF — decode must stitch tiles; a single-tile grid bug in the decoder would fail here.".into());
        }
        if parser.gain_map_metadata().is_some() {
            parts.push(
                "Hint: ISO 21496-1 gain map (HDR) metadata present — Photos may show the base SDR layer only; full HDR composite is not required for viewing.".into(),
            );
        }
    }

    parts.push(
        "Hint: Windows Photos decodes via WIC + AV1 Video Extension; Camaleon uses zenavif in Wasm — different stacks.".into(),
    );

    parts.join(" | ")
}

impl AvifDiagnosis {
    pub fn summary_lines(&self) -> Vec<String> {
        let mut lines = Vec::new();
        lines.push(format!("Bytes: {}", self.file_bytes));
        lines.push(format!(
            "Brands: {} + [{}]",
            self.major_brand,
            self.compatible_brands.join(", ")
        ));
        if let Some(e) = &self.container_error {
            lines.push(format!("Container: FAIL — {e}"));
        } else if self.container_ok {
            lines.push(format!(
                "Container: OK — {}x{}, {}-bit, grid={}, gain_map={}",
                self.width.unwrap_or(0),
                self.height.unwrap_or(0),
                self.bit_depth.unwrap_or(0),
                self.is_grid,
                self.has_gain_map
            ));
        }
        if let Some(p) = self.av1_profile {
            lines.push(format!(
                "AV1: profile {p}, chroma {}, mono={}, ICC={}",
                self.chroma_sampling.as_deref().unwrap_or("?"),
                self.monochrome.unwrap_or(false),
                self.has_icc_profile
            ));
        }
        if self.decode_ok {
            lines.push("Decode: OK (zenavif → 8-bit raster)".into());
        } else if let Some(e) = &self.decode_error {
            lines.push(format!("Decode: FAIL — {e}"));
        }
        if let Some(stage) = self.failure_stage {
            lines.push(format!("Failure stage: {stage}"));
        }
        lines
    }
}
