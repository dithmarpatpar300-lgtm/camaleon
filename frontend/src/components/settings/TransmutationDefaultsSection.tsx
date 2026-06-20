"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import {
  ALPHA_BACKGROUND_SWATCHES,
  TRANSMUTATION_DEFAULT_BOUNDS,
  getEffectiveTransmutationDefaults,
  resetTransmutationDefaults,
  writeTransmutationDefaults,
} from "@/lib/prefs/transmutation-defaults";
import type { RgbColor } from "@/lib/tools/types";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./SettingsSection";
import { SettingsRange } from "./SettingsRange";

function rgbEq(a: RgbColor, b: RgbColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

type Props = {
  drawerOpen: boolean;
};

export function TransmutationDefaultsSection({ drawerOpen }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [defaults, setDefaults] = useState(getEffectiveTransmutationDefaults);

  useEffect(() => {
    if (!drawerOpen) return;
    setDefaults(getEffectiveTransmutationDefaults());
  }, [drawerOpen]);

  const persist = useCallback(
    (partial: Parameters<typeof writeTransmutationDefaults>[0]) => {
      writeTransmutationDefaults(partial);
      setDefaults(getEffectiveTransmutationDefaults());
    },
    []
  );

  const handleReset = useCallback(() => {
    resetTransmutationDefaults();
    setDefaults(getEffectiveTransmutationDefaults());
    toast({ message: t("settings.tools.resetDone"), variant: "success" });
  }, [t, toast]);

  const actionButtonClass = cn(
    "rounded-lg border border-border bg-bg-elevated/50 px-3 py-2 text-xs font-medium text-text-secondary",
    "transition-colors hover:border-accent/25 hover:bg-bg-elevated hover:text-text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  );

  return (
    <SettingsSection title={t("settings.tools.section")} focusTarget="defaults">
      <SettingsRange
        label={t("settings.tools.jpegQualityLabel")}
        hint={t("settings.tools.jpegQualityHint")}
        value={defaults.jpegQuality}
        min={TRANSMUTATION_DEFAULT_BOUNDS.jpegQuality.min}
        max={TRANSMUTATION_DEFAULT_BOUNDS.jpegQuality.max}
        onChange={(jpegQuality) => persist({ jpegQuality })}
      />
      <SettingsRange
        label={t("settings.tools.pngCompressionLabel")}
        hint={t("settings.tools.pngCompressionHint")}
        value={defaults.pngCompression}
        min={TRANSMUTATION_DEFAULT_BOUNDS.pngCompression.min}
        max={TRANSMUTATION_DEFAULT_BOUNDS.pngCompression.max}
        onChange={(pngCompression) => persist({ pngCompression })}
      />
      <SettingsRange
        label={t("settings.tools.avifQualityLabel")}
        hint={t("settings.tools.avifQualityHint")}
        value={defaults.avifQuality}
        min={TRANSMUTATION_DEFAULT_BOUNDS.avifQuality.min}
        max={TRANSMUTATION_DEFAULT_BOUNDS.avifQuality.max}
        onChange={(avifQuality) => persist({ avifQuality })}
      />
      <SettingsRange
        label={t("settings.tools.avifSpeedLabel")}
        hint={t("settings.tools.avifSpeedHint")}
        value={defaults.avifSpeed}
        min={TRANSMUTATION_DEFAULT_BOUNDS.avifSpeed.min}
        max={TRANSMUTATION_DEFAULT_BOUNDS.avifSpeed.max}
        onChange={(avifSpeed) => persist({ avifSpeed })}
      />
      <div className="space-y-2 border-b border-border px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-text-primary">
            {t("settings.tools.backgroundLabel")}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">{t("settings.tools.backgroundHint")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("settings.tools.backgroundLabel")}>
          {ALPHA_BACKGROUND_SWATCHES.map((swatch) => (
            <button
              key={swatch.labelKey}
              type="button"
              aria-label={t(swatch.labelKey)}
              aria-pressed={rgbEq(defaults.alphaBackground, swatch.value)}
              onClick={() => persist({ alphaBackground: swatch.value })}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                rgbEq(defaults.alphaBackground, swatch.value)
                  ? "border-accent"
                  : "border-border hover:border-text-muted"
              )}
              style={{
                backgroundColor: `rgb(${swatch.value.r}, ${swatch.value.g}, ${swatch.value.b})`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end px-4 py-3">
        <button type="button" onClick={handleReset} className={actionButtonClass}>
          {t("settings.tools.resetAction")}
        </button>
      </div>
    </SettingsSection>
  );
}
