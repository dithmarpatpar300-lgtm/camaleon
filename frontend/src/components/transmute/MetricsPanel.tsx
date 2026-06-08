"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { formatBytes } from "@/lib/format/bytes";
import { Button } from "@/components/ui/Button";
import type { SizeDelta } from "@/lib/format/metrics";
import type { LimitBlockReason } from "@/lib/transmutation/limit-context";
import { cn } from "@/lib/utils";

type MetricsPanelProps = {
  originalSize: number;
  estimateDelta: SizeDelta | null;
  estimating: boolean;
  estimateError: string | null;
  blockReason: LimitBlockReason;
  canEstimate: boolean;
  cacheWarm: boolean;
  autoEstimate: boolean;
  ready: boolean;
  onRequestEstimate: () => void;
};

export function MetricsPanel({
  originalSize,
  estimateDelta,
  estimating,
  estimateError,
  blockReason,
  canEstimate,
  cacheWarm,
  autoEstimate,
  ready,
  onRequestEstimate,
}: MetricsPanelProps) {
  const { t } = useI18n();
  const showCacheHint = cacheWarm && !estimating;

  return (
    <div className="mb-3 rounded-lg bg-bg-elevated px-4 py-2 text-xs">
      <div className="flex items-center justify-between py-1">
        <span className="text-text-muted">{t("panel.metrics.original")}</span>
        <span className="font-mono tabular-nums text-text-secondary">
          {formatBytes(originalSize)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 py-1">
        <span className="text-text-muted">{t("panel.metrics.estimated")}</span>
        <span className="font-mono tabular-nums text-text-secondary">
          <EstimatedMetricsValue
            delta={estimateDelta}
            estimating={estimating}
            canEstimate={canEstimate}
            autoEstimate={autoEstimate}
            ready={ready}
            onRequestEstimate={onRequestEstimate}
          />
        </span>
      </div>
      {blockReason === "consent" && !estimateDelta && (
        <p className="py-1 text-warning">{t("panel.metrics.consentRequired")}</p>
      )}
      {blockReason === "pixels" && !estimateDelta && (
        <p className="py-1 text-warning">{t("panel.metrics.pixelsBlocked")}</p>
      )}
      {!canEstimate &&
        blockReason !== "consent" &&
        blockReason !== "pixels" &&
        !estimateDelta && (
          <p className="py-1 text-warning">{t("panel.metrics.estimateUnavailable")}</p>
        )}
      {canEstimate && !autoEstimate && !estimateDelta && !estimating && !estimateError && (
        <p className="py-1 text-text-muted">{t("panel.metrics.largeFileHint")}</p>
      )}
      {estimateError && (
        <p className="py-1 text-error" role="alert">{estimateError}</p>
      )}
      <p
        className={cn(
          "py-1 text-center text-text-muted transition-opacity duration-300",
          showCacheHint ? "opacity-100" : "pointer-events-none select-none opacity-0"
        )}
        aria-live="polite"
        aria-hidden={!showCacheHint}
      >
        {t("panel.metrics.cacheReady")}
      </p>
    </div>
  );
}

type EstimatedMetricsValueProps = {
  delta: SizeDelta | null;
  estimating: boolean;
  canEstimate: boolean;
  autoEstimate: boolean;
  ready: boolean;
  onRequestEstimate: () => void;
};

function estimateValueKey(delta: SizeDelta): string {
  return `${delta.finalSize}:${delta.deltaPct}`;
}

function EstimatedMetricsValue({
  delta,
  estimating,
  canEstimate,
  autoEstimate,
  ready,
  onRequestEstimate,
}: EstimatedMetricsValueProps) {
  const { t } = useI18n();
  const [animateIn, setAnimateIn] = useState(false);
  const prevValueKeyRef = useRef<string | null>(null);

  const valueKey = delta ? estimateValueKey(delta) : null;

  useEffect(() => {
    if (!valueKey) {
      prevValueKeyRef.current = null;
      return;
    }
    if (prevValueKeyRef.current !== null && prevValueKeyRef.current !== valueKey) {
      setAnimateIn(true);
    }
    prevValueKeyRef.current = valueKey;
  }, [valueKey]);

  if (!delta) {
    if (estimating) {
      return <span className="text-text-muted">{t("panel.metrics.calculating")}</span>;
    }
    if (!canEstimate) {
      return <span className="text-text-muted">—</span>;
    }
    if (!autoEstimate) {
      return (
        <Button
          type="button"
          variant="subtle"
          size="sm"
          onClick={onRequestEstimate}
          disabled={!ready}
        >
          {t("panel.metrics.calculate")}
        </Button>
      );
    }
    return <span>—</span>;
  }

  const isGrowth = delta.deltaPct > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 transition-opacity duration-200",
        estimating && "opacity-60",
        animateIn && "motion-safe:metrics-value-in"
      )}
      onAnimationEnd={() => setAnimateIn(false)}
    >
      <span>{formatBytes(delta.finalSize)}</span>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium tabular-nums leading-none",
          isGrowth ? "bg-error/15 text-error" : "bg-accent/15 text-accent"
        )}
      >
        {delta.deltaLabel}
      </span>
    </span>
  );
}
