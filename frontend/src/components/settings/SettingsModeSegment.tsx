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
  compact?: boolean;
};

export function SettingsModeSegment<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  compact = false,
}: SettingsModeSegmentProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "theme-segment-track flex-wrap",
        compact ? "text-[10px]" : "text-xs"
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
              compact && "min-w-[2.75rem] px-1",
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
