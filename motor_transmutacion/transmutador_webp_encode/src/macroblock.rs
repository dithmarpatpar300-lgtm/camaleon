//! Macroblock partitioning and padding.
//!
//! Divides a VP8 frame into 16×16 macroblocks and handles edge padding
//! for images whose dimensions are not multiples of 16.

/// A single macroblock's YUV data.
///
/// Each MB contains 24 sub-blocks of 4×4 pixels:
/// - 16 luma (Y) sub-blocks
/// - 4 chroma-U sub-blocks
/// - 4 chroma-V sub-blocks
pub struct Macroblock {
    /// Macroblock column index (0-based).
    pub mb_col: usize,
    /// Macroblock row index (0-based).
    pub mb_row: usize,
    /// Y plane: 16×16 pixels (256 bytes).
    pub y: [u8; 256],
    /// U plane: 8×8 pixels (64 bytes), subsampled from 4:2:0.
    pub u: [u8; 64],
    /// V plane: 8×8 pixels (64 bytes), subsampled from 4:2:0.
    pub v: [u8; 64],
}

/// Macroblock grid configuration.
pub struct MacroblockGrid {
    /// Number of macroblock columns (ceil(width / 16)).
    pub mb_cols: usize,
    /// Number of macroblock rows (ceil(height / 16)).
    pub mb_rows: usize,
    /// Padded Y plane (padded to macroblock boundaries).
    pub padded_y: Vec<u8>,
    /// Padded U plane.
    pub padded_u: Vec<u8>,
    /// Padded V plane.
    pub padded_v: Vec<u8>,
    /// Padded width (multiple of 16).
    pub padded_width: usize,
    /// Padded height (multiple of 16).
    pub padded_height: usize,
}

impl MacroblockGrid {
    /// Create a macroblock grid from YUV planes and original dimensions.
    ///
    /// Pads the planes to macroblock boundaries by replicating the last
    /// row/column (edge extension).
    pub fn new(y: &[u8], u: &[u8], v: &[u8], width: usize, height: usize) -> Self {
        let mb_cols = (width + 15) / 16;
        let mb_rows = (height + 15) / 16;
        let padded_width = mb_cols * 16;
        let padded_height = mb_rows * 16;

        let padded_y = pad_plane(y, width, height, padded_width, padded_height);
        let uv_width = (width + 1) / 2;
        let uv_height = (height + 1) / 2;
        let padded_uv_width = mb_cols * 8;
        let padded_uv_height = mb_rows * 8;
        let padded_u = pad_plane(u, uv_width, uv_height, padded_uv_width, padded_uv_height);
        let padded_v = pad_plane(v, uv_width, uv_height, padded_uv_width, padded_uv_height);

        Self {
            mb_cols,
            mb_rows,
            padded_y,
            padded_u,
            padded_v,
            padded_width,
            padded_height,
        }
    }

    /// Extract a single macroblock at the given position.
    pub fn get_mb(&self, mb_row: usize, mb_col: usize) -> Macroblock {
        let y0 = mb_row * 16;
        let x0 = mb_col * 16;
        let u0 = mb_row * 8;
        let v0 = mb_col * 8;

        let mut y = [0u8; 256];
        let mut u = [0u8; 64];
        let mut v = [0u8; 64];

        for row in 0..16 {
            let src_row = (y0 + row) * self.padded_width + x0;
            let dst_row = row * 16;
            y[dst_row..dst_row + 16].copy_from_slice(&self.padded_y[src_row..src_row + 16]);
        }
        for row in 0..8 {
            let src_row = (u0 + row) * (self.padded_width / 2) + v0;
            let dst_row = row * 8;
            u[dst_row..dst_row + 8].copy_from_slice(&self.padded_u[src_row..src_row + 8]);
            v[dst_row..dst_row + 8].copy_from_slice(&self.padded_v[src_row..src_row + 8]);
        }

        Macroblock {
            mb_col,
            mb_row,
            y,
            u,
            v,
        }
    }

    /// Total number of macroblocks.
    pub fn total_mbs(&self) -> usize {
        self.mb_cols * self.mb_rows
    }
}

/// Pad a plane to the target dimensions by replicating edge pixels.
fn pad_plane(
    src: &[u8],
    src_width: usize,
    src_height: usize,
    pad_width: usize,
    pad_height: usize,
) -> Vec<u8> {
    let mut padded = vec![0u8; pad_width * pad_height];

    // Copy source pixels
    for row in 0..src_height {
        let src_row = row * src_width;
        let dst_row = row * pad_width;
        padded[dst_row..dst_row + src_width].copy_from_slice(&src[src_row..src_row + src_width]);
        // Pad right edge
        if src_width < pad_width {
            let last_val = src[src_row + src_width - 1];
            for col in src_width..pad_width {
                padded[dst_row + col] = last_val;
            }
        }
    }

    // Pad bottom edge
    if src_height < pad_height {
        let ref_row_start = (src_height - 1) * pad_width;
        let ref_row: Vec<u8> = padded[ref_row_start..ref_row_start + pad_width].to_vec();
        for row in src_height..pad_height {
            let dst_row = row * pad_width;
            padded[dst_row..dst_row + pad_width].copy_from_slice(&ref_row);
        }
    }

    padded
}

/// Pack a 4×4 sub-block from a macroblock's plane.
///
/// For Y: sub-block index 0-15, arranged 4×4 within the 16×16 MB.
/// For U/V: sub-block index 0-3, arranged 2×2 within the 8×8 chroma MB.
pub fn extract_subblock_4x4(plane: &[u8], plane_stride: usize, sub_idx: usize) -> [u8; 16] {
    let sub_row = (sub_idx / 4) * 4;
    let sub_col = (sub_idx % 4) * 4;
    let mut block = [0u8; 16];

    for row in 0..4 {
        let src = (sub_row + row) * plane_stride + sub_col;
        block[row * 4..row * 4 + 4].copy_from_slice(&plane[src..src + 4]);
    }

    block
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn grid_dimensions_exact_multiple() {
        let y = vec![0u8; 32 * 32];
        let u = vec![128u8; 16 * 16];
        let v = vec![128u8; 16 * 16];
        let grid = MacroblockGrid::new(&y, &u, &v, 32, 32);
        assert_eq!(grid.mb_cols, 2);
        assert_eq!(grid.mb_rows, 2);
        assert_eq!(grid.padded_width, 32);
        assert_eq!(grid.padded_height, 32);
    }

    #[test]
    fn grid_dimensions_odd() {
        let y = vec![0u8; 17 * 13];
        let u = vec![128u8; 9 * 7];
        let v = vec![128u8; 9 * 7];
        let grid = MacroblockGrid::new(&y, &u, &v, 17, 13);
        assert_eq!(grid.mb_cols, 2); // ceil(17/16) = 2
        assert_eq!(grid.mb_rows, 1); // ceil(13/16) = 1
        assert_eq!(grid.padded_width, 32);
        assert_eq!(grid.padded_height, 16);
    }

    #[test]
    fn extract_mb_fills_data() {
        let y = vec![42u8; 16 * 16];
        let u = vec![64u8; 8 * 8];
        let v = vec![128u8; 8 * 8];
        let grid = MacroblockGrid::new(&y, &u, &v, 16, 16);
        let mb = grid.get_mb(0, 0);
        assert_eq!(mb.y[0], 42);
        assert_eq!(mb.u[0], 64);
        assert_eq!(mb.v[0], 128);
    }

    #[test]
    fn extract_subblock_correct() {
        let mut plane = [0u8; 256]; // 16x16
        for i in 0..256 {
            plane[i] = i as u8;
        }
        let block = extract_subblock_4x4(&plane, 16, 0); // top-left 4x4
        assert_eq!(block[0], 0); // row 0, col 0
        assert_eq!(block[1], 1); // row 0, col 1
        assert_eq!(block[4], 16); // row 1, col 0
        assert_eq!(block[15], 51); // row 3, col 3 = 3*16+3 = 51
    }

    #[test]
    fn padding_right_edge() {
        let y = vec![1u8, 2, 3, 4, 5, 6]; // 3x2 image
        let u = vec![0u8; 4];
        let v = vec![0u8; 4];
        let grid = MacroblockGrid::new(&y, &u, &v, 3, 2);
        // Padded to 16x16 (ceil(3/16)=1, ceil(2/16)=1)
        assert_eq!(grid.padded_width, 16);
        assert_eq!(grid.padded_height, 16);
        // Last column in each row should be 3 (replicated from edge)
        assert_eq!(grid.padded_y[2], 3); // row 0, col 2 (original last)
        assert_eq!(grid.padded_y[3], 3); // row 0, col 3 (padded with 3)
        assert_eq!(grid.padded_y[15], 3); // row 0, col 15 (padded with 3)
    }
}
