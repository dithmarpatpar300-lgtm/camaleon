"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DisplayFilename } from "@/components/ui/DisplayFilename";
import { formatBytes } from "@/lib/format/bytes";
import type { PreparePhaseId } from "@/lib/transmutation/prepare/types";
import {
  getPrepareProgressStyle,
  setPrepareProgressStyle,
  type PrepareProgressStyle,
} from "@/lib/transmutation/prepare/progress-preference";
import { subscribeNoticesPrefs } from "@/lib/prefs/notices-prefs";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

export type FilePrepareGateProps = {
  fileName: string;
  fileSize: number;
  /** 0-1 float. Use -1 to force indeterminate (spinning) mode. */
  progress: number;
  phase: PreparePhaseId;
  phaseLabelKey?: string;
  /** Whether this phase is blocking on synchronous Wasm (shows indeterminate). */
  indeterminate?: boolean;
  /** Optional secondary line, e.g. frame counter. */
  detailLabel?: string;
};

const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Minimum visual arc so the ring is always perceptible.
 * 4% of circumference ≈ one stroke-width at our ring size.
 */
const MIN_DISPLAY_PROGRESS = 0.035;

export function FilePrepareGate({
  fileName,
  fileSize,
  progress,
  phase,
  phaseLabelKey,
  indeterminate = false,
  detailLabel,
}: FilePrepareGateProps) {
  const { t } = useI18n();
  const [progressStyle, setProgressStyle] = useState<PrepareProgressStyle>("ring");

  useEffect(() => {
    setProgressStyle(getPrepareProgressStyle());
  }, []);

  useEffect(() => subscribeNoticesPrefs(() => setProgressStyle(getPrepareProgressStyle())), []);

  const pct = Math.round(progress * 100);
  const prevProgressRef = useRef(progress);
  const largeJump = Math.abs(progress - prevProgressRef.current) > 0.15;
  useEffect(() => {
    prevProgressRef.current = progress;
  }, [progress]);

  // Min arc only at low values; butt caps keep high % honest (no false 100%)
  const displayProgress = indeterminate
    ? 0
    : progress < 0.1
      ? Math.max(progress, MIN_DISPLAY_PROGRESS)
      : progress;
  const dashOffset = RING_C * (1 - displayProgress);
  // For the indeterminate arc, draw a fixed 25% arc that spins
  const indeterminateDash = RING_C * 0.25;

  const phaseLabel = useMemo(
    () => t(phaseLabelKey ?? `prepare.phases.${phase}`),
    [phase, phaseLabelKey, t]
  );

  const toggleStyle = () => {
    const next: PrepareProgressStyle = progressStyle === "ring" ? "bar" : "ring";
    setPrepareProgressStyle(next);
    setProgressStyle(next);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-valuenow={indeterminate ? undefined : pct}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
      aria-label={t("prepare.ariaLabel", { phase: phaseLabel, percent: pct })}
      className="flex min-h-[22rem] flex-col items-center justify-center px-6 py-10"
    >
      {/* File info */}
      <div className="mb-8 w-full max-w-sm text-center">
        <DisplayFilename
          name={fileName}
          className="text-sm font-medium text-text-primary"
        />
        <p className="mt-1 text-xs text-text-muted">{formatBytes(fileSize)}</p>
      </div>

      {/* Progress indicator */}
      {progressStyle === "ring" ? (
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
          <svg
            className={cn(
              "absolute inset-0 h-full w-full",
              !indeterminate && "-rotate-90",
              indeterminate && "ring-indeterminate"
            )}
            viewBox="0 0 96 96"
            aria-hidden="true"
          >
            {/* Track */}
            <circle
              cx="48" cy="48" r={RING_R}
              fill="none" stroke="currentColor" strokeWidth="5"
              className="text-border"
            />
            {/* Progress arc */}
            <circle
              cx="48" cy="48" r={RING_R}
              fill="none" stroke="currentColor"
              strokeWidth="5"
              strokeLinecap={indeterminate ? "round" : "butt"}
              className="text-accent"
              strokeDasharray={indeterminate ? `${indeterminateDash} ${RING_C}` : RING_C}
              strokeDashoffset={indeterminate ? 0 : dashOffset}
              style={
                indeterminate || largeJump
                  ? undefined
                  : { transition: "stroke-dashoffset 200ms cubic-bezier(0.4, 0, 0.2, 1)" }
              }
            />
          </svg>
          <span
            className={cn(
              "font-mono text-lg font-medium tabular-nums",
              indeterminate ? "text-text-muted" : "text-text-primary"
            )}
          >
            {indeterminate ? "…" : `${pct}%`}
          </span>
        </div>
      ) : (
        /* Bar mode */
        <div className="mb-6 w-full max-w-xs">
          <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
            <span>{t("prepare.progressLabel")}</span>
            <span className="font-mono tabular-nums text-text-secondary">
              {indeterminate ? "…" : `${pct}%`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
            {indeterminate ? (
              <div className="h-full w-full overflow-hidden rounded-full">
                <div
                  className="h-full w-1/3 rounded-full bg-accent"
                  style={{ animation: "barIndeterminate 1.4s ease-in-out infinite" }}
                />
              </div>
            ) : (
              <div
                className="h-full rounded-full bg-accent"
                style={{
                  width: `${Math.max(pct, Math.round(MIN_DISPLAY_PROGRESS * 100))}%`,
                  transition: "width 320ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Phase label */}
      <p className="mb-1 text-sm font-medium text-text-secondary">{phaseLabel}</p>
      {detailLabel && (
        <p className="mb-4 text-xs text-text-muted">{detailLabel}</p>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={toggleStyle}
        className="mt-5 text-xs text-text-muted underline-offset-2 hover:text-text-secondary hover:underline"
      >
        {progressStyle === "ring"
          ? t("prepare.switchToBar")
          : t("prepare.switchToRing")}
      </button>
    </div>
  );
}
