import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import type { TransmutationOptions } from "@/workers/types";
import { resolveSvgOutputDimensions } from "./svg-output-dimensions";
import { formatSvgBitDepthLabel, type SvgMeta } from "./svg-wasm-client";

export function svgSourceMetaForScale(
  svgMeta: SvgMeta,
  outputScale: number
): SourceImageMeta {
  const dims = resolveSvgOutputDimensions(
    svgMeta.intrinsicWidth,
    svgMeta.intrinsicHeight,
    outputScale
  );
  return {
    width: dims.width,
    height: dims.height,
    bitDepthLabel: formatSvgBitDepthLabel(svgMeta),
  };
}

export function svgOptionsWithDimensions(
  options: TransmutationOptions,
  svgMeta: SvgMeta
): TransmutationOptions {
  const outputScale = options.outputScale ?? 100;
  const dims = resolveSvgOutputDimensions(
    svgMeta.intrinsicWidth,
    svgMeta.intrinsicHeight,
    outputScale
  );
  return {
    ...options,
    outputScale,
    outputWidth: dims.width,
    outputHeight: dims.height,
  };
}

export function isSvgTool(toolId: string): boolean {
  return toolId === "svg-to-png" || toolId === "svg-to-jpg";
}
