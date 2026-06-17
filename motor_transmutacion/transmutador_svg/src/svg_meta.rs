use usvg::{Node, Tree};
use wasm_bindgen::prelude::*;

use crate::rasterize::parse_svg_tree;

#[derive(Debug, Clone, PartialEq)]
pub struct SvgMeta {
    pub intrinsic_width: f32,
    pub intrinsic_height: f32,
    pub has_view_box: bool,
    pub has_text: bool,
    pub has_filters: bool,
    pub has_external_refs: bool,
    pub embedded_raster_count: u32,
}

#[wasm_bindgen]
pub struct SvgMetaJs {
    intrinsic_width: f32,
    intrinsic_height: f32,
    has_view_box: bool,
    has_text: bool,
    has_filters: bool,
    has_external_refs: bool,
    embedded_raster_count: u32,
}

impl From<SvgMeta> for SvgMetaJs {
    fn from(m: SvgMeta) -> Self {
        Self {
            intrinsic_width: m.intrinsic_width,
            intrinsic_height: m.intrinsic_height,
            has_view_box: m.has_view_box,
            has_text: m.has_text,
            has_filters: m.has_filters,
            has_external_refs: m.has_external_refs,
            embedded_raster_count: m.embedded_raster_count,
        }
    }
}

#[wasm_bindgen]
impl SvgMetaJs {
    #[wasm_bindgen(getter)]
    pub fn intrinsic_width(&self) -> f32 {
        self.intrinsic_width
    }

    #[wasm_bindgen(getter)]
    pub fn intrinsic_height(&self) -> f32 {
        self.intrinsic_height
    }

    #[wasm_bindgen(getter)]
    pub fn has_view_box(&self) -> bool {
        self.has_view_box
    }

    #[wasm_bindgen(getter)]
    pub fn has_text(&self) -> bool {
        self.has_text
    }

    #[wasm_bindgen(getter)]
    pub fn has_filters(&self) -> bool {
        self.has_filters
    }

    #[wasm_bindgen(getter)]
    pub fn has_external_refs(&self) -> bool {
        self.has_external_refs
    }

    #[wasm_bindgen(getter)]
    pub fn embedded_raster_count(&self) -> u32 {
        self.embedded_raster_count
    }
}

pub fn inspect_svg_meta_inner(input: &[u8]) -> Result<SvgMeta, String> {
    validate_svg_meta_input(input)?;
    let has_external_refs = crate::svg_validate::detect_external_hrefs(input);
    let has_view_box = input_has_view_box(input);
    let tree = parse_svg_tree(input)?;
    Ok(meta_from_tree(&tree, has_external_refs, has_view_box))
}

fn validate_svg_meta_input(input: &[u8]) -> Result<(), String> {
    crate::svg_validate::validate_svg_input(input)
}

fn input_has_view_box(bytes: &[u8]) -> bool {
    let Ok(text) = std::str::from_utf8(bytes) else {
        return false;
    };
    let lower = text.to_ascii_lowercase();
    lower.contains("viewbox=")
}

fn meta_from_tree(tree: &Tree, has_external_refs: bool, has_view_box: bool) -> SvgMeta {
    let size = tree.size();
    let mut embedded_raster_count = 0u32;
    let mut has_text = false;
    walk_group(tree.root(), &mut |node| {
        match node {
            Node::Image(_) => embedded_raster_count += 1,
            Node::Text(_) => has_text = true,
            _ => {}
        }
    });

    SvgMeta {
        intrinsic_width: size.width(),
        intrinsic_height: size.height(),
        has_view_box,
        has_text,
        has_filters: !tree.filters().is_empty(),
        has_external_refs,
        embedded_raster_count,
    }
}

fn walk_group<F: FnMut(&Node)>(group: &usvg::Group, f: &mut F) {
    for node in group.children() {
        f(node);
        if let Node::Group(g) = node {
            walk_group(g, f);
        }
        node.subroots(|sub| walk_group(sub, f));
    }
}

/// Used by tests to ensure path geometry exists without full render.
#[allow(dead_code)]
pub fn tree_has_paths(tree: &Tree) -> bool {
    let mut found = false;
    walk_group(tree.root(), &mut |node| {
        if let Node::Path(_) = node {
            found = true;
        }
    });
    found
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn meta_simple_icon() {
        let svg = br#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M4 4h24v24H4z"/></svg>"#;
        let meta = inspect_svg_meta_inner(svg).expect("meta");
        assert!(meta.intrinsic_width > 0.0);
        assert!(meta.intrinsic_height > 0.0);
        assert!(meta.has_view_box);
        assert!(!meta.has_text);
    }
}
