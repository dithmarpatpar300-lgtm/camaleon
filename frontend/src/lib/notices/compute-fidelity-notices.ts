import type { SizeDelta } from "@/lib/format/metrics";
import type { Notice } from "./types";
import { NOTICE_PRIORITY } from "./types";

export type FidelityNoticeContext = {
  toolId: string;
  estimateDelta: SizeDelta | null;
};

export function computeFidelityNotices(ctx: FidelityNoticeContext): Notice[] {
  if (ctx.toolId !== "bmp-to-png") return [];
  if (ctx.estimateDelta == null || ctx.estimateDelta.deltaPct <= 0) return [];

  return [
    {
      id: "fidelity-bmp-growth",
      severity: "warn",
      messageKey: "notices.fidelity.bmpPngGrowth",
      priority: NOTICE_PRIORITY.warnFidelity,
    },
  ];
}
