"use client";

import type { ToolDefinition } from "@/lib/tools/types";
import type { TransmutationOptions } from "@/workers/types";
import type { BatchItem } from "@/lib/batch/batch-types";
import type { BatchPrepareProgress } from "@/lib/batch/batch-prepare-queue";
import { Button } from "@/components/ui/Button";
import { PanelScrollFade } from "@/components/ui/PanelScrollFade";
import { OptionsControls } from "./OptionsControls";
import { BatchFileRow } from "./BatchFileRow";
import { useI18n } from "@/providers/I18nProvider";
import { formatBytes } from "@/lib/format/bytes";

type BatchWorkspaceProps = {
  tool: ToolDefinition;
  items: BatchItem[];
  options: TransmutationOptions;
  onOptionsChange: (next: TransmutationOptions) => void;
  onToggleItem: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onTransmuteSelected: () => void;
  onTransmuteAllReady: () => void;
  onConvertAgain: () => void;
  onReset: () => void;
  running: boolean;
  runProgress: { current: number; total: number; fileName: string } | null;
  prepareProgress: BatchPrepareProgress | null;
  aggregateWarningBytes: number | null;
  transmutableSelectedCount: number;
  readyCount: number;
  allDone: boolean;
  cacheRedownloadAvailable: boolean;
  selectedDoneCount: number;
  isPreparing: boolean;
  optionsStale: boolean;
  preparedOptionsReady: boolean;
  optionLabelKey: string;
  preparedOptionValue: string;
  currentOptionValue: string;
  lastRunOptionValue: string | undefined;
};

export function BatchWorkspace({
  tool,
  items,
  options,
  onOptionsChange,
  onToggleItem,
  onSelectAll,
  onSelectNone,
  onTransmuteSelected,
  onTransmuteAllReady,
  onConvertAgain,
  onReset,
  running,
  runProgress,
  prepareProgress,
  aggregateWarningBytes,
  transmutableSelectedCount,
  readyCount,
  allDone,
  cacheRedownloadAvailable,
  selectedDoneCount,
  isPreparing,
  optionsStale,
  preparedOptionsReady,
  optionLabelKey,
  preparedOptionValue,
  currentOptionValue,
  lastRunOptionValue,
}: BatchWorkspaceProps) {
  const { t } = useI18n();
  const selectedCount = items.filter((i) => i.selected).length;
  const optionLabel = t(optionLabelKey);

  const panelOptionSpecs =
    tool.optionSpecs?.filter((spec) => spec.key !== "background") ?? [];

  const phaseHint = (() => {
    if (allDone) {
      if (selectedDoneCount === 0) {
        return t("panel.batch.allDoneSelectHint");
      }
      if (cacheRedownloadAvailable) {
        return t("panel.batch.allDoneCacheHint");
      }
      if (optionsStale && lastRunOptionValue != null) {
        return t("panel.batch.allDoneOptionsChangedHint", {
          option: optionLabel,
          lastRun: lastRunOptionValue,
          current: currentOptionValue,
        });
      }
      return t("panel.batch.allDoneReencodeHint");
    }

    if (isPreparing) return null;

    if (optionsStale && preparedOptionsReady) {
      return t("panel.batch.optionsChangedHint", {
        option: optionLabel,
        prepared: preparedOptionValue,
        current: currentOptionValue,
      });
    }

    if (preparedOptionsReady && !optionsStale) {
      return t("panel.batch.optionsValidatedHint", {
        option: optionLabel,
        prepared: preparedOptionValue,
      });
    }

    return null;
  })();

  return (
    <div className="transmute-shell space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div>
          <p className="text-sm font-medium text-text-primary">
            {t("panel.batch.toolbarSummary", {
              total: items.length,
              selected: selectedCount,
            })}
          </p>
          <p className="text-xs text-text-muted">{tool.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onSelectAll} disabled={running}>
            {t("panel.batch.selectAll")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onSelectNone} disabled={running}>
            {t("panel.batch.selectNone")}
          </Button>
        </div>
      </div>

      {aggregateWarningBytes != null && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {t("panel.batch.aggregateWarning", { size: formatBytes(aggregateWarningBytes) })}
        </p>
      )}

      {phaseHint && (
        <p className="rounded-lg border border-accent/25 bg-accent-subtle/20 px-3 py-2 text-xs text-text-secondary">
          {phaseHint}
        </p>
      )}

      {panelOptionSpecs.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-bg-base/50 p-4">
          <OptionsControls
            toolId={tool.id}
            specs={panelOptionSpecs}
            values={options}
            onChange={onOptionsChange}
          />
        </div>
      )}

      <PanelScrollFade
        maxHeightClass="max-h-72"
        fadePx={36}
        ariaLabel={t("panel.batch.fileListAria")}
        className="space-y-2 pr-0.5"
      >
        {items.map((item) => (
          <BatchFileRow key={item.id} item={item} onToggle={onToggleItem} />
        ))}
      </PanelScrollFade>

      {prepareProgress && prepareProgress.total > 0 && (
        <div className="rounded-lg border border-accent/20 bg-accent-subtle/30 px-3 py-2 text-xs text-text-secondary">
          {t("panel.batch.preparing", {
            current: prepareProgress.current,
            total: prepareProgress.total,
          })}
          {prepareProgress.fileName ? ` · ${prepareProgress.fileName}` : ""}
        </div>
      )}

      {runProgress && !isPreparing && (
        <div className="rounded-lg border border-accent/20 bg-accent-subtle/30 px-3 py-2 text-xs text-text-secondary">
          {t("panel.batch.processing", {
            current: runProgress.current,
            total: runProgress.total,
            fileName: runProgress.fileName,
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {allDone ? (
          <Button
            className="flex-1 sm:flex-none"
            disabled={running || selectedDoneCount === 0}
            onClick={onConvertAgain}
          >
            {cacheRedownloadAvailable
              ? t("panel.batch.downloadAgainCount", { count: selectedDoneCount })
              : t("panel.batch.convertAgainCount", { count: selectedDoneCount })}
          </Button>
        ) : (
          <>
            <Button
              className="flex-1 sm:flex-none"
              disabled={running || transmutableSelectedCount === 0}
              onClick={onTransmuteSelected}
            >
              {t("panel.batch.transmuteSelected", { count: transmutableSelectedCount })}
            </Button>
            <Button
              variant="subtle"
              disabled={running || readyCount === 0}
              onClick={onTransmuteAllReady}
            >
              {t("panel.batch.transmuteAll")}
            </Button>
          </>
        )}
        <Button variant="ghost" disabled={running} onClick={onReset}>
          {t("panel.batch.cancelBatch")}
        </Button>
      </div>
    </div>
  );
}
