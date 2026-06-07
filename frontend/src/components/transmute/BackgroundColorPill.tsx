"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { colorLabel } from "@/lib/format/color-label";
import type { RgbColor } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type SwatchOption = { label: string; value: RgbColor };

type BackgroundColorPillProps = {
  color: RgbColor;
  swatches: SwatchOption[];
  allowCustom?: boolean;
  onChange: (color: RgbColor) => void;
  className?: string;
};

function rgbEq(a: RgbColor, b: RgbColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

function toHex(c: RgbColor): string {
  return `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`;
}

export function BackgroundColorPill({
  color,
  swatches,
  allowCustom,
  onChange,
  className,
}: BackgroundColorPillProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();
  const label = colorLabel(color, t);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) onChange({ r, g, b });
    },
    [onChange]
  );

  return (
    <span
      ref={rootRef}
      className={cn("relative inline align-middle", className)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-label={t("panel.transparencyNotice.pillAriaLabel", { color: label })}
        className={cn(
          "inline-flex max-w-full -translate-y-px items-center gap-1.5 rounded-full",
          "border border-border/80 bg-bg-elevated/90 px-2 py-px",
          "text-xs font-medium leading-none text-text-primary shadow-sm",
          "transition-colors hover:border-info/50 hover:bg-bg-elevated",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
          open && "border-info/50 bg-bg-elevated ring-1 ring-info/20"
        )}
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/25 shadow-inner"
          style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
          aria-hidden="true"
        />
        <span className="truncate">{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={cn(
            "h-3 w-3 shrink-0 text-text-muted transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("panel.transparencyNotice.pickerTitle")}
          className="glass-palette absolute left-0 top-full z-50 mt-2 w-56 rounded-xl p-3"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
            {t("panel.transparencyNotice.pickerTitle")}
          </p>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t("panel.transparencyNotice.pickerTitle")}
          >
            {swatches.map((swatch) => (
              <button
                key={swatch.label}
                type="button"
                onClick={() => {
                  onChange(swatch.value);
                  setOpen(false);
                }}
                aria-label={swatch.label}
                aria-pressed={rgbEq(color, swatch.value)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  rgbEq(color, swatch.value)
                    ? "border-accent"
                    : "border-border hover:border-text-muted"
                )}
                style={{
                  backgroundColor: `rgb(${swatch.value.r}, ${swatch.value.g}, ${swatch.value.b})`,
                }}
              />
            ))}
            {allowCustom && (
              <span className="relative">
                <span
                  className="block h-8 w-8 rounded-full border-2 border-dashed border-text-muted"
                  style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                />
                <input
                  type="color"
                  value={toHex(color)}
                  onChange={handleHexChange}
                  aria-label={t("tools.png-to-jpg.options.background.customAria")}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {t("panel.transparencyNotice.pickerHint")}
          </p>
        </div>
      )}
    </span>
  );
}
