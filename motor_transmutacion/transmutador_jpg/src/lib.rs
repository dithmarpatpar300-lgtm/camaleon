use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn transmutar_jpg_a_png(input_bytes: &[u8]) -> Result<Vec<u8>, String> {
    core_utils::validate_input(input_bytes)?;
    Err("Not yet implemented".into())
}
