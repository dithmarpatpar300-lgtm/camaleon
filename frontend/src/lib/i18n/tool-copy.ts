import type { TranslateFn } from "@/lib/i18n/types";
import type { ToolDefinition, ToolOptionSpec } from "@/lib/tools/types";

export type ResolvedToolStrings = {
  description: string;
  fidelityHint?: string;
};

export type ResolvedOptionStrings = {
  label: string;
  hint: string;
  lowerLabel?: string;
  upperLabel?: string;
  presets: { label: string; value: number }[];
  swatches: { label: string; value: { r: number; g: number; b: number } }[];
  customAria?: string;
};

export function getToolStrings(
  tool: ToolDefinition,
  t: TranslateFn
): ResolvedToolStrings {
  return {
    description: t(`tools.${tool.id}.description`),
    fidelityHint: resolveToolFidelityHint(tool.id, t),
  };
}

export function resolveToolFidelityHint(
  toolId: string,
  t: TranslateFn
): string | undefined {
  const key = `tools.${toolId}.fidelityHint`;
  const resolved = t(key);
  return resolved !== key ? resolved : undefined;
}

export function resolveToolActionTitle(
  toolId: string,
  t: TranslateFn
): string | undefined {
  const key = `tools.${toolId}.actionTitle`;
  const resolved = t(key);
  return resolved !== key ? resolved : undefined;
}

export function getOptionSpecStrings(
  toolId: string,
  spec: ToolOptionSpec,
  t: TranslateFn
): ResolvedOptionStrings {
  const base = `tools.${toolId}.options`;

  if (spec.kind === "slider") {
    return {
      label: t(`${base}.${spec.key}.label`),
      hint: t(`${base}.${spec.key}.hint`),
      lowerLabel: t(`${base}.${spec.key}.lowerLabel`),
      upperLabel: t(`${base}.${spec.key}.upperLabel`),
      presets: spec.presets.map((p) => ({
        label: t(`${base}.${spec.key}.presets.${p.label.toLowerCase()}`),
        value: p.value,
      })),
      swatches: [],
    };
  }

  return {
    label: t(`${base}.${spec.key}.label`),
    hint: t(`${base}.${spec.key}.hint`),
    customAria: t(`${base}.${spec.key}.customAria`),
    swatches: spec.swatches.map((s) => ({
      label: t(`${base}.${spec.key}.swatches.${s.label.toLowerCase()}`),
      value: s.value,
    })),
    presets: [],
  };
}
