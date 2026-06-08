"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { renderIcoEntryPreviewPng, type IcoMeta } from "@/lib/ico/ico-wasm-client";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type IcoEntryScrubberProps = {
  bytes: Uint8Array;
  meta: IcoMeta;
  entryIndex: number;
  onEntryIndexChange: (index: number) => void;
};

export function IcoEntryScrubber({
  bytes,
  meta,
  entryIndex,
  onEntryIndexChange,
}: IcoEntryScrubberProps) {
  const { t } = useI18n();
  const scrubbingRef = useRef(false);
  const [localIndex, setLocalIndex] = useState(entryIndex);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  const entryCount = meta.entryCount;
  const maxIndex = Math.max(0, entryCount - 1);
  const safeIndex = Math.min(localIndex, maxIndex);

  useEffect(() => {
    setLocalIndex(entryIndex);
  }, [entryIndex]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const load = async () => {
      const idx = Math.min(entryIndex, maxIndex);
      try {
        const png = await renderIcoEntryPreviewPng(bytes, idx);
        if (cancelled) return;
        const copy = new Uint8Array(png);
        const blob = new Blob([copy], { type: "image/png" });
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        setPreviewSize({
          width: meta.entryWidth(idx),
          height: meta.entryHeight(idx),
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
  }, [bytes, entryIndex, maxIndex, meta]);

  const handleIndexChange = useCallback(
    (index: number) => {
      setLocalIndex(index);
      if (!scrubbingRef.current) {
        onEntryIndexChange(index);
      }
    },
    [onEntryIndexChange]
  );

  const commitIndex = useCallback(() => {
    scrubbingRef.current = false;
    onEntryIndexChange(localIndex);
  }, [localIndex, onEntryIndexChange]);

  const aspect =
    previewSize.width > 0 && previewSize.height > 0
      ? `${previewSize.width} / ${previewSize.height}`
      : "1 / 1";

  const sizeLabel = `${meta.entryWidth(safeIndex)}×${meta.entryHeight(safeIndex)}`;

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-border bg-bg-elevated/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-secondary">
          {t("panel.icoEntry.title")}
        </p>
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {t("panel.icoEntry.counter", {
            current: safeIndex + 1,
            total: entryCount,
            size: sizeLabel,
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
              alt={t("panel.icoEntry.previewAlt", { index: safeIndex + 1, size: sizeLabel })}
              className="block h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
              {t("panel.icoEntry.loadingPreview")}
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
          aria-label={t("panel.icoEntry.sliderAria")}
          className={cn(
            "w-full accent-accent",
            "h-2 cursor-pointer appearance-none rounded-full bg-bg-surface"
          )}
        />
        <p className="mt-1.5 text-xs text-text-muted">{t("panel.icoEntry.hint")}</p>
      </div>
    </div>
  );
}
