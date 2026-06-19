"use client";

import type { BatchRowPickerConfig } from "@/lib/batch/batch-per-row-options";
import type { TransmutationOptions } from "@/workers/types";
import { useI18n } from "@/providers/I18nProvider";

type Props = {
  config: BatchRowPickerConfig;
  itemOptions: TransmutationOptions;
  onChange: (next: TransmutationOptions) => void;
  disabled?: boolean;
};

function readIndex(config: BatchRowPickerConfig, options: TransmutationOptions): number {
  if (config.kind === "gif-frame") return options.frameIndex ?? 0;
  if (config.kind === "tiff-page") return options.pageIndex ?? 0;
  return options.entryIndex ?? 0;
}

function writeIndex(
  config: BatchRowPickerConfig,
  options: TransmutationOptions,
  index: number
): TransmutationOptions {
  if (config.kind === "gif-frame") return { ...options, frameIndex: index };
  if (config.kind === "tiff-page") return { ...options, pageIndex: index };
  return { ...options, entryIndex: index };
}

/** Compact per-row frame/page/entry picker for batch rows (no preview). */
export function BatchRowIndexPicker({ config, itemOptions, onChange, disabled }: Props) {
  const { t } = useI18n();
  const value = Math.min(Math.max(0, readIndex(config, itemOptions)), config.maxIndex);

  return (
    <div className="mt-2 space-y-1" onClick={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted">
        <span>{t(config.labelKey)}</span>
        <span className="font-mono tabular-nums">
          {value + 1} / {config.maxIndex + 1}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={config.maxIndex}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(writeIndex(config, itemOptions, Number(e.target.value)))}
        aria-label={t(config.labelKey)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-bg-surface accent-accent disabled:opacity-50"
      />
    </div>
  );
}
