"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { ToolOptionSpec, RgbColor } from "@/lib/tools/types";
import type { TransmutationOptions } from "@/workers/types";
import { useI18n } from "@/providers/I18nProvider";
import { getOptionSpecStrings } from "@/lib/i18n/tool-copy";

type OptionsControlsProps = {
  toolId: string;
  specs: ToolOptionSpec[];
  values: TransmutationOptions;
  onChange: (next: TransmutationOptions) => void;
  sourceWidth?: number;
  sourceHeight?: number;
};

function rgbEq(a: RgbColor, b: RgbColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

export function OptionsControls({ toolId, specs, values, onChange, sourceWidth, sourceHeight }: OptionsControlsProps) {
  const { t } = useI18n();
  if (specs.length === 0) return null;

  const hasResize = specs.some((s) => s.kind === "slider" && s.key === "resizePercent");

  return (
    <div className="space-y-6">
      {specs.map((spec) =>
        spec.kind === "slider" ? (
          <SliderControl
            key={spec.key}
            toolId={toolId}
            spec={spec}
            value={values[spec.key] as number}
            allValues={values}
            onChange={(v) => onChange({ ...values, [spec.key]: v })}
            t={t}
            sourceWidth={sourceWidth}
            sourceHeight={sourceHeight}
          />
        ) : (
          <ColorControl
            key={spec.key}
            toolId={toolId}
            spec={spec}
            value={values[spec.key] as RgbColor | undefined}
            onChange={(v) => onChange({ ...values, background: v })}
            t={t}
          />
        )
      )}
      {hasResize && (
        <ResizeFilterControl
          value={values.resizeFilter ?? 2}
          onChange={(v) => onChange({ ...values, resizeFilter: v })}
          t={t}
        />
      )}
    </div>
  );
}

function SliderControl({
  toolId,
  spec,
  value,
  allValues,
  onChange,
  t,
  sourceWidth,
  sourceHeight,
}: {
  toolId: string;
  spec: Extract<ToolOptionSpec, { kind: "slider" }>;
  value: number;
  allValues: TransmutationOptions;
  onChange: (v: number) => void;
  t: ReturnType<typeof useI18n>["t"];
  sourceWidth?: number;
  sourceHeight?: number;
}) {
  const strings = getOptionSpecStrings(toolId, spec, t);
  const [advancedScale, setAdvancedScale] = useState(false);

  const isResize = spec.key === "resizePercent";
  const isQuality = spec.key === "quality";
  const effectiveMax = isResize && advancedScale ? 400 : spec.max;
  const isUpscale = isResize && value > 100;

  const valueLabel =
    spec.key === "iconSize"
      ? `${value}px`
      : spec.key === "subsampling"
        ? value === 0 ? "4:2:0" : value === 1 ? "4:2:2" : "4:4:4"
      : spec.key === "optimizationLevel"
        ? value === 0 ? "Off" : value === 1 ? "Full" : "Archival"
      : spec.key === "lossyMode"
        ? value === 0 ? "Off" : "On"
      : spec.key === "usePredictor"
        ? value === 0 ? "Off" : "On"
      : spec.key === "progressive"
        ? value === 0 ? "Off" : "On"
      : isResize
        ? `${value}%`
        : spec.key === "outputScale" &&
          allValues.outputWidth != null &&
          allValues.outputHeight != null
        ? `${allValues.outputWidth} × ${allValues.outputHeight}`
        : String(value);

  const showResizeDims =
    isResize &&
    sourceWidth != null &&
    sourceHeight != null &&
    sourceWidth > 0 &&
    sourceHeight > 0;
  const targetW = showResizeDims ? Math.max(1, Math.round(sourceWidth! * value / 100)) : null;
  const targetH = showResizeDims ? Math.max(1, Math.round(sourceHeight! * value / 100)) : null;
  const isLarger = showResizeDims && targetW != null && sourceWidth != null && targetW > sourceWidth;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{strings.label}</span>
        <div className="flex items-center gap-2">
          {isResize && (
            <button
              type="button"
              onClick={() => {
                const next = !advancedScale;
                setAdvancedScale(next);
                if (!next && value > 200) onChange(200);
              }}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                advancedScale
                  ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                  : "bg-bg-elevated text-text-muted hover:text-text-secondary"
              )}
            >
              {advancedScale ? t("resize.advancedScalingOn") : t("resize.advancedScaling")}
            </button>
          )}
          <span
            className={cn(
              "font-mono text-sm tabular-nums",
              isUpscale ? "text-[#F59E0B]" : "text-text-primary"
            )}
          >
            {valueLabel}
          </span>
        </div>
      </div>
      {strings.presets.length > 0 && (
        <div className="flex gap-1.5" role="group" aria-label={`${strings.label} presets`}>
          {strings.presets.map((p) => (
            <button key={p.value} type="button" onClick={() => onChange(p.value)} aria-pressed={value === p.value}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
                value === p.value ? "bg-accent text-white" : "bg-bg-elevated text-text-muted hover:text-text-secondary"
              )}>
              {p.label}
            </button>
          ))}
        </div>
      )}
      {spec.key !== "iconSize" && spec.key !== "outputScale" && (
        <div className="flex items-center gap-3">
          {strings.lowerLabel && <span className="shrink-0 text-xs text-text-muted">{strings.lowerLabel}</span>}
          <input type="range" min={spec.min} max={effectiveMax} step={spec.step} value={value}
            onChange={(e) => onChange(Number(e.target.value))} aria-label={strings.label}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-bg-elevated accent-accent" />
          {strings.upperLabel && <span className="shrink-0 text-xs text-text-muted">{strings.upperLabel}</span>}
        </div>
      )}
      <p className="text-xs text-text-muted">{strings.hint}</p>
      {showResizeDims && targetW != null && targetH != null && (
        <div className="rounded-md bg-bg-elevated/50 px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Dimensions</span>
            <span className="font-mono tabular-nums">
              <span className="text-text-secondary">{sourceWidth} × {sourceHeight}</span>
              <span className="mx-2 text-text-muted">→</span>
              <span className={cn(isLarger ? "text-[#F59E0B]" : "text-text-primary")}>
                {targetW} × {targetH}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorControl({
  toolId,
  spec,
  value,
  onChange,
  t,
}: {
  toolId: string;
  spec: Extract<ToolOptionSpec, { kind: "color" }>;
  value: RgbColor | undefined;
  onChange: (v: RgbColor) => void;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const strings = getOptionSpecStrings(toolId, spec, t);
  const current = value ?? spec.defaultValue;

  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) onChange({ r, g, b });
  }, [onChange]);

  const toHex = (c: RgbColor) => `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{strings.label}</span>
      </div>
      <div className="flex items-center gap-2" role="group" aria-label={strings.label}>
        {strings.swatches.map((swatch) => (
          <button key={swatch.label} type="button" onClick={() => onChange(swatch.value)}
            aria-label={`${swatch.label} background`} aria-pressed={rgbEq(current, swatch.value)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
              rgbEq(current, swatch.value) ? "border-accent" : "border-border hover:border-text-muted"
            )}
            style={{ backgroundColor: `rgb(${swatch.value.r},${swatch.value.g},${swatch.value.b})` }}
          />
        ))}
        {spec.allowCustom && (
          <span className="relative ml-1">
            <span className="block h-7 w-7 rounded-full border-2 border-dashed border-text-muted"
              style={{ backgroundColor: `rgb(${current.r},${current.g},${current.b})` }} />
            <input type="color" value={toHex(current)} onChange={handleHexChange}
              aria-label={strings.customAria ?? "Custom background color"}
              className="absolute inset-0 cursor-pointer opacity-0" />
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-text-muted">{strings.hint}</p>
    </div>
  );
}

const RESIZE_FILTERS = [
  { value: 2, key: "sharp", descKey: "sharpDesc" },
  { value: 4, key: "sharpest", descKey: "sharpestDesc" },
  { value: 1, key: "smooth", descKey: "smoothDesc" },
] as const;

const ADVANCED_FILTERS = [
  { value: 0, key: "nearest", descKey: "nearestDesc" },
  { value: 3, key: "gaussian", descKey: "gaussianDesc" },
] as const;

function ResizeFilterControl({
  value,
  onChange,
  t,
}: {
  value: number;
  onChange: (v: number) => void;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilter = [...RESIZE_FILTERS, ...ADVANCED_FILTERS].find((f) => f.value === value);
  const activeKey = activeFilter?.key ?? "sharp";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">
          {t("resize.filterLabel")}
        </span>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            showAdvanced
              ? "bg-accent/20 text-accent"
              : "bg-bg-elevated text-text-muted hover:text-text-secondary"
          )}
        >
          <span>{t("resize.filter.advanced")}</span>
          <svg className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("resize.filterLabel")}>
        {RESIZE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            aria-pressed={value === f.value}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              value === f.value
                ? "bg-accent text-white"
                : "bg-bg-elevated text-text-muted hover:text-text-secondary"
            )}
          >
            {t(`resize.filter.${f.key}`)}
          </button>
        ))}
        {showAdvanced && ADVANCED_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            aria-pressed={value === f.value}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              value === f.value
                ? "bg-accent text-white"
                : "bg-bg-elevated text-text-muted hover:text-text-secondary"
            )}
          >
            {t(`resize.filter.${f.key}`)}
          </button>
        ))}
      </div>
      <div className="rounded-md bg-bg-elevated/50 px-3 py-2">
        <p className="text-xs text-text-muted">
          {t(`resize.filter.${activeKey}Desc`)}
        </p>
      </div>
    </div>
  );
}
