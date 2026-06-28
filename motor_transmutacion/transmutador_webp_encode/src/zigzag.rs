//! Zig-zag scan order for VP8 4×4 DCT coefficients.
//!
//! VP8 uses a specific zig-zag pattern to reorder 16 DCT coefficients
//! from 2D (4×4) to 1D, placing the DC first and AC coefficients in
//! order of increasing spatial frequency.

/// VP8 zig-zag scan order for 4×4 blocks.
///
/// Maps raster position (0-15) to zig-zag position (0-15).
/// `scan[i]` = the raster position that appears at zig-zag position `i`.
const ZIGZAG_SCAN: [usize; 16] = [
    0, 1, 4, 8, 5, 2, 3, 6, 9, 12, 13, 10, 7, 11, 14, 15,
];

/// Reorder 16 coefficients (in 4×4 raster order) to zig-zag order.
///
/// The first coefficient (index 0) is the DC coefficient.
/// The remaining 15 are AC coefficients in increasing frequency order.
pub fn zigzag_scan(coeffs: [i16; 16]) -> [i16; 16] {
    let mut out = [0i16; 16];
    for (zig_pos, &raster_pos) in ZIGZAG_SCAN.iter().enumerate() {
        out[zig_pos] = coeffs[raster_pos];
    }
    out
}

/// Find the last non-zero coefficient position in zig-zag order.
///
/// Returns the position (0-15) of the last non-zero coefficient.
/// Returns 0 if all coefficients are zero (only DC at position 0).
pub fn find_eob(scan: &[i16; 16]) -> usize {
    let mut eob = 0;
    for i in 0..16 {
        if scan[i] != 0 {
            eob = i;
        }
    }
    eob
}

/// Map a sub-block index (0-23) to the coefficient type for VP8 encoding.
///
/// VP8 encodes different types of coefficients with different probability contexts:
/// - Type 0: Y DC (sub-blocks 0-15, position 0 in zig-zag)
/// - Type 1: Y AC (sub-blocks 0-15, positions 1-15)
/// - Type 2: UV DC (sub-blocks 16-23, position 0)
/// - Type 3: UV AC (sub-blocks 16-23, positions 1-15)
///
/// For the WHT (luma DC 4×4), the 16 coefficients are all treated as
/// a separate pass — the WHT coefficients replace the 16 Y DC values.
pub fn coeff_type_from_subblock(sub_idx: usize) -> (usize, usize) {
    if sub_idx < 16 {
        (0, 1) // Y_DC (type 0), Y_AC (type 1)
    } else {
        (2, 3) // UV_DC (type 2), UV_AC (type 3)
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zigzag_first_is_dc() {
        let input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        let scanned = zigzag_scan(input);
        assert_eq!(scanned[0], 0, "first coefficient should be DC (raster position 0)");
    }

    #[test]
    fn zigzag_last_is_15() {
        let input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        let scanned = zigzag_scan(input);
        assert_eq!(scanned[15], 15, "last coefficient should be raster position 15");
    }

    #[test]
    fn find_eob_all_zeros() {
        let scan = [0i16; 16];
        assert_eq!(find_eob(&scan), 0);
    }

    #[test]
    fn find_eob_with_data() {
        let mut scan = [0i16; 16];
        scan[5] = 42;
        assert_eq!(find_eob(&scan), 5);
    }

    #[test]
    fn find_eob_last_nonzero() {
        let mut scan = [0i16; 16];
        scan[0] = 10;
        scan[15] = 5;
        assert_eq!(find_eob(&scan), 15);
    }

    #[test]
    fn coeff_types_for_y_blocks() {
        for i in 0..16 {
            let (dc_type, ac_type) = coeff_type_from_subblock(i);
            assert_eq!(dc_type, 0, "Y subblock {i}: DC type should be 0");
            assert_eq!(ac_type, 1, "Y subblock {i}: AC type should be 1");
        }
    }

    #[test]
    fn coeff_types_for_uv_blocks() {
        for i in 16..24 {
            let (dc_type, ac_type) = coeff_type_from_subblock(i);
            assert_eq!(dc_type, 2, "UV subblock {i}: DC type should be 2");
            assert_eq!(ac_type, 3, "UV subblock {i}: AC type should be 3");
        }
    }
}
