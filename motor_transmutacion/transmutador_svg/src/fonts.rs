//! Font loading for SVG text.
//!
//! Native builds may enable `native-system-fonts` for host system fonts.
//! Wasm builds rely on fonts embedded in SVG (`data:font/*`) until a committed
//! OSS subset is added to `assets/` (see spike results doc).

use usvg::Options;

#[allow(unused_variables)]
pub fn configure_fontdb(opt: &mut Options<'_>) {
    #[cfg(all(feature = "native-system-fonts", not(target_arch = "wasm32")))]
    {
        opt.fontdb_mut().load_system_fonts();
    }
}
