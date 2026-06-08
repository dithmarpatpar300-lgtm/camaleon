"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { renderTiffPagePreviewPng, type TiffMeta } from "@/lib/tiff/tiff-wasm-client";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type TiffPageScrubberProps = {
  bytes: Uint8Array;
  meta: TiffMeta;
  pageIndex: number;
  onPageIndexChange: (index: number) => void;
};

export function TiffPageScrubber({
  bytes,
  meta,
  pageIndex,
  onPageIndexChange,
}: TiffPageScrubberProps) {
  const { t } = useI18n();
  const scrubbingRef = useRef(false);
  const [localIndex, setLocalIndex] = useState(pageIndex);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const pageCount = meta.pageCount;
  const maxIndex = Math.max(0, pageCount - 1);
  const safeIndex = Math.min(localIndex, maxIndex);

  useEffect(() => {
    setLocalIndex(pageIndex);
  }, [pageIndex]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const load = async () => {
      const idx = Math.min(pageIndex, maxIndex);
      try {
        const png = await renderTiffPagePreviewPng(bytes, idx);
        if (cancelled) return;
        const copy = new Uint8Array(png);
        const blob = new Blob([copy], { type: "image/png" });
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        setPreviewSize({
          width: meta.pageWidth(idx),
          height: meta.pageHeight(idx),
        });
      } catch {
        if (!cancelled) setPreviewUrl(null);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bytes, pageIndex, maxIndex, meta]);

  const handleIndexChange = useCallback(
    (index: number) => {
      setLocalIndex(index);
      if (!scrubbingRef.current) {
        onPageIndexChange(index);
      }
    },
    [onPageIndexChange]
  );

  const commitIndex = useCallback(() => {
    scrubbingRef.current = false;
    onPageIndexChange(localIndex);
  }, [localIndex, onPageIndexChange]);

  const aspect =
    previewSize.width > 0 && previewSize.height > 0
      ? `${previewSize.width} / ${previewSize.height}`
      : "1 / 1";

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-border bg-bg-elevated/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-secondary">
          {t("panel.tiffPage.title")}
        </p>
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {t("panel.tiffPage.counter", {
            current: safeIndex + 1,
            total: pageCount,
          })}
        </span>
      </div>

      <div className="flex justify-center">
        <div
          className="overflow-hidden rounded-lg border border-border bg-bg-base"
          style={{
            aspectRatio: aspect,
            height: "10rem",
            width: "auto",
            maxWidth: "100%",
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={t("panel.tiffPage.previewAlt", { index: safeIndex + 1 })}
              className="block h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
              {t("panel.tiffPage.loadingPreview")}
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
          onPointerDown={() => {
            scrubbingRef.current = true;
          }}
          onPointerUp={commitIndex}
          onPointerCancel={commitIndex}
          onChange={(e) => handleIndexChange(Number(e.target.value))}
          aria-label={t("panel.tiffPage.sliderAria")}
          className={cn(
            "w-full accent-accent",
            "h-2 cursor-pointer appearance-none rounded-full bg-bg-surface"
          )}
        />
        <p className="mt-1.5 text-xs text-text-muted">{t("panel.tiffPage.hint")}</p>
      </div>
    </div>
  );
}
