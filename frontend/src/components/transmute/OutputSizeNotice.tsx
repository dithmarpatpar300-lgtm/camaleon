"use client";

import { formatBytes } from "@/lib/format/bytes";
import { formatHardLimitLabel } from "@/lib/transmutation/limits";
import { useI18n } from "@/providers/I18nProvider";

type OutputSizeNoticeProps = {
  estimatedSize: number;
  hardLimitBytes: number;
};

export function OutputSizeNotice({
  estimatedSize,
  hardLimitBytes,
}: OutputSizeNoticeProps) {
  const { t } = useI18n();

  return (
    <p className="mb-4 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-xs text-info" role="note">
      {t("panel.outputSizeNotice.body", {
        size: formatBytes(estimatedSize),
        limit: formatHardLimitLabel(hardLimitBytes),
      })}
    </p>
  );
}
