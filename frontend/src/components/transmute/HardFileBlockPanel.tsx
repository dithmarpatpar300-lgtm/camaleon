"use client";

import { formatBytes } from "@/lib/format/bytes";
import { formatHardLimitLabel } from "@/lib/transmutation/limits";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/providers/I18nProvider";
import { LimitUnlockHint } from "./LimitUnlockHint";

type HardFileBlockPanelProps = {
  fileSize: number;
  hardLimitBytes: number;
  canResize?: boolean;
  onStartResize?: () => void;
};

export function HardFileBlockPanel({
  fileSize,
  hardLimitBytes,
  canResize = false,
  onStartResize,
}: HardFileBlockPanelProps) {
  const { t } = useI18n();
  const limitLabel = formatHardLimitLabel(hardLimitBytes, false);

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
    >
      <p className="font-medium">{t("panel.hardFileBlock.title")}</p>
      <p className="mt-1 text-error/90">
        {t("panel.hardFileBlock.body", {
          size: formatBytes(fileSize),
          limit: limitLabel,
        })}
      </p>
      {canResize && onStartResize ? (
        <>
          <p className="mt-2 text-xs text-error/80">
            {t("panel.hardFileBlock.resizeHint")}
          </p>
          <Button
            variant="subtle"
            size="sm"
            className="mt-3 border-error/40 bg-error/15 text-error hover:bg-error/25"
            onClick={onStartResize}
          >
            {t("panel.hardFileBlock.resizeCta")}
          </Button>
        </>
      ) : (
        <p className="mt-2 text-xs text-error/80">{t("panel.hardFileBlock.action")}</p>
      )}
      <LimitUnlockHint variant="error" />
    </div>
  );
}
