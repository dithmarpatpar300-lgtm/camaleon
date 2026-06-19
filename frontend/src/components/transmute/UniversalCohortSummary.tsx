"use client";

import { formatBytes } from "@/lib/format/bytes";
import { DisplayFilename } from "@/components/ui/DisplayFilename";
import { PanelScrollFade } from "@/components/ui/PanelScrollFade";
import { useI18n } from "@/providers/I18nProvider";

type Props = {
  formatLabel: string;
  files: File[];
  totalBytes: number;
  onChangeFiles: () => void;
  changeDisabled?: boolean;
};

function FileRowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M4.5 2A1.5 1.5 0 003 3.5v9A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5v-5.379a1.5 1.5 0 00-.44-1.06L9.44 3.44A1.5 1.5 0 008.378 3H4.5z" />
    </svg>
  );
}

/** Batch cohort summary — glass panel with masked file list (Universal transmutator). */
export function UniversalCohortSummary({
  formatLabel,
  files,
  totalBytes,
  onChangeFiles,
  changeDisabled = false,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="universal-cohort-panel">
      <div className="universal-cohort-panel__header">
        <div className="universal-cohort-panel__badges">
          <span className="universal-cohort-panel__format">{formatLabel}</span>
          <span className="universal-cohort-panel__count">
            {t("landing.universal.batch.fileCountBadge", { count: files.length })}
          </span>
        </div>
        <div className="universal-cohort-panel__header-end">
          <span className="universal-cohort-panel__total">{formatBytes(totalBytes)}</span>
          {!changeDisabled && (
            <button type="button" onClick={onChangeFiles} className="universal-cohort-panel__change">
              {t("landing.universal.batch.changeFiles")}
            </button>
          )}
        </div>
      </div>

      <PanelScrollFade
        className="universal-cohort-panel__list"
        maxHeightClass="max-h-36"
        fadePx={36}
        ariaLabel={t("landing.universal.batch.filesListAria")}
      >
        <ul className="flex flex-col gap-1.5">
          {files.map((file) => (
            <li key={`${file.name}-${file.lastModified}-${file.size}`}>
              <div className="universal-cohort-file-row">
                <span className="universal-cohort-file-row__icon" aria-hidden="true">
                  <FileRowIcon />
                </span>
                <DisplayFilename
                  name={file.name}
                  className="universal-cohort-file-row__name min-w-0 flex-1 text-xs font-medium text-text-primary"
                />
                <span className="universal-cohort-file-row__size shrink-0 font-mono text-[10px] tabular-nums text-text-muted">
                  {formatBytes(file.size)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </PanelScrollFade>
    </div>
  );
}
