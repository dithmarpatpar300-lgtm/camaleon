"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawRgbaToCanvas, type GifSessionHandle } from "@/lib/gif/gif-wasm-client";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type GifFrameScrubberProps = {
  session: GifSessionHandle;
  frameIndex: number;
  onFrameIndexChange: (index: number) => void;
};

export function GifFrameScrubber({
  session,
  frameIndex,
  onFrameIndexChange,
}: GifFrameScrubberProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrubbingRef = useRef(false);
  const [localIndex, setLocalIndex] = useState(frameIndex);

  const frameCount = session.frame_count;
  const maxIndex = Math.max(0, frameCount - 1);

  const paintFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const rgba = session.frame_rgba(index);
        drawRgbaToCanvas(canvas, rgba, session.width, session.height);
      } catch {
        // ignore stale index during teardown
      }
    },
    [session]
  );

  useEffect(() => {
    setLocalIndex(frameIndex);
  }, [frameIndex]);

  useEffect(() => {
    const idx = Math.min(frameIndex, maxIndex);
    requestAnimationFrame(() => paintFrame(idx));
  }, [frameIndex, maxIndex, paintFrame]);

  const handleIndexChange = useCallback(
    (index: number) => {
      setLocalIndex(index);
      paintFrame(index);
      if (!scrubbingRef.current) {
        onFrameIndexChange(index);
      }
    },
    [onFrameIndexChange, paintFrame]
  );

  const commitIndex = useCallback(() => {
    scrubbingRef.current = false;
    onFrameIndexChange(localIndex);
  }, [localIndex, onFrameIndexChange]);

  const safeIndex = Math.min(localIndex, maxIndex);

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-border bg-bg-elevated/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-secondary">
          {t("panel.gifFrame.title")}
        </p>
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {t("panel.gifFrame.counter", {
            current: safeIndex + 1,
            total: frameCount,
          })}
        </span>
      </div>

      <div className="flex justify-center">
        <div
          className="overflow-hidden rounded-lg border border-border bg-bg-base"
          style={{
            aspectRatio: `${session.width} / ${session.height}`,
            height: "10rem",
            width: "auto",
            maxWidth: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            width={session.width}
            height={session.height}
            role="img"
            aria-label={t("panel.gifFrame.previewAlt", { index: safeIndex + 1 })}
            className="block h-full w-full object-contain"
          />
        </div>
      </div>

      <div>
        <input
          type="range"
          min={0}
          max={maxIndex}
          step={1}
          value={safeIndex}
          onPointerDown={() => {
            scrubbingRef.current = true;
          }}
          onPointerUp={commitIndex}
          onPointerCancel={commitIndex}
          onChange={(e) => handleIndexChange(Number(e.target.value))}
          aria-label={t("panel.gifFrame.sliderAria")}
          className={cn(
            "w-full accent-accent",
            "h-2 cursor-pointer appearance-none rounded-full bg-bg-surface"
          )}
        />
        <p className="mt-1.5 text-xs text-text-muted">{t("panel.gifFrame.hint")}</p>
      </div>
    </div>
  );
}
