/** Must stay aligned with `core_utils::MAX_INPUT_BYTES` in the Rust workspace. */
export const ENGINE_MAX_INPUT_BYTES = 50 * 1024 * 1024;

export const ENGINE_MAX_INPUT_LABEL = "50 MB";

export function exceedsEngineLimit(fileSize: number): boolean {
  return fileSize > ENGINE_MAX_INPUT_BYTES;
}
