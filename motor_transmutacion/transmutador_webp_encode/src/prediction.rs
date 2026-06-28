//! Intra prediction for VP8 keyframes.
//!
//! Phase 1 implements only DC_PRED (mode 0). Other modes (V, H, TM,
//! and the 10 sub-block modes) are stubs for Phase 2.

/// VP8 macroblock prediction modes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum YMode {
    DcPred = 0,
    VPred = 1,
    HPred = 2,
    TmPred = 3,
}

impl YMode {
    pub fn from_u8(v: u8) -> Self {
        match v {
            0 => YMode::DcPred,
            1 => YMode::VPred,
            2 => YMode::HPred,
            3 => YMode::TmPred,
            _ => YMode::DcPred,
        }
    }
}

/// Predict a 16×16 luma block using DC_PRED.
///
/// `above`: 16 pixels from the row above the MB (or all 128 if unavailable).
/// `left`: 16 pixels from the column left of the MB (or all 128 if unavailable).
/// `has_above`: whether the above row is available (false for first row).
/// `has_left`: whether the left column is available (false for first column).
pub fn predict_dc_16x16(
    above: &[u8; 16],
    left: &[u8; 16],
    has_above: bool,
    has_left: bool,
) -> [u8; 256] {
    let avg = dc_average(above, left, has_above, has_left);
    [avg; 256]
}

/// Predict an 8×8 chroma block using DC_PRED.
pub fn predict_dc_8x8(
    above: &[u8; 8],
    left: &[u8; 8],
    has_above: bool,
    has_left: bool,
) -> [u8; 64] {
    let mut above16 = [128u8; 16];
    let mut left16 = [128u8; 16];
    if has_above {
        for i in 0..8 {
            above16[i] = above[i];
            above16[i + 8] = above[i]; // replicate
        }
    }
    if has_left {
        for i in 0..8 {
            left16[i] = left[i];
            left16[i + 8] = left[i]; // replicate
        }
    }
    let avg = dc_average(&above16, &left16, has_above, has_left);
    [avg; 64]
}

/// Compute DC average from above and left neighbors.
fn dc_average(above: &[u8; 16], left: &[u8; 16], has_above: bool, has_left: bool) -> u8 {
    let avg: u32;
    if has_above && has_left {
        let sum: u32 = above.iter().map(|&v| v as u32).sum::<u32>()
            + left.iter().map(|&v| v as u32).sum::<u32>();
        avg = (sum + 16) >> 5; // divide by 32, round
    } else if has_above {
        let sum: u32 = above.iter().map(|&v| v as u32).sum();
        avg = (sum + 8) >> 4; // divide by 16, round
    } else if has_left {
        let sum: u32 = left.iter().map(|&v| v as u32).sum();
        avg = (sum + 8) >> 4;
    } else {
        avg = 128;
    }
    avg as u8
}

/// Compute the residual (original - prediction) for a 16×16 block.
/// Returns 16 sub-blocks of 4×4 residuals (256 values) organized as
/// [block0, block1, ..., block15] where each block is 16 values in raster order.
pub fn compute_residual_16x16(original: &[u8; 256], prediction: &[u8; 256]) -> [i16; 256] {
    let mut residual = [0i16; 256];
    for i in 0..256 {
        residual[i] = original[i] as i16 - prediction[i] as i16;
    }
    residual
}

/// Compute the residual for an 8×8 chroma block.
pub fn compute_residual_8x8(original: &[u8; 64], prediction: &[u8; 64]) -> [i16; 64] {
    let mut residual = [0i16; 64];
    for i in 0..64 {
        residual[i] = original[i] as i16 - prediction[i] as i16;
    }
    residual
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dc_pred_no_neighbors() {
        let above = [128u8; 16];
        let left = [128u8; 16];
        let pred = predict_dc_16x16(&above, &left, false, false);
        assert_eq!(pred[0], 128, "no neighbors → predict 128");
        assert!(pred.iter().all(|&v| v == 128));
    }

    #[test]
    fn dc_pred_above_only() {
        let above = [200u8; 16];
        let left = [128u8; 16];
        let pred = predict_dc_16x16(&above, &left, true, false);
        // Avg of 16 × 200 = 3200, (3200 + 8) >> 4 = 200
        assert_eq!(pred[0], 200);
    }

    #[test]
    fn dc_pred_left_only() {
        let above = [128u8; 16];
        let left = [100u8; 16];
        let pred = predict_dc_16x16(&above, &left, false, true);
        assert_eq!(pred[0], 100);
    }

    #[test]
    fn dc_pred_both() {
        let above = [100u8; 16];
        let left = [200u8; 16];
        let pred = predict_dc_16x16(&above, &left, true, true);
        // sum = 16*100 + 16*200 = 4800, (4800+16)>>5 = 150
        assert!((pred[0] as i32 - 150).abs() <= 1);
    }

    #[test]
    fn residual_zero_for_identical() {
        let original = [100u8; 256];
        let prediction = [100u8; 256];
        let residual = compute_residual_16x16(&original, &prediction);
        assert!(residual.iter().all(|&v| v == 0));
    }

    #[test]
    fn residual_positive_difference() {
        let mut original = [100u8; 256];
        original[0] = 110;
        let prediction = [100u8; 256];
        let residual = compute_residual_16x16(&original, &prediction);
        assert_eq!(residual[0], 10);
        assert_eq!(residual[1], 0);
    }
}
