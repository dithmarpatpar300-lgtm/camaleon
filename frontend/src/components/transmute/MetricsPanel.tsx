"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { formatBytes } from "@/lib/format/bytes";
import { Button } from "@/components/ui/Button";
import type { SizeDelta } from "@/lib/format/metrics";

type MetricsPanelProps = {
  originalSize: number;
  estimateDelta: SizeDelta | null;
  estimating: boolean;
  cacheWarm: boolean;
  autoEstimate: boolean;
  ready: boolean;
  onRequestEstimate: () => void;
};

export function MetricsPanel({
  originalSize,
  estimateDelta,
  estimating,
  cacheWarm,
  autoEstimate,
  ready,
  onRequestEstimate,
}: MetricsPanelProps) {
  const { t } = useI18n();

  return (
    <div className="mb-3 space-y-1 rounded-lg bg-bg-elevated px-4 py-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-text-muted">{t("panel.metrics.original")}</span>
        <span className="font-mono tabular-nums text-text-secondary">
          {formatBytes(originalSize)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-text-muted">{t("panel.metrics.estimated")}</span>
        <span className="font-mono tabular-nums text-text-secondary">
          <EstimatedMetricsValue
            delta={estimateDelta}
            estimating={estimating}
            cacheWarm={cacheWarm}
            autoEstimate={autoEstimate}
            ready={ready}
            onRequestEstimate={onRequestEstimate}
          />
        </span>
      </div>
      {!autoEstimate && !estimateDelta && !estimating && (
        <p className="text-text-muted">{t("panel.metrics.largeFileHint")}</p>
      )}
      {cacheWarm && (
        <p className="text-center text-text-muted">{t("panel.metrics.cacheReady")}</p>
      )}
    </div>
  );
}

type EstimatedMetricsValueProps = {
  delta: SizeDelta | null;
  estimating: boolean;
  cacheWarm: boolean;
  autoEstimate: boolean;
  ready: boolean;
  onRequestEstimate: () => void;
};

function EstimatedMetricsValue({
  delta,
  estimating,
  cacheWarm,
  autoEstimate,
  ready,
  onRequestEstimate,
}: EstimatedMetricsValueProps) {
  const { t } = useI18n();

  if (!delta) {
    if (estimating) {
      return (
        <span className="motion-safe:animate-pulse">
          {t("panel.metrics.calculating")}
        </span>
      );
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

  const prefix = cacheWarm ? "" : "~";
  const formatted = `${prefix}${formatBytes(delta.finalSize)} (${delta.deltaLabel})`;

  if (estimating) {
    return (
      <span className="opacity-60 motion-safe:animate-pulse">{formatted}</span>
    );
  }

  return <AnimatedValue formatted={formatted} />;
}

function AnimatedValue({ formatted }: { formatted: string }) {
  const [animate, setAnimate] = useState(false);
  const prevRef = useRef(formatted);

  useEffect(() => {
    if (prevRef.current !== formatted) {
      setAnimate(true);
      prevRef.current = formatted;
    }
  }, [formatted]);

  return (
    <span
      className={animate ? "motion-safe:metrics-value-in" : undefined}
      onAnimationEnd={() => setAnimate(false)}
    >
      {formatted}
    </span>
  );
}
