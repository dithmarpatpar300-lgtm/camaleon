/** Must stay aligned with `core_utils::MAX_INPUT_BYTES` in the Rust workspace. */
export const SOFT_LIMIT_BYTES = 50 * 1024 * 1024;

export const HARD_LIMIT_DESKTOP_BYTES = 150 * 1024 * 1024;
export const HARD_LIMIT_MOBILE_BYTES = 100 * 1024 * 1024;

/** @deprecated Use SOFT_LIMIT_BYTES — kept for existing imports. */
export const ENGINE_MAX_INPUT_BYTES = SOFT_LIMIT_BYTES;

export const ENGINE_MAX_INPUT_LABEL = "50 MB";

export type LimitZone = "normal" | "elevated" | "hard";

export function getHardLimitBytes(deviceMemoryGb?: number): number {
  if (deviceMemoryGb !== undefined && deviceMemoryGb <= 4) {
    return HARD_LIMIT_MOBILE_BYTES;
  }
  return HARD_LIMIT_DESKTOP_BYTES;
}

export function getLimitZone(fileSize: number, hardLimit = HARD_LIMIT_DESKTOP_BYTES): LimitZone {
  if (fileSize > hardLimit) return "hard";
  if (fileSize > SOFT_LIMIT_BYTES) return "elevated";
  return "normal";
}

export function exceedsEngineLimit(fileSize: number): boolean {
  return fileSize > SOFT_LIMIT_BYTES;
}

export function needsOversizeConsent(zone: LimitZone, consented: boolean): boolean {
  return zone === "elevated" && !consented;
}

export function canProcessInZone(zone: LimitZone, consented: boolean): boolean {
  if (zone === "hard") return false;
  if (zone === "elevated") return consented;
  return true;
}

/** Wasm session ceiling for prepare probes and post-consent transmute/estimate. */
export function effectiveSessionInputLimit(
  zone: LimitZone,
  hardLimit: number
): number {
  if (zone === "normal") return SOFT_LIMIT_BYTES;
  return hardLimit;
}

/** Alias kept for clarity at the call site in TransmutationPanel. */
export const prepareSessionInputLimit = effectiveSessionInputLimit;

/** Wasm session ceiling for a given byte length (prepare, alpha assess, worker meta). */
export function sessionLimitForBytes(
  fileSize: number,
  deviceMemoryGb?: number
): number {
  const hardLimit = getHardLimitBytes(deviceMemoryGb);
  return effectiveSessionInputLimit(getLimitZone(fileSize, hardLimit), hardLimit);
}

export function formatHardLimitLabel(hardLimit: number): string {
  return hardLimit === HARD_LIMIT_MOBILE_BYTES ? "100 MB" : "150 MB";
}
