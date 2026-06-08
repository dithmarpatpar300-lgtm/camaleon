mod spike_fixtures;

use spike_fixtures::all_fixtures;

use transmutador_tiff::{assess_tiff_page_alpha, transmutar_tiff_a_jpg_inner};

#[test]
fn assess_opaque_rgba_tiff_matches_encode() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_opaque")
        .expect("fixture");
    let a = assess_tiff_page_alpha(&fixture.bytes, 0).expect("assess");
    assert!(!a.has_meaningful_alpha);

    let white = transmutar_tiff_a_jpg_inner(&fixture.bytes, 85, 255, 255, 255, 0).expect("jpg");
    let black = transmutar_tiff_a_jpg_inner(&fixture.bytes, 85, 0, 0, 0, 0).expect("jpg");
    assert_eq!(white, black);
}

#[test]
fn assess_real_alpha_tiff_flattens() {
    let fixture = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha")
        .expect("fixture");
    let a = assess_tiff_page_alpha(&fixture.bytes, 0).expect("assess");
    assert!(a.has_meaningful_alpha);

    let white = transmutar_tiff_a_jpg_inner(&fixture.bytes, 85, 255, 255, 255, 0).expect("jpg");
    let black = transmutar_tiff_a_jpg_inner(&fixture.bytes, 85, 0, 0, 0, 0).expect("jpg");
    assert_ne!(white, black);
}
