"use client";

import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import { useI18n } from "@/providers/I18nProvider";

type ResizedMetaNoticeProps = {
  originalMeta: SourceImageMeta;
};

export function ResizedMetaNotice({ originalMeta }: ResizedMetaNoticeProps) {
  const { t } = useI18n();
  return (
    <p className="text-xs text-info/90">
      {t("panel.resizedMeta.notice", {
        width: originalMeta.width,
        height: originalMeta.height,
      })}
    </p>
  );
}
