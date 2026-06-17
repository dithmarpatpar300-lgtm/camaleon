/** Percent presets (100, 200) vs max-edge pixel presets (512, 1024, 2048). */
const OUTPUT_SCALE_PERCENT_MAX = 400;

export type SvgOutputDimensions = {
  width: number;
  height: number;
};

/**
 * Maps output scale preset → raster dimensions (aspect locked).
 * Values ≤ 400 are treated as percent of intrinsic size; larger values scale the longest edge to that many pixels.
 */
export function resolveSvgOutputDimensions(
  intrinsicWidth: number,
  intrinsicHeight: number,
  outputScale: number
): SvgOutputDimensions {
  const iw = Math.max(1, Math.round(intrinsicWidth));
  const ih = Math.max(1, Math.round(intrinsicHeight));

  if (outputScale <= OUTPUT_SCALE_PERCENT_MAX) {
    const factor = outputScale / 100;
    return {
      width: Math.max(1, Math.round(iw * factor)),
      height: Math.max(1, Math.round(ih * factor)),
    };
  }

  const maxEdge = Math.max(iw, ih);
  const scale = outputScale / maxEdge;
  return {
    width: Math.max(1, Math.round(iw * scale)),
    height: Math.max(1, Math.round(ih * scale)),
  };
}

export function formatSvgOutputScaleLabel(
  outputScale: number,
  t: (key: string) => string
): string {
  if (outputScale <= OUTPUT_SCALE_PERCENT_MAX) {
    return `${outputScale}%`;
  }
  return `${outputScale}px`;
}
