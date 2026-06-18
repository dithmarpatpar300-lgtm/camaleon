import type { SvgMeta } from "@/lib/svg/svg-wasm-client";
import type { Notice } from "./types";
import { NOTICE_PRIORITY } from "./types";

export function computeSvgHonestyNotices(args: {
  toolId: string;
  svgMeta: SvgMeta | null | undefined;
}): Notice[] {
  const isSvgRaster =
    args.toolId === "svg-to-png" || args.toolId === "svg-to-jpg";
  if (!isSvgRaster || !args.svgMeta) return [];

  const notices: Notice[] = [
    {
      id: "svg-vector-raster",
      severity: "info",
      messageKey: "notices.fidelity.svgVectorToRaster",
      priority: NOTICE_PRIORITY.info,
      phase: "staged",
    },
  ];

  if (args.toolId === "svg-to-jpg") {
    notices.push({
      id: "svg-jpg-lossy",
      severity: "info",
      messageKey: "notices.fidelity.svgJpegLossy",
      priority: NOTICE_PRIORITY.info,
      phase: "staged",
    });
  }

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
