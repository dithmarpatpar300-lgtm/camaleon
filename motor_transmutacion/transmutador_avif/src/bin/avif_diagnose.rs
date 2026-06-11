//! CLI: staged AVIF diagnosis for files that open in OS viewers but fail in Camaleon.
//!
//! Usage: `cargo run -p transmutador_avif --bin avif-diagnose -- path/to/file.avif`

use std::env;
use std::fs;
use std::process;

use transmutador_avif::diagnose_avif;

fn main() {
    let path = match env::args().nth(1) {
        Some(p) => p,
        None => {
            eprintln!("Usage: avif-diagnose <file.avif>");
            process::exit(2);
        }
    };

    let bytes = match fs::read(&path) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("Could not read {path}: {e}");
            process::exit(1);
        }
    };

    println!("=== AVIF diagnose: {path} ===");
    let diag = diagnose_avif(&bytes);
    for line in diag.summary_lines() {
        println!("{line}");
    }

    if !diag.decode_ok {
        println!();
        println!("Windows Photos uses the system WIC codec (AV1 Video Extension, often hardware-assisted libavif/dav1d).");
        println!("Camaleon uses zenavif+rav1d in Wasm — a different stack; decode success is not guaranteed for every optimizer output.");
        process::exit(1);
    }
}
