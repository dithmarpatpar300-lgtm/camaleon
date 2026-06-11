"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FrameRgbaFetcher } from "@/lib/imaging/use-coalesced-frame-paint";
import { useCoalescedFramePaint } from "@/lib/imaging/use-coalesced-frame-paint";
import { useDelayedVisible } from "@/lib/imaging/use-delayed-visible";
import { Spinner } from "@/components/ui/Spinner";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

export type RgbaFrameSource = {
  frameCount: number;
  width: number;
  height: number;
  getFrameRgba: FrameRgbaFetcher;
  /** When set, preview area shows warm-up progress instead of scrubbing. */
  warming?: { current: number; total: number } | null;
  ready?: boolean;
};

export type RgbaFrameSession = {
  frame_count: number;
  width: number;
  height: number;
  frame_rgba: (frameIndex: number) => Uint8Array;
};

type RgbaFrameScrubberProps = {
  source: RgbaFrameSource;
  frameIndex: number;
  onFrameIndexChange: (index: number) => void;
  hintKey?: string;
};

export function RgbaFrameScrubber({
  source,
  frameIndex,
  onFrameIndexChange,
  hintKey = "panel.gifFrame.hint",
}: RgbaFrameScrubberProps) {
  const { t } = useI18n();
  const scrubbingRef = useRef(false);
  const [localIndex, setLocalIndex] = useState(frameIndex);
  const { canvasRef, schedulePaint } = useCoalescedFramePaint(
    source.getFrameRgba,
    source.width,
    source.height,
    { cacheSize: 16 }
  );

  const frameCount = source.frameCount;
  const maxIndex = Math.max(0, frameCount - 1);
  const safeIndex = Math.min(localIndex, maxIndex);
  const isReady = source.ready !== false;
  const warming = source.warming ?? null;

  /** Overlay only during session warm-up — never while scrubbing decoded frames. */
  const warmingActive = !isReady || warming != null;
  const showWarmupOverlay = useDelayedVisible(warmingActive, 120);

  useEffect(() => {
    setLocalIndex(frameIndex);
  }, [frameIndex]);

  useEffect(() => {
    if (!isReady) return;
    const idx = Math.min(frameIndex, maxIndex);
    schedulePaint(idx);
  }, [frameIndex, isReady, maxIndex, schedulePaint]);

  const handleIndexChange = useCallback(
    (index: number) => {
      if (!isReady) return;
      setLocalIndex(index);
      schedulePaint(index);
      if (!scrubbingRef.current) {
        onFrameIndexChange(index);
      }
    },
    [isReady, onFrameIndexChange, schedulePaint]
  );

  const commitIndex = useCallback(() => {
    scrubbingRef.current = false;
    if (isReady) {
      onFrameIndexChange(localIndex);
    }
  }, [isReady, localIndex, onFrameIndexChange]);

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-border bg-bg-elevated/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-secondary">
          {t("panel.gifFrame.title")}
        </p>
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {warming
            ? t("panel.avifFrame.warmingFrames", {
                current: warming.current,
                total: warming.total,
              })
            : t("panel.gifFrame.counter", {
                current: safeIndex + 1,
                total: frameCount,
              })}
        </span>
      </div>

      <div className="flex justify-center">
        <div
          className="relative overflow-hidden rounded-lg border border-border bg-bg-base"
          style={{
            aspectRatio: `${source.width} / ${source.height}`,
            height: "10rem",
            width: "auto",
            maxWidth: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            width={source.width}
            height={source.height}
            role="img"
            aria-label={t("panel.gifFrame.previewAlt", { index: safeIndex + 1 })}
            className="block h-full w-full object-contain"
          />
          {showWarmupOverlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg-base/60 px-3 text-center">
              <Spinner label={t("panel.gifFrame.loadingPreview")} />
              <p className="text-xs text-text-muted">
                {warming
                  ? t("panel.avifFrame.warmingFrames", {
                      current: warming.current,
                      total: warming.total,
                    })
                  : t("panel.gifFrame.loadingPreview")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <input
          type="range"
          min={0}
          max={maxIndex}
          step={1}
          value={safeIndex}
          disabled={!isReady}
          onPointerDown={() => {
            scrubbingRef.current = true;
          }}
          onPointerUp={commitIndex}
          onPointerCancel={commitIndex}
          onChange={(e) => handleIndexChange(Number(e.target.value))}
          aria-label={t("panel.gifFrame.sliderAria")}
          className={cn(
            "w-full accent-accent",
            "h-2 appearance-none rounded-full bg-bg-surface",
            isReady ? "cursor-pointer" : "cursor-not-allowed opacity-60"
          )}
        />
        <p className="mt-1.5 text-xs text-text-muted">{t(hintKey)}</p>
      </div>
    </div>
  );
}
