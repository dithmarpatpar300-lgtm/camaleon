//! Run: `cargo test -p transmutador_tiff write_semantic_alpha_tiff_fixtures -- --ignored --nocapture`

mod spike_fixtures;

use std::fs;
use std::path::PathBuf;

use spike_fixtures::all_fixtures;

fn fixture_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("docs")
        .join("fixtures")
        .join("semantic-alpha")
}

#[test]
#[ignore = "run manually to refresh tiff fixtures"]
fn write_semantic_alpha_tiff_fixtures() {
    fs::create_dir_all(fixture_dir()).expect("mkdir");
    let opaque = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_opaque")
        .expect("rgba_opaque");
    let real = all_fixtures()
        .into_iter()
        .find(|f| f.name == "rgba_alpha")
        .expect("rgba_alpha");
    fs::write(fixture_dir().join("opaque-rgba.tiff"), opaque.bytes).expect("write");
    fs::write(fixture_dir().join("real-alpha.tiff"), real.bytes).expect("write");
    println!("wrote opaque-rgba.tiff and real-alpha.tiff");
}
