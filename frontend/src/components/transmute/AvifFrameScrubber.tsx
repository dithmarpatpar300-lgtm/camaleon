"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AvifMeta } from "@/lib/avif/avif-wasm-client";
import { ensureAvifWasm } from "@/lib/avif/avif-wasm-client";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type AvifFrameScrubberProps = {
  bytes: Uint8Array;
  meta: AvifMeta;
  frameIndex: number;
  onFrameIndexChange: (index: number) => void;
};

export function AvifFrameScrubber({
  bytes,
  meta,
  frameIndex,
  onFrameIndexChange,
}: AvifFrameScrubberProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrubbingRef = useRef(false);
  const [localIndex, setLocalIndex] = useState(frameIndex);
  const [loading, setLoading] = useState(false);
  const paintIdRef = useRef(0);

  const frameCount = meta.frameCount;
  const maxIndex = Math.max(0, frameCount - 1);
  const safeIndex = Math.min(localIndex, maxIndex);

  const paintFrame = useCallback(
    async (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const paintId = ++paintIdRef.current;
      setLoading(true);
      try {
        const wasm = await ensureAvifWasm();
        const png = wasm.decode_avif_preview_png(bytes, index);
        if (paintId !== paintIdRef.current) return;
        const blob = new Blob([png.slice()], { type: "image/png" });
        const bitmap = await createImageBitmap(blob);
        if (paintId !== paintIdRef.current) {
          bitmap.close();
          return;
        }
        canvas.width = meta.width;
        canvas.height = meta.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
      } catch {
        // ignore stale / teardown
      } finally {
        if (paintId === paintIdRef.current) setLoading(false);
      }
    },
    [bytes, meta.height, meta.width]
  );

  useEffect(() => {
    setLocalIndex(frameIndex);
  }, [frameIndex]);

  useEffect(() => {
    const idx = Math.min(frameIndex, maxIndex);
    void paintFrame(idx);
  }, [frameIndex, maxIndex, paintFrame]);

  const handleIndexChange = useCallback(
    (index: number) => {
      setLocalIndex(index);
      void paintFrame(index);
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

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-border bg-bg-elevated/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-secondary">
          {t("panel.gifFrame.title")}
        </p>
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {loading
            ? t("panel.metrics.calculating")
            : t("panel.gifFrame.counter", {
                current: safeIndex + 1,
                total: frameCount,
              })}
        </span>
      </div>

      <div className="flex justify-center">
        <div
          className="overflow-hidden rounded-lg border border-border bg-bg-base"
          style={{
            aspectRatio: `${meta.width} / ${meta.height}`,
            height: "10rem",
            width: "auto",
            maxWidth: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            width={meta.width}
            height={meta.height}
            role="img"
            aria-label={t("panel.gifFrame.previewAlt", { index: safeIndex + 1 })}
            className={cn(
              "block h-full w-full object-contain transition-opacity",
              loading && "opacity-60"
            )}
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
        <p className="mt-1.5 text-xs text-text-muted">{t("panel.avifFrame.hint")}</p>
      </div>
    </div>
  );
}
