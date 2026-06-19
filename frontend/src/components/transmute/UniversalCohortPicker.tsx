"use client";

import { useMemo } from "react";
import { formatBytes } from "@/lib/format/bytes";
import type { InputCohort } from "@/lib/tools/universal-matrix";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type Props = {
  cohorts: InputCohort[];
  totalFileCount: number;
  activeCohortId: string | null;
  onChooseOutput: (cohort: InputCohort) => void;
  onDismiss: () => void;
  disabled?: boolean;
};

export function UniversalCohortPicker({
  cohorts,
  totalFileCount,
  activeCohortId,
  onChooseOutput,
  onDismiss,
  disabled = false,
}: Props) {
  const { t } = useI18n();

  const sortedCohorts = useMemo(
    () =>
      [...cohorts].sort((a, b) => {
        const byFamily = a.familyLabel.localeCompare(b.familyLabel);
        if (byFamily !== 0) return byFamily;
        return b.files.length - a.files.length;
      }),
    [cohorts]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">
            {t("landing.universal.batch.mixedGroupsTitle", {
              fileCount: totalFileCount,
              groupCount: cohorts.length,
            })}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            {t("landing.universal.batch.mixedGroupsHint")}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          disabled={disabled}
          className="shrink-0 text-xs font-medium text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
        >
          {t("landing.universal.batch.dismissGroups")}
        </button>
      </div>

      <ul className="flex flex-col gap-3" role="list">
        {sortedCohorts.map((cohort) => {
          const totalBytes = cohort.files.reduce((sum, f) => sum + f.size, 0);
          const isActive = activeCohortId === cohort.id;

          return (
            <li key={cohort.id}>
              <div
                className={cn(
                  "universal-cohort-panel",
                  isActive && "ring-1 ring-accent/40"
                )}
              >
                <div className="universal-cohort-panel__header">
                  <div className="universal-cohort-panel__badges">
                    <span className="universal-cohort-panel__format">{cohort.familyLabel}</span>
                    <span className="universal-cohort-panel__count">
                      {t("landing.universal.batch.fileCountBadge", {
                        count: cohort.files.length,
                      })}
                    </span>
                  </div>
                  <div className="universal-cohort-panel__header-end">
                    <span className="universal-cohort-panel__total">{formatBytes(totalBytes)}</span>
                  </div>
                </div>

                <p className="px-3.5 pb-2 text-xs text-text-muted">
                  {t("landing.universal.batch.filesSummary", {
                    format: cohort.familyLabel,
                    count: cohort.files.length,
                  })}
                </p>

                <div className="border-t border-border/50 px-3.5 py-3">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChooseOutput(cohort)}
                    className={cn(
                      "w-full rounded-lg border border-accent/30 bg-accent-subtle/30 px-3 py-2.5 text-sm font-medium text-text-primary",
                      "transition-colors hover:border-accent/50 hover:bg-accent-subtle/50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      disabled && "pointer-events-none opacity-60"
                    )}
                  >
                    {t("landing.universal.batch.chooseOutput")}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
