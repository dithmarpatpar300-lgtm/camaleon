export type NoticeSeverity = "error" | "warn" | "info" | "status";

export type NoticePhase = "staged" | "estimating" | "transmuting";

export type Notice = {
  id: string;
  severity: NoticeSeverity;
  messageKey: string;
  params?: Record<string, string | number>;
  priority: number;
  phase?: NoticePhase;
};

export type CostTier = "L0" | "L1" | "L2" | "L3";

export type OperationCost = "cheap" | "moderate" | "expensive";

export type CostFactorKey =
  | "speed"
  | "compression"
  | "quality"
  | "frameIndex"
  | "pageIndex"
  | "entryIndex"
  | "outputScale";

export type ToolNoticeProfile = {
  estimateCost: OperationCost;
  transmuteCost: OperationCost;
  costFactors?: CostFactorKey[];
};

export const NOTICE_PRIORITY = {
  error: 100,
  warnLimit: 80,
  warnFidelity: 70,
  warnPerf: 60,
  info: 40,
  status: 30,
} as const;

export type MergeNoticesOptions = {
  maxVisible?: number;
  phase?: NoticePhase;
};

export function mergeNotices(
  notices: Notice[],
  options: MergeNoticesOptions = {}
): Notice[] {
  const { maxVisible = 2, phase } = options;

  const filtered = notices.filter((n) => {
    if (n.severity === "error") return true;
    if (n.phase === undefined) return true;
    if (phase === undefined) return n.phase === "staged";
    if (phase === "estimating") {
      return n.phase === "staged" || n.phase === "estimating";
    }
    if (phase === "transmuting") {
      return n.phase === "staged" || n.phase === "transmuting";
    }
    return n.phase === phase;
  });

  const byId = new Map<string, Notice>();
  for (const notice of filtered) {
    const existing = byId.get(notice.id);
    if (!existing || notice.priority > existing.priority) {
      byId.set(notice.id, notice);
    }
  }

  return [...byId.values()]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxVisible);
}

export function resolveCostTierLabel(tier: CostTier): "fast" | "slow" {
  return tier === "L0" || tier === "L1" ? "fast" : "slow";
}
