"use client";

import { cn } from "@/lib/utils";

type SettingsRangeProps = {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
};

export function SettingsRange({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (v) => String(v),
}: SettingsRangeProps) {
  return (
    <div className="space-y-2 px-4 py-3.5 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-text-secondary">{hint}</p>}
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-text-primary">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className={cn(
          "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border/80",
          "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border",
          "[&::-webkit-slider-thumb]:bg-bg-surface [&::-webkit-slider-thumb]:shadow-sm",
          "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-bg-surface"
        )}
      />
    </div>
  );
}
