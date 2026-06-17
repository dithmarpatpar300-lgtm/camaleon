use resvg::tiny_skia::{Pixmap, Transform};
use usvg::{ImageHrefResolver, Options, Tree};

use crate::fonts::configure_fontdb;
use crate::svg_validate::detect_external_hrefs;

pub fn secure_usvg_options() -> Options<'static> {
    let mut opt = Options::default();
    opt.resources_dir = None;
    configure_fontdb(&mut opt);
    opt.image_href_resolver = ImageHrefResolver {
        resolve_data: ImageHrefResolver::default_data_resolver(),
        // Block all non-data string hrefs (local paths, http URLs).
        resolve_string: Box::new(|_href, _opts| None),
    };
    opt
}

pub fn parse_svg_tree(input: &[u8]) -> Result<Tree, String> {
    if detect_external_hrefs(input) {
        return Err(
            "SVG contains external references (http(s) or file URLs are not supported)".into(),
        );
    }
    let opt = secure_usvg_options();
    Tree::from_data(input, &opt).map_err(|e| format!("Failed to parse SVG: {}", e))
}

pub fn render_svg_to_rgba(input: &[u8], out_w: u32, out_h: u32) -> Result<Vec<u8>, String> {
    let tree = parse_svg_tree(input)?;
    let size = tree.size();
    if size.width() <= 0.0 || size.height() <= 0.0 {
        return Err("SVG has invalid intrinsic size".into());
    }

    let scale_x = out_w as f32 / size.width();
    let scale_y = out_h as f32 / size.height();
    let transform = Transform::from_scale(scale_x, scale_y);

    let mut pixmap = Pixmap::new(out_w, out_h)
        .ok_or_else(|| format!("Failed to allocate {}x{} render buffer", out_w, out_h))?;

    resvg::render(&tree, transform, &mut pixmap.as_mut());

    Ok(pixmap
        .data()
        .chunks_exact(4)
        .flat_map(|px| [px[0], px[1], px[2], px[3]])
        .collect())
}
