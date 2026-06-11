mod spike_fixtures;

use spike_fixtures::all_fixtures;
use transmutador_avif::{assess_avif_alpha, transmutar_avif_a_jpg_with_options};

fn fixture_bytes(name: &str) -> Vec<u8> {
    all_fixtures()
        .into_iter()
        .find(|f| f.name == name)
        .unwrap_or_else(|| panic!("missing fixture {name}"))
        .bytes
}

#[test]
fn assess_opaque_avif_not_meaningful() {
    let avif = fixture_bytes("opaque_rgba");
    let a = assess_avif_alpha(&avif).expect("assess");
    assert!(!a.has_meaningful_alpha);
}

#[test]
fn encode_opaque_avif_background_invariant() {
    let avif = fixture_bytes("opaque_rgba");
    assert!(!assess_avif_alpha(&avif).unwrap().has_meaningful_alpha);
    let white = transmutar_avif_a_jpg_with_options(&avif, 85, 255, 255, 255, 0).expect("jpg");
    let black = transmutar_avif_a_jpg_with_options(&avif, 85, 0, 0, 0, 0).expect("jpg");
    assert_eq!(white, black);
}

#[test]
fn encode_meaningful_avif_depends_on_background() {
    let avif = fixture_bytes("rgba_alpha_aux");
    assert!(assess_avif_alpha(&avif).unwrap().has_meaningful_alpha);
    let white = transmutar_avif_a_jpg_with_options(&avif, 85, 255, 255, 255, 0).expect("jpg");
    let black = transmutar_avif_a_jpg_with_options(&avif, 85, 0, 0, 0, 0).expect("jpg");
    assert_ne!(white, black);
}
