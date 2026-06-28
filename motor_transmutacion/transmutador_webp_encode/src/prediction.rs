//! Intra prediction for VP8 keyframes — all 14 modes.
//!
//! Phase 2 implements:
//! - 4 macroblock modes: DC, V, H, TM (16×16)
//! - 10 sub-block modes: B_DC through B_HU (4×4)
//! - Mode decision via SAD comparison
//! - Chroma prediction (8×8, DC/V/H/TM)

/// VP8 macroblock prediction modes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum YMode {
    DcPred = 0,
    VPred = 1,
    HPred = 2,
    TmPred = 3,
    BPred = 4,
}

impl YMode {
    pub fn from_u8(v: u8) -> Self {
        match v {
            0 => YMode::DcPred,
            1 => YMode::VPred,
            2 => YMode::HPred,
            3 => YMode::TmPred,
            4 => YMode::BPred,
            _ => YMode::DcPred,
        }
    }
}

/// VP8 4×4 sub-block prediction modes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SubMode {
    BDC = 0,   BTM = 1,  BVE = 2,  BHE = 3,  BLD = 4,
    BRD = 5,   BVR = 6,  BVL = 7,  BHD = 8,  BHU = 9,
}

// ---------------------------------------------------------------------------
// Macroblock-level prediction (16×16 luma)
// ---------------------------------------------------------------------------

fn clamp_u8(v: i32) -> u8 {
    v.max(0).min(255) as u8
}

/// Predict a 16×16 block using the given mode.
pub fn predict_16x16(
    mode: YMode, above: &[u8; 16], left: &[u8; 16],
    has_above: bool, has_left: bool, top_left: u8,
) -> [u8; 256] {
    match mode {
        YMode::DcPred => predict_dc_16x16(above, left, has_above, has_left),
        YMode::VPred  => predict_v_16x16(above, has_above),
        YMode::HPred  => predict_h_16x16(left, has_left),
        YMode::TmPred => predict_tm_16x16(above, left, has_above, has_left, top_left),
        YMode::BPred  => predict_dc_16x16(above, left, has_above, has_left), // fallback
    }
}

pub fn predict_dc_16x16(above: &[u8; 16], left: &[u8; 16], has_above: bool, has_left: bool) -> [u8; 256] {
    let avg = dc_average(above, left, has_above, has_left);
    [avg; 256]
}

pub fn predict_v_16x16(above: &[u8; 16], has_above: bool) -> [u8; 256] {
    let row = if has_above { *above } else { [128u8; 16] };
    let mut pred = [0u8; 256];
    for i in 0..16 {
        pred[i*16..i*16+16].copy_from_slice(&row);
    }
    pred
}

pub fn predict_h_16x16(left: &[u8; 16], has_left: bool) -> [u8; 256] {
    let col = if has_left { *left } else { [128u8; 16] };
    let mut pred = [0u8; 256];
    for i in 0..16 {
        let val = col[i];
        for j in 0..16 { pred[i*16 + j] = val; }
    }
    pred
}

pub fn predict_tm_16x16(above: &[u8; 16], left: &[u8; 16], has_above: bool, has_left: bool, top_left: u8) -> [u8; 256] {
    let a = if has_above { *above } else { [128u8; 16] };
    let l = if has_left { *left } else { [128u8; 16] };
    let tl = if has_above && has_left { top_left } else { 128u8 };
    let mut pred = [0u8; 256];
    for i in 0..16 {
        for j in 0..16 {
            pred[i*16 + j] = clamp_u8(l[i] as i32 + a[j] as i32 - tl as i32);
        }
    }
    pred
}

// ---------------------------------------------------------------------------
// Chroma prediction (8×8)
// ---------------------------------------------------------------------------

pub fn predict_chroma_8x8(mode: YMode, above: &[u8; 8], left: &[u8; 8], has_above: bool, has_left: bool, top_left: u8) -> [u8; 64] {
    match mode {
        YMode::DcPred => predict_dc_8x8(above, left, has_above, has_left),
        YMode::VPred  => predict_v_8x8(above, has_above),
        YMode::HPred  => predict_h_8x8(left, has_left),
        YMode::TmPred => predict_tm_8x8(above, left, has_above, has_left, top_left),
        _ => predict_dc_8x8(above, left, has_above, has_left),
    }
}

pub fn predict_dc_8x8(above: &[u8; 8], left: &[u8; 8], has_above: bool, has_left: bool) -> [u8; 64] {
    let mut above16 = [128u8; 16];
    let mut left16 = [128u8; 16];
    if has_above { for i in 0..8 { above16[i] = above[i]; above16[i+8] = above[i]; } }
    if has_left  { for i in 0..8 { left16[i] = left[i]; left16[i+8] = left[i]; } }
    let avg = dc_average(&above16, &left16, has_above, has_left);
    [avg; 64]
}

fn predict_v_8x8(above: &[u8; 8], has_above: bool) -> [u8; 64] {
    let row = if has_above { *above } else { [128u8; 8] };
    let mut pred = [0u8; 64];
    for i in 0..8 { pred[i*8..i*8+8].copy_from_slice(&row); }
    pred
}

fn predict_h_8x8(left: &[u8; 8], has_left: bool) -> [u8; 64] {
    let col = if has_left { *left } else { [128u8; 8] };
    let mut pred = [0u8; 64];
    for i in 0..8 { for j in 0..8 { pred[i*8+j] = col[i]; } }
    pred
}

fn predict_tm_8x8(above: &[u8; 8], left: &[u8; 8], has_above: bool, has_left: bool, top_left: u8) -> [u8; 64] {
    let a = if has_above { *above } else { [128u8; 8] };
    let l = if has_left { *left } else { [128u8; 8] };
    let tl = if has_above && has_left { top_left } else { 128u8 };
    let mut pred = [0u8; 64];
    for i in 0..8 { for j in 0..8 { pred[i*8+j] = clamp_u8(l[i] as i32 + a[j] as i32 - tl as i32); } }
    pred
}

fn dc_average(above: &[u8; 16], left: &[u8; 16], has_above: bool, has_left: bool) -> u8 {
    let avg: u32;
    if has_above && has_left {
        let sum: u32 = above.iter().map(|&v| v as u32).sum::<u32>()
            + left.iter().map(|&v| v as u32).sum::<u32>();
        avg = (sum + 16) >> 5;
    } else if has_above {
        let sum: u32 = above.iter().map(|&v| v as u32).sum();
        avg = (sum + 8) >> 4;
    } else if has_left {
        let sum: u32 = left.iter().map(|&v| v as u32).sum();
        avg = (sum + 8) >> 4;
    } else {
        avg = 128;
    }
    avg as u8
}

// ---------------------------------------------------------------------------
// Sub-block (4×4) prediction — 10 modes
// ---------------------------------------------------------------------------

/// Predict a 4×4 sub-block using one of the 10 B_PRED modes.
///
/// `above`: 4 pixels above the block (P[0..3]).
/// `left`: 4 pixels to the left of the block (L[0..3]).
/// `tl`: top-left pixel.
/// `above_right`: 4 pixels above and to the right (AR[0..3]), for B_LD mode.
pub fn predict_4x4_sub(
    mode: SubMode, above: [u8; 4], left: [u8; 4], tl: u8,
    above_right: [u8; 4],
) -> [u8; 16] {
    match mode {
        SubMode::BDC => b_dc(above, left, tl),
        SubMode::BTM => b_tm(above, left, tl),
        SubMode::BVE => b_ve(above),
        SubMode::BHE => b_he(left),
        SubMode::BLD => b_ld(above, above_right),
        SubMode::BRD => b_rd(left, tl),
        SubMode::BVR => b_vr(above, left, tl),
        SubMode::BVL => b_vl(above, above_right),
        SubMode::BHD => b_hd(above, left, tl),
        SubMode::BHU => b_hu(left),
    }
}

fn avg2(a: u8, b: u8) -> u8 { ((a as u32 + b as u32 + 1) >> 1) as u8 }
fn avg3(a: u8, b: u8, c: u8) -> u8 { ((a as u32 + 2*b as u32 + c as u32 + 2) >> 2) as u8 }

fn b_dc(above: [u8; 4], left: [u8; 4], _tl: u8) -> [u8; 16] {
    let sum_a: u32 = above.iter().map(|&v| v as u32).sum();
    let sum_l: u32 = left.iter().map(|&v| v as u32).sum();
    let avg = ((sum_a + sum_l + 4) >> 3) as u8;
    [avg; 16]
}

fn b_tm(above: [u8; 4], left: [u8; 4], tl: u8) -> [u8; 16] {
    let mut pred = [0u8; 16];
    for i in 0..4 { for j in 0..4 {
        pred[i*4 + j] = clamp_u8(left[i] as i32 + above[j] as i32 - tl as i32);
    }}
    pred
}

fn b_ve(above: [u8; 4]) -> [u8; 16] {
    let mut pred = [0u8; 16];
    for i in 0..4 { pred[i*4..i*4+4].copy_from_slice(&above); }
    pred
}

fn b_he(left: [u8; 4]) -> [u8; 16] {
    let mut pred = [0u8; 16];
    for i in 0..4 { for j in 0..4 { pred[i*4+j] = left[i]; } }
    pred
}

fn b_ld(above: [u8; 4], ar: [u8; 4]) -> [u8; 16] {
    let p = [avg2(ar[0], ar[1]), avg2(ar[1], ar[2]), avg2(ar[2], ar[3]), avg2(ar[3], above[0])];
    let p1 = [avg2(p[0], p[1]), avg2(p[1], p[2]), avg2(p[2], p[3]), avg2(p[3], above[1])];
    let p2 = [avg2(p1[0], p1[1]), avg2(p1[1], p1[2]), avg2(p1[2], p1[3]), avg2(p1[3], above[2])];
    let p3 = [avg2(p2[0], p2[1]), avg2(p2[1], p2[2]), avg2(p2[2], p2[3]), avg2(p2[3], above[3])];
    let mut pred = [0u8; 16];
    pred[0..4].copy_from_slice(&p);
    pred[4..8].copy_from_slice(&p1);
    pred[8..12].copy_from_slice(&p2);
    pred[12..16].copy_from_slice(&p3);
    pred
}

fn b_rd(left: [u8; 4], tl: u8) -> [u8; 16] {
    let l = [tl, left[0], left[1], left[2], left[3]];
    let mut pred = [0u8; 16];

    pred[12] = avg2(l[3], l[2]);
    pred[8]  = avg2(l[2], l[1]);
    pred[4]  = avg2(l[1], l[0]);
    pred[0]  = avg2(l[0], tl);

    for row in [12u8, 8, 4, 0].iter() {
        let r = *row as usize;
        pred[r+1] = avg2(pred[r], l[r/4+1]);
        pred[r+2] = avg2(pred[r+1], pred[r]);
        pred[r+3] = avg2(pred[r+2], pred[r+1]);
    }
    pred
}

fn b_vr(above: [u8; 4], left: [u8; 4], tl: u8) -> [u8; 16] {
    let mut pred = [0u8; 16];
    pred[0] = avg2(above[0], tl);
    pred[1] = avg2(above[1], above[0]);
    pred[2] = avg2(above[2], above[1]);
    pred[3] = avg2(above[3], above[2]);
    pred[4] = avg3(tl, above[0], left[0]);
    pred[5] = avg2(above[2], above[1]);
    pred[6] = avg3(above[3], above[2], above[1]);
    pred[7] = avg3(above[3], above[3], above[2]);
    pred[8] = avg2(left[0], left[1]);
    pred[9] = avg2(left[1], left[0]);
    pred[10] = avg2(above[3], above[2]);
    pred[11] = above[3];
    pred[12] = avg2(left[1], left[2]);
    pred[13] = avg2(left[2], left[1]);
    pred[14] = avg2(above[3], above[2]);
    pred[15] = above[3];
    pred
}

fn b_vl(above: [u8; 4], ar: [u8; 4]) -> [u8; 16] {
    let mut pred = [0u8; 16];
    pred[0]  = avg2(above[0], above[1]);
    pred[1]  = avg2(above[1], above[2]);
    pred[2]  = avg2(above[2], above[3]);
    pred[3]  = avg2(above[3], ar[0]);
    pred[4]  = avg3(above[0], above[1], above[2]);
    pred[5]  = avg3(above[1], above[2], above[3]);
    pred[6]  = avg3(above[2], above[3], ar[0]);
    pred[7]  = avg3(above[3], ar[0], ar[1]);
    pred[7]  = avg3(above[3], ar[0], ar[1]);
    pred[8]  = avg3(above[1], above[2], above[3]);
    pred[9]  = avg3(above[2], above[3], ar[0]);
    pred[10] = avg3(above[3], ar[0], ar[1]);
    pred[11] = avg3(ar[0], ar[1], ar[2]);
    pred[12] = avg3(above[2], above[3], ar[0]);
    pred[13] = avg3(above[3], ar[0], ar[1]);
    pred[14] = avg3(ar[0], ar[1], ar[2]);
    pred[15] = avg3(ar[1], ar[2], ar[3]);
    pred
}

fn b_hd(above: [u8; 4], left: [u8; 4], tl: u8) -> [u8; 16] {
    let mut pred = [0u8; 16];
    pred[0] = avg2(tl, left[0]);
    pred[1] = avg3(tl, above[0], left[0]);
    pred[2] = avg2(above[0], above[1]);
    pred[3] = avg2(above[1], above[2]);
    pred[4] = avg2(left[0], left[1]);
    pred[5] = avg3(tl, left[0], left[1]);
    pred[6] = avg3(above[0], above[1], above[2]);
    pred[7] = avg2(above[2], above[3]);
    pred[8] = avg2(left[1], left[2]);
    pred[9] = avg3(left[0], left[1], left[2]);
    pred[10] = avg3(above[1], above[2], above[3]);
    pred[11] = avg2(above[3], above[3]);
    pred[12] = avg2(left[2], left[3]);
    pred[13] = avg3(left[1], left[2], left[3]);
    pred[14] = avg2(above[2], above[3]);
    pred[15] = above[3];
    pred
}

fn b_hu(left: [u8; 4]) -> [u8; 16] {
    let l = left;
    let mut pred = [0u8; 16];
    pred[0] = avg2(l[0], l[1]);
    pred[1] = avg2(l[1], l[2]);
    pred[2] = avg2(l[2], l[3]);
    pred[3] = l[3];
    pred[4] = avg3(l[0], l[1], l[2]);
    pred[5] = avg3(l[1], l[2], l[3]);
    pred[6] = avg2(l[3], l[3]);
    pred[7] = l[3];
    pred[8]  = pred[4];
    pred[9]  = pred[5];
    pred[10] = l[3];
    pred[11] = l[3];
    pred[12] = pred[4];
    pred[13] = l[3];
    pred[14] = l[3];
    pred[15] = l[3];
    pred
}

// ---------------------------------------------------------------------------
// Residual computation
// ---------------------------------------------------------------------------

pub fn compute_residual_16x16(original: &[u8; 256], prediction: &[u8; 256]) -> [i16; 256] {
    let mut residual = [0i16; 256];
    for i in 0..256 { residual[i] = original[i] as i16 - prediction[i] as i16; }
    residual
}

pub fn compute_residual_8x8(original: &[u8; 64], prediction: &[u8; 64]) -> [i16; 64] {
    let mut residual = [0i16; 64];
    for i in 0..64 { residual[i] = original[i] as i16 - prediction[i] as i16; }
    residual
}

// ---------------------------------------------------------------------------
// SAD-based mode decision
// ---------------------------------------------------------------------------

/// Compute Sum of Absolute Differences for a 16×16 block.
pub fn sad_16x16(a: &[u8; 256], b: &[u8; 256]) -> u32 {
    let mut sum = 0u32;
    for i in 0..256 {
        sum += (a[i] as i32 - b[i] as i32).unsigned_abs();
    }
    sum
}

/// Compute SAD for a 4×4 sub-block.
pub fn sad_4x4(a: &[u8; 16], b: &[u8; 16]) -> u32 {
    let mut sum = 0u32;
    for i in 0..16 {
        sum += (a[i] as i32 - b[i] as i32).unsigned_abs();
    }
    sum
}

/// Choose the best macroblock prediction mode using SAD.
///
/// Tries all 4 MB-level modes (DC, V, H, TM) and picks the one
/// with the lowest SAD. B_PRED (sub-block mode selection) is Phase 2.5.
pub fn choose_mb_mode(
    original: &[u8; 256],
    above: &[u8; 16], left: &[u8; 16],
    has_above: bool, has_left: bool, top_left: u8,
) -> (YMode, [u8; 256]) {
    let modes = [YMode::DcPred, YMode::VPred, YMode::HPred, YMode::TmPred];
    let mut best_mode = YMode::DcPred;
    let mut best_pred = [128u8; 256];
    let mut best_sad = u32::MAX;

    for &mode in &modes {
        let pred = predict_16x16(mode, above, left, has_above, has_left, top_left);
        let s = sad_16x16(original, &pred);
        if s < best_sad {
            best_sad = s;
            best_mode = mode;
            best_pred = pred;
        }
    }

    (best_mode, best_pred)
}

/// Choose the best sub-block mode (B_PRED) for a 4×4 block.
pub fn choose_sub_mode(
    original: &[u8; 16], above: [u8; 4], left: [u8; 4],
    tl: u8, above_right: [u8; 4],
) -> (SubMode, [u8; 16]) {
    let modes = [
        SubMode::BDC, SubMode::BTM, SubMode::BVE, SubMode::BHE, SubMode::BLD,
        SubMode::BRD, SubMode::BVR, SubMode::BVL, SubMode::BHD, SubMode::BHU,
    ];
    let mut best_mode = SubMode::BDC;
    let mut best_pred = [128u8; 16];
    let mut best_sad = u32::MAX;

    for &mode in &modes {
        let pred = predict_4x4_sub(mode, above, left, tl, above_right);
        let s = sad_4x4(original, &pred);
        if s < best_sad {
            best_sad = s;
            best_mode = mode;
            best_pred = pred;
        }
    }
    (best_mode, best_pred)
}

/// Full B_PRED prediction for a 16×16 block.
/// Returns 16 sub-block predictions and their modes.
pub fn predict_bpred_16x16(
    original: &[u8; 256],
    above: &[u8; 16], left: &[u8; 16],
    has_above: bool, has_left: bool, top_left: u8,
) -> ([SubMode; 16], [u8; 256]) {
    let mut modes = [SubMode::BDC; 16];
    let mut pred = [0u8; 256];

    for sub_idx in 0..16 {
        let sub_row = sub_idx / 4;
        let sub_col = sub_idx % 4;

        // Extract original 4×4 block
        let mut orig_4x4 = [0u8; 16];
        for r in 0..4 { for c in 0..4 {
            orig_4x4[r*4 + c] = original[(sub_row*4 + r)*16 + sub_col*4 + c];
        }}

        // Neighbor pixels for this sub-block
        let (ab, le, tl) = if sub_row == 0 && sub_col == 0 {
            // Top-left sub-block: above row from MB above, left col from MB left
            let mut a = [128u8; 4];
            let mut l = [128u8; 4];
            if has_above { a.copy_from_slice(&above[0..4]); }
            if has_left  { l[0] = left[0]; l[1] = left[1]; l[2] = left[2]; l[3] = left[3]; }
            (a, l, top_left)
        } else if sub_row == 0 {
            // Top row sub-blocks: above from MB above, left from previous sub-block in same MB
            let mut a = [128u8; 4];
            if has_above { for i in 0..4 { a[i] = above[sub_col*4 + i]; } }
            let mut l = [0u8; 4];
            for i in 0..4 { l[i] = pred[(i)*16 + sub_col*4 - 1]; }
            let tl = if sub_col > 0 { pred[sub_col*4 - 1] } else if has_above && has_left { top_left } else { 128 };
            (a, l, tl)
        } else if sub_col == 0 {
            // Left column sub-blocks: above from previous in MB, left from MB left
            let mut a = [0u8; 4];
            for i in 0..4 { a[i] = pred[(sub_row*4 - 1)*16 + i]; }
            let mut l = [128u8; 4];
            if has_left { for i in 0..4 { l[i] = left[sub_row*4 + i]; } }
            let tl = if sub_row > 0 { pred[(sub_row*4 - 1)*16 + 15] } else if has_above && has_left { top_left } else { 128 };
            (a, l, tl)
        } else {
            // Interior sub-blocks: neighbors from same MB
            let mut a = [0u8; 4];
            for i in 0..4 { a[i] = pred[(sub_row*4 - 1)*16 + sub_col*4 + i]; }
            let mut l = [0u8; 4];
            for i in 0..4 { l[i] = pred[(sub_row*4 + i)*16 + sub_col*4 - 1]; }
            let tl = pred[(sub_row*4 - 1)*16 + sub_col*4 - 1];
            (a, l, tl)
        };

        let ar = [128u8; 4]; // above_right: simplified (use 128 for now)
        let (best, blk_pred) = choose_sub_mode(&orig_4x4, ab, le, tl, ar);
        modes[sub_idx] = best;
        for r in 0..4 { for c in 0..4 {
            pred[(sub_row*4 + r)*16 + sub_col*4 + c] = blk_pred[r*4 + c];
        }}
    }

    (modes, pred)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dc_pred_no_neighbors() {
        let pred = predict_dc_16x16(&[128;16], &[128;16], false, false);
        assert_eq!(pred[0], 128);
    }

    #[test]
    fn v_pred_fills_rows() {
        let above = [100u8; 16];
        let pred = predict_v_16x16(&above, true);
        assert_eq!(pred[0], 100);
        assert_eq!(pred[255], 100);
    }

    #[test]
    fn h_pred_fills_columns() {
        let mut left = [128u8; 16];
        left[0] = 50;
        let pred = predict_h_16x16(&left, true);
        assert_eq!(pred[0], 50);
        assert_eq!(pred[15], 50); // col 15 of row 0
        assert_eq!(pred[16], 128); // row 1, col 0
    }

    #[test]
    fn tm_pred_identity_on_smooth() {
        let above = [100u8; 16];
        let left = [100u8; 16];
        let pred = predict_tm_16x16(&above, &left, true, true, 100);
        assert_eq!(pred[0], 100);
    }

    #[test]
    fn mode_decision_picks_best() {
        // Create image where V_PRED is clearly best:
        // entire image matches the above row
        let original = [200u8; 256];
        let above = [200u8; 16];
        let left = [50u8; 16]; // very different from original
        let (mode, _pred) = choose_mb_mode(&original, &above, &left, true, true, 200);
        assert_eq!(mode, YMode::VPred, "V_PRED should win when image matches above row");
    }

    #[test]
    fn residual_zero_for_identical() {
        let r = compute_residual_16x16(&[100;256], &[100;256]);
        assert!(r.iter().all(|&v| v == 0));
    }
}
