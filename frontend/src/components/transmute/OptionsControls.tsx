"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { ToolOptionSpec, RgbColor } from "@/lib/tools/types";
import type { TransmutationOptions } from "@/workers/types";

type OptionsControlsProps = {
  specs: ToolOptionSpec[];
  values: TransmutationOptions;
  onChange: (next: TransmutationOptions) => void;
};

function rgbEq(a: RgbColor, b: RgbColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

export function OptionsControls({ specs, values, onChange }: OptionsControlsProps) {
  if (specs.length === 0) return null;

  return (
    <div className="space-y-6">
      {specs.map((spec) =>
        spec.kind === "slider" ? (
          <SliderControl
            key={spec.key}
            spec={spec}
            value={values[spec.key] as number}
            onChange={(v) => onChange({ ...values, [spec.key]: v })}
          />
        ) : (
          <ColorControl
            key={spec.key}
            spec={spec}
            value={values[spec.key] as RgbColor | undefined}
            onChange={(v) => onChange({ ...values, background: v })}
          />
        )
      )}
    </div>
  );
}

function SliderControl({
  spec,
  value,
  onChange,
}: {
  spec: Extract<ToolOptionSpec, { kind: "slider" }>;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">
          {spec.label}
        </span>
        <span className="font-mono text-xs tabular-nums text-text-primary">
          {value}
        </span>
      </div>

      {spec.presets.length > 0 && (
        <div className="mb-2 flex gap-1" role="group" aria-label={`${spec.label} presets`}>
          {spec.presets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              aria-pressed={value === p.value}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
                value === p.value
                  ? "bg-accent text-white"
                  : "bg-bg-elevated text-text-muted hover:text-text-secondary"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {spec.lowerLabel && (
          <span className="shrink-0 text-xs text-text-muted">{spec.lowerLabel}</span>
        )}
        <input
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step}
            value={value ?? spec.defaultValue}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={spec.label}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-bg-elevated accent-accent"
        />
        {spec.upperLabel && (
          <span className="shrink-0 text-xs text-text-muted">{spec.upperLabel}</span>
        )}
      </div>

      <p className="mt-1.5 text-xs text-text-muted">{spec.hint}</p>
    </div>
  );
}

function ColorControl({
  spec,
  value,
  onChange,
}: {
  spec: Extract<ToolOptionSpec, { kind: "color" }>;
  value: RgbColor | undefined;
  onChange: (v: RgbColor) => void;
}) {
  const current = value ?? spec.defaultValue;

  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        onChange({ r, g, b });
      }
    },
    [onChange]
  );

  const toHex = (c: RgbColor) =>
    `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">
          {spec.label}
        </span>
      </div>

      <div className="flex items-center gap-2" role="group" aria-label={spec.label}>
        {spec.swatches.map((swatch) => (
          <button
            key={swatch.label}
            type="button"
            onClick={() => onChange(swatch.value)}
            aria-label={`${swatch.label} background`}
            aria-pressed={rgbEq(current, swatch.value)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
              rgbEq(current, swatch.value)
                ? "border-accent"
                : "border-border hover:border-text-muted"
            )}
            style={{
              backgroundColor: `rgb(${swatch.value.r},${swatch.value.g},${swatch.value.b})`,
            }}
          />
        ))}
        {spec.allowCustom && (
          <span className="relative ml-1">
            <span
              className="block h-7 w-7 rounded-full border-2 border-dashed border-text-muted"
              style={{ backgroundColor: `rgb(${current.r},${current.g},${current.b})` }}
            />
            <input
              type="color"
              value={toHex(current)}
              onChange={handleHexChange}
              aria-label="Custom background color"
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </span>
        )}
      </div>

      <p className="mt-1.5 text-xs text-text-muted">{spec.hint}</p>
    </div>
  );
}
