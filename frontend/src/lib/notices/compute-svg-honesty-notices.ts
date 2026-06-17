import type { SvgMeta } from "@/lib/svg/svg-wasm-client";
import type { Notice } from "./types";
import { NOTICE_PRIORITY } from "./types";

export function computeSvgHonestyNotices(args: {
  toolId: string;
  svgMeta: SvgMeta | null | undefined;
}): Notice[] {
  if (args.toolId !== "svg-to-png" || !args.svgMeta) return [];

  const notices: Notice[] = [
    {
      id: "svg-vector-raster",
      severity: "info",
      messageKey: "notices.fidelity.svgVectorToRaster",
      priority: NOTICE_PRIORITY.info,
      phase: "staged",
    },
  ];

  if (args.svgMeta.hasText) {
    notices.push({
      id: "svg-font-hint",
      severity: "info",
      messageKey: "notices.fidelity.svgFontSubstitution",
      priority: NOTICE_PRIORITY.info,
      phase: "staged",
    });
  }

  if (args.svgMeta.hasFilters) {
    notices.push({
      id: "svg-renderer-subset",
      severity: "info",
      messageKey: "notices.fidelity.svgRendererSubset",
      priority: NOTICE_PRIORITY.info,
      phase: "staged",
    });
  }

  return notices;
}
