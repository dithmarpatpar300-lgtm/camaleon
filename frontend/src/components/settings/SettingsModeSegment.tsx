"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: string;
};

type SettingsModeSegmentProps<T extends string> = {
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Distribute options evenly across the row (for stacked settings rows). */
  fullWidth?: boolean;
};

export function SettingsModeSegment<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  fullWidth = false,
}: SettingsModeSegmentProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "theme-segment-track text-xs font-medium",
        fullWidth ? "settings-mode-segment--full" : "inline-flex flex-wrap"
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              "theme-segment-btn",
              fullWidth && "settings-mode-segment-btn--full",
              isActive && "theme-segment-btn--active"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
