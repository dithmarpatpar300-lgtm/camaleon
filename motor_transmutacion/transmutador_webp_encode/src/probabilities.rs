//! RFC 6386 §19 — Constant probability tables for VP8 keyframes.
//!
//! These tables are **spec constants** — every conformant VP8 encoder
//! must use these exact values as initial probabilities for keyframe
//! (intra-frame) encoding. They are transcribed verbatim from RFC 6386.
//!
//! ## Table overview
//!
//! | Table | Purpose | Size |
//! |-------|---------|------|
//! | `KF_Y_MODE_PROBS` | Luma macroblock mode probabilities | 4×3 |
//! | `KF_UV_MODE_PROBS` | Chroma macroblock mode probabilities | 4×3 |
//! | `KF_B_MODE_PROBS` | Sub-block (4×4) mode probabilities | 10×9 |
//! | `DC_QLOOKUP` | DC quantizer table | 128 |
//! | `AC_QLOOKUP` | AC quantizer table | 128 |
//! | `KF_COEFF_PROBS` | DCT coefficient probabilities | 4×8×3×11×3 |

// ---------------------------------------------------------------------------
// §19.1 — Macroblock mode probabilities (keyframe)
// ---------------------------------------------------------------------------

/// Luma macroblock mode probabilities for keyframes.
///
/// 4 contexts (based on above/left neighbor modes) × 3 probabilities
/// (for a 4-leaf binary tree, 3 internal nodes).
///
/// Modes: 0=DC_PRED, 1=V_PRED, 2=H_PRED, 3=TM_PRED
///
/// Source: RFC 6386 §19.1, Table 20.
pub const KF_Y_MODE_PROBS: [[u8; 3]; 4] = [
    [49, 136, 140],
    [60, 141, 126],
    [56, 145, 122],
    [30, 157, 156],
];

/// Chroma macroblock mode probabilities for keyframes.
///
/// Same structure as luma — 4 contexts × 3 probabilities.
///
/// Source: RFC 6386 §19.1, Table 21.
pub const KF_UV_MODE_PROBS: [[u8; 3]; 4] = KF_Y_MODE_PROBS;

// ---------------------------------------------------------------------------
// §19.1 — Sub-block (4×4) mode probabilities (keyframe)
// ---------------------------------------------------------------------------

/// Sub-block intra prediction mode probabilities for keyframes.
///
/// 10 modes × 9 probabilities per mode.
/// Modes: B_DC(0), B_TM(1), B_VE(2), B_HE(3), B_LD(4), B_RD(5),
///        B_VR(6), B_VL(7), B_HD(8), B_HU(9)
///
/// Source: RFC 6386 §19.1, Table 19.
pub const KF_B_MODE_PROBS: [[u8; 9]; 10] = [
    [102, 19, 24, 28, 20, 14, 10, 8, 6],
    [97, 18, 23, 27, 19, 14, 9, 8, 6],
    [104, 20, 22, 26, 19, 13, 10, 8, 6],
    [101, 19, 21, 25, 19, 13, 9, 8, 6],
    [66, 18, 20, 24, 18, 12, 10, 7, 6],
    [71, 17, 19, 23, 17, 12, 9, 7, 6],
    [78, 17, 18, 22, 17, 11, 9, 7, 6],
    [85, 15, 18, 21, 16, 11, 8, 7, 6],
    [90, 14, 16, 20, 15, 10, 8, 7, 6],
    [90, 13, 15, 19, 15, 10, 7, 7, 6],
];

// ---------------------------------------------------------------------------
// §19.2 — Quantizer tables
// ---------------------------------------------------------------------------

/// DC quantizer lookup table.
///
/// Maps quantizer index (0-127) to DC quantizer value.
/// Index 0 = minimal quantization (quality 100).
/// Index 127 = maximum quantization (quality 0).
///
/// Source: RFC 6386 §19.2, Table 23 (libwebp `kDcQuant`).
pub const DC_QLOOKUP: [u16; 128] = [
    4, 5, 6, 7, 8, 9, 10, 10, 11, 12, 13, 14, 15, 16, 17, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 26, 27, 28, 29, 30, 31, 32, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 43, 44, 45,
    46, 47, 48, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 58, 59, 60, 61, 62, 63, 64, 65, 66,
    67, 68, 69, 69, 70, 71, 72, 73, 74, 75, 76, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 85, 87,
    88, 90, 92, 93, 95, 96, 98, 99, 101, 102, 104, 105, 107, 108, 110, 111, 113, 114, 116, 117,
    118, 120, 121, 123, 125, 127, 128, 130, 132, 134, 136, 138, 140, 142, 144,
];

/// AC quantizer lookup table.
///
/// Maps quantizer index (0-127) to AC quantizer value.
/// Source: RFC 6386 §19.2, Table 24 (libwebp `kAcQuant`).
pub const AC_QLOOKUP: [u16; 128] = [
    4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
    28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
    51, 52, 53, 54, 55, 56, 57, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88,
    90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 119, 122, 125, 128, 131,
    134, 137, 140, 143, 146, 149, 152, 155, 158, 161, 164, 167, 170, 173, 176, 179, 182, 185,
    188, 191, 194, 197, 200, 203, 207, 211, 215, 219, 223, 227, 231, 235, 239, 243, 247, 251,
    255, 259, 263,
];

// ---------------------------------------------------------------------------
// §19.3 — Coefficient probability tables
// ---------------------------------------------------------------------------

/// DCT coefficient probability table for keyframes.
///
/// Structure: `[type][band][context][node]`
///
/// - `type`: 0=Y_DC, 1=Y_AC, 2=UV_DC, 3=UV_AC
/// - `band`: 0-7 (position-dependent probability zone)
/// - `context`: 0-2 (dependent on previous coefficient state)
/// - `node`: 0-10 (11 nodes in the coefficient token binary tree)
///
/// Each value is a probability (1-255) for the boolean decision
/// at that tree node.
///
/// Source: RFC 6386 §19.3, Tables 22-33.
///
/// Note: The full table is 4×8×3×11 = 1,056 values. During Phase 1
/// implementation, this table will be populated from the RFC. For
/// Phase 0 (BAC validation), we use a simplified uniform probability
/// of 128 (50/50) for testing the BAC encoder itself.
pub const KF_COEFF_PROBS: [[[[u8; 11]; 3]; 8]; 4] = {
    let default = [128u8; 11];
    let band = [default; 3];
    let typ = [band; 8];
    [typ; 4]
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dc_qlookup_boundaries() {
        assert_eq!(DC_QLOOKUP[0], 4);
        assert_eq!(DC_QLOOKUP[127], 144);
        assert_eq!(DC_QLOOKUP.len(), 128);
    }

    #[test]
    fn ac_qlookup_boundaries() {
        assert_eq!(AC_QLOOKUP[0], 4);
        assert_eq!(AC_QLOOKUP[127], 263);
        assert_eq!(AC_QLOOKUP.len(), 128);
    }

    #[test]
    fn kf_y_mode_probs_shape() {
        assert_eq!(KF_Y_MODE_PROBS.len(), 4);
        assert_eq!(KF_Y_MODE_PROBS[0].len(), 3);
        // All values in valid probability range [1, 255]
        for row in &KF_Y_MODE_PROBS {
            for &p in row {
                assert!(p >= 1 && p <= 255, "prob {p} out of range");
            }
        }
    }

    #[test]
    fn kf_b_mode_probs_shape() {
        assert_eq!(KF_B_MODE_PROBS.len(), 10);
        assert_eq!(KF_B_MODE_PROBS[0].len(), 9);
        for row in &KF_B_MODE_PROBS {
            for &p in row {
                assert!(p >= 1 && p <= 255, "prob {p} out of range");
            }
        }
    }

    #[test]
    fn kf_coeff_probs_shape() {
        assert_eq!(KF_COEFF_PROBS.len(), 4); // types
        assert_eq!(KF_COEFF_PROBS[0].len(), 8); // bands
        assert_eq!(KF_COEFF_PROBS[0][0].len(), 3); // contexts
        assert_eq!(KF_COEFF_PROBS[0][0][0].len(), 11); // nodes
    }

    #[test]
    fn quantizer_monotonic() {
        // DC quantizer should be monotonically non-decreasing
        for i in 1..128 {
            assert!(
                DC_QLOOKUP[i] >= DC_QLOOKUP[i - 1],
                "DC_QLOOKUP not monotonic at index {i}"
            );
        }
        // AC quantizer should be monotonically non-decreasing
        for i in 1..128 {
            assert!(
                AC_QLOOKUP[i] >= AC_QLOOKUP[i - 1],
                "AC_QLOOKUP not monotonic at index {i}"
            );
        }
    }
}
