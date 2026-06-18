"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ToolDefinition } from "@/lib/tools/types";
import type { OutputExtension, TransmutationOptions } from "@/workers/types";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { useRiskMode } from "@/providers/RiskModeProvider";
import { buildDefaultOptions } from "@/lib/transmutation/build-default-options";
import { computeLimitContext } from "@/lib/transmutation/limit-context";
import { sumFileBytes, shouldWarnAggregateBytes } from "@/lib/batch/batch-limits";
import {
  batchItemsFromFiles,
  type BatchItem,
  type BatchItemPatch,
  type BatchPhase,
} from "@/lib/batch/batch-types";
import {
  releaseBatchItemPrepared,
  runBatchPrepareQueue,
} from "@/lib/batch/batch-prepare-queue";
import {
  buildBatchTransmuteMeta,
  resolveToolEncodeSource,
} from "@/lib/batch/build-batch-transmute-meta";
import { downloadBatchResult } from "@/lib/batch/batch-download";
import {
  canBatchCacheRedownload,
  type BatchLastRunSnapshot,
} from "@/lib/batch/batch-last-run";
import {
  isBatchEncodeOnlyTool,
  formatPrimaryBatchOptionValue,
  primaryBatchOptionLabelKey,
} from "@/lib/batch/batch-option-scope";
import { batchOptionsStale } from "@/lib/batch/batch-prepared-options";
import { minimalBatchPreparedContext } from "@/lib/batch/minimal-batch-prepared";
import { computeResourceProfile } from "@/lib/device/resource-profile";
import { buildFileIdentity } from "@/lib/transmutation/fingerprint";
import { extractWasmError } from "@/lib/wasm/extract-error";
import { releaseFramePreviewSessions } from "@/lib/imaging/frame-preview-cache";
import { FilePrepareGate } from "./FilePrepareGate";
import { BatchWorkspace } from "./BatchWorkspace";
import { OversizeConsentPanel } from "./OversizeConsentPanel";

type BatchTransmutationPanelProps = {
  tool: ToolDefinition;
  files: File[];
  onReset: () => void;
};

function isTransmutableStatus(
  item: BatchItem,
  oversizeConsented: boolean,
  riskModeEnabled: boolean
): boolean {
  if (item.status === "ready" || item.status === "error") return true;
  if (item.status === "needs_consent" && (oversizeConsented || riskModeEnabled)) return true;
  return false;
}

export function BatchTransmutationPanel({ tool, files, onReset }: BatchTransmutationPanelProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { transmutate, estimate, ready } = useTransmutationWorker();
  const { riskModeEnabled } = useRiskMode();

  const deviceMemoryGb =
    typeof navigator !== "undefined"
      ? (navigator as { deviceMemory?: number }).deviceMemory
      : undefined;

  const [items, setItems] = useState<BatchItem[]>(() => batchItemsFromFiles(files));
  const [phase, setPhase] = useState<BatchPhase>("staged");
  const [options, setOptions] = useState<TransmutationOptions>(() =>
    buildDefaultOptions(tool.optionSpecs, tool)
  );
  const [preparedOptions, setPreparedOptions] = useState<TransmutationOptions | null>(null);
  const [oversizeConsented, setOversizeConsented] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState({ current: 0, total: files.length, fileName: "" });
  const [runProgress, setRunProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [lastRunSummary, setLastRunSummary] = useState<{ done: number; total: number } | null>(null);
  const [lastRunSnapshot, setLastRunSnapshot] = useState<BatchLastRunSnapshot | null>(null);

  const cancelRef = useRef(false);
  const prepareRunIdRef = useRef(0);
  const bytesByIdRef = useRef(new Map<string, ArrayBuffer>());
  const itemsRef = useRef(items);
  itemsRef.current = items;

  /** True until the first prepare queue (initial file drop) finishes. */
  const [initialPrepareComplete, setInitialPrepareComplete] = useState(false);

  const commitItems = useCallback((updater: (prev: BatchItem[]) => BatchItem[]) => {
    const next = updater(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
  }, []);

  const aggregateBytes = useMemo(() => sumFileBytes(files), [files]);
  const showAggregateWarning = shouldWarnAggregateBytes(aggregateBytes, deviceMemoryGb);

  const effectiveOutputExtension = tool.outputExtension as OutputExtension;
  const encodeSource = resolveToolEncodeSource(tool);

  const needsElevatedConsent = useMemo(
    () => items.some((i) => i.status === "needs_consent") && !oversizeConsented && !riskModeEnabled,
    [items, oversizeConsented, riskModeEnabled]
  );

  const elevatedSample = useMemo(() => {
    const item = items.find((i) => i.status === "needs_consent");
    return item ?? null;
  }, [items]);

  const applyPatch = useCallback(
    (runId: number, id: string, patch: BatchItemPatch) => {
      if (runId !== prepareRunIdRef.current) return;
      if (patch.bytes) bytesByIdRef.current.set(id, patch.bytes);
      commitItems((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    },
    [commitItems]
  );

  const startPrepareQueue = useCallback(
    (
      seed: BatchItem[],
      runId: number,
      validateOptions: TransmutationOptions,
      mode: "initial" | "inline"
    ) => {
      cancelRef.current = false;
      void runBatchPrepareQueue(
        seed,
        tool,
        riskModeEnabled,
        deviceMemoryGb,
        setPrepareProgress,
        (id, patch) => applyPatch(runId, id, patch),
        () => cancelRef.current || runId !== prepareRunIdRef.current,
        { options: validateOptions, estimate }
      ).then(() => {
        if (!cancelRef.current && runId === prepareRunIdRef.current) {
          setPreparedOptions({ ...validateOptions });
          if (mode === "initial") {
            setInitialPrepareComplete(true);
            setPhase("staged");
          }
        }
      });
    },
    [tool, riskModeEnabled, deviceMemoryGb, applyPatch, estimate]
  );

  useEffect(() => {
    if (!ready) return;

    const runId = ++prepareRunIdRef.current;
    const seed = batchItemsFromFiles(files);
    const initialOptions = buildDefaultOptions(tool.optionSpecs, tool);
    bytesByIdRef.current.clear();
    commitItems(() => seed);
    setOptions(initialOptions);
    setPreparedOptions(null);
    setInitialPrepareComplete(false);
    setPhase("loading");
    setLastRunSummary(null);
    setLastRunSnapshot(null);
    startPrepareQueue(seed, runId, initialOptions, "initial");

    return () => {
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prepare once per mount after worker ready
  }, [ready]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        releaseBatchItemPrepared(item);
      }
      bytesByIdRef.current.clear();
    };
  }, []);

  const handleToggleItem = useCallback((id: string) => {
    commitItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  }, [commitItems]);

  const handleSelectAll = useCallback(() => {
    commitItems((prev) =>
      prev.map((item) =>
        item.status === "ready" ||
        item.status === "needs_consent" ||
        item.status === "done" ||
        item.status === "error"
          ? { ...item, selected: true }
          : item
      )
    );
  }, [commitItems]);

  const handleSelectNone = useCallback(() => {
    commitItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  }, [commitItems]);

  const handleBatchOversizeConsent = useCallback(() => {
    setOversizeConsented(true);
    commitItems((prev) =>
      prev.map((item) =>
        item.status === "needs_consent"
          ? { ...item, status: "ready" as const, blockReason: null }
          : item
      )
    );
  }, [commitItems]);

  const buildQueue = useCallback(
    (selectedOnly: boolean) => {
      return itemsRef.current.filter((item) => {
        if (selectedOnly && !item.selected) return false;
        return isTransmutableStatus(item, oversizeConsented, riskModeEnabled);
      });
    },
    [oversizeConsented, riskModeEnabled]
  );

  const resolveItemBytesAsync = useCallback(
    async (item: BatchItem): Promise<ArrayBuffer | null> => {
      if (item.bytes && item.bytes.byteLength > 0) return item.bytes;
      const cached = bytesByIdRef.current.get(item.id);
      if (cached && cached.byteLength > 0) return cached;
      try {
        const buf = await item.file.arrayBuffer();
        if (buf.byteLength > 0) {
          bytesByIdRef.current.set(item.id, buf);
          return buf;
        }
      } catch {
        // fall through
      }
      return null;
    },
    []
  );

  const runTransmute = useCallback(
    async (selectedOnly: boolean) => {
      if (!ready) {
        toast({ message: t("panel.engineInit"), variant: "info" });
        return;
      }
      if (needsElevatedConsent) {
        toast({ message: t("panel.oversize.consent"), variant: "info" });
        return;
      }

      const queue = buildQueue(selectedOnly);
      if (queue.length === 0) {
        toast({ message: t("panel.batch.selectAtLeastOne"), variant: "info" });
        return;
      }

      setPhase("running");
      setRunProgress(null);
      setLastRunSummary(null);
      releaseFramePreviewSessions();

      const usedNames = new Set<string>();
      let completed = 0;
      let skipped = 0;
      const completedIdentities: string[] = [];

      for (let i = 0; i < queue.length; i++) {
        const live = itemsRef.current.find((row) => row.id === queue[i].id) ?? queue[i];
        const prepared = live.prepared ?? minimalBatchPreparedContext(live.sourceMeta);
        const inputBytes = await resolveItemBytesAsync(live);

        if (!inputBytes || !prepared) {
          skipped++;
          commitItems((prev) =>
            prev.map((row) =>
              row.id === live.id
                ? {
                    ...row,
                    status: "error",
                    errorMessage: "panel.batch.missingPrepared",
                    selected: false,
                  }
                : row
            )
          );
          continue;
        }

        setRunProgress({ current: i + 1, total: queue.length, fileName: live.file.name });
        commitItems((prev) =>
          prev.map((row) =>
            row.id === live.id ? { ...row, status: "processing", errorMessage: null } : row
          )
        );

        const limitContext = computeLimitContext({
          fileSize: live.file.size,
          sourceMeta: prepared.sourceMeta ?? live.sourceMeta,
          deviceMemoryGb,
          oversizeConsented: oversizeConsented || riskModeEnabled,
          riskModeEnabled,
          workerReady: ready,
        });

        if (!limitContext.canTransmute) {
          skipped++;
          commitItems((prev) =>
            prev.map((row) =>
              row.id === live.id
                ? {
                    ...row,
                    status: "blocked",
                    blockReason: limitContext.blockReason,
                    selected: false,
                  }
                : row
            )
          );
          continue;
        }

        const fileProfile = computeResourceProfile(live.file.size, {
          deviceMemory: deviceMemoryGb,
        });
        const meta = buildBatchTransmuteMeta(
          live.file,
          prepared,
          tool,
          options,
          effectiveOutputExtension,
          encodeSource,
          fileProfile,
          limitContext,
          oversizeConsented,
          riskModeEnabled
        );

        try {
          const response = await transmutate(
            tool.module,
            inputBytes,
            options,
            meta,
            effectiveOutputExtension,
            encodeSource
          );

          if (response.ok && response.bytes) {
            downloadBatchResult(
              response.bytes,
              live.file.name,
              response.mime!,
              response.extension!,
              usedNames
            );
            completed++;
            completedIdentities.push(buildFileIdentity(live.file));
            commitItems((prev) =>
              prev.map((row) =>
                row.id === live.id
                  ? {
                      ...row,
                      status: "done",
                      selected: false,
                      errorMessage: null,
                    }
                  : row
              )
            );
          } else {
            const errMsg = !response.ok ? response.error : "transmute_failed";
            commitItems((prev) =>
              prev.map((row) =>
                row.id === live.id
                  ? {
                      ...row,
                      status: "error",
                      errorMessage: errMsg,
                      selected: true,
                    }
                  : row
              )
            );
          }
        } catch (err) {
          const raw = extractWasmError(err, t("panel.unexpectedError"));
          commitItems((prev) =>
            prev.map((row) =>
              row.id === live.id
                ? { ...row, status: "error", errorMessage: raw, selected: true }
                : row
            )
          );
        }
      }

      setRunProgress(null);
      setLastRunSummary({ done: completed, total: queue.length });

      if (completed > 0) {
        setLastRunSnapshot({
          options: { ...options },
          fileIdentities: completedIdentities,
        });
      }

      if (completed === 0) {
        setPhase("staged");
        toast({
          message:
            skipped > 0
              ? t("panel.batch.noneTransmuted")
              : t("panel.batch.allFailed"),
          variant: "info",
        });
        return;
      }

      setPhase("staged");
      toast({
        message: t("panel.batch.doneSummary", { done: completed, total: queue.length }),
        variant: "success",
      });
    },
    [
      ready,
      needsElevatedConsent,
      buildQueue,
      resolveItemBytesAsync,
      toast,
      t,
      deviceMemoryGb,
      oversizeConsented,
      riskModeEnabled,
      tool,
      options,
      effectiveOutputExtension,
      encodeSource,
      transmutate,
      commitItems,
    ]
  );

  const handlePanelReset = useCallback(() => {
    cancelRef.current = true;
    setLastRunSnapshot(null);
    setPreparedOptions(null);
    for (const item of itemsRef.current) {
      releaseBatchItemPrepared(item);
    }
    bytesByIdRef.current.clear();
    onReset();
  }, [onReset]);

  const runCachedRedownload = useCallback(async () => {
    if (!ready) {
      toast({ message: t("panel.engineInit"), variant: "info" });
      return;
    }

    const queue = itemsRef.current.filter(
      (item) => item.status === "done" && item.selected
    );
    if (queue.length === 0) {
      toast({ message: t("panel.batch.selectAtLeastOne"), variant: "info" });
      return;
    }

    setPhase("running");
    setRunProgress(null);
    releaseFramePreviewSessions();

    const usedNames = new Set<string>();
    let completed = 0;
    let cacheHits = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setRunProgress({ current: i + 1, total: queue.length, fileName: item.file.name });

      let inputBytes: ArrayBuffer;
      try {
        inputBytes = await item.file.arrayBuffer();
      } catch {
        continue;
      }

      const prepared = minimalBatchPreparedContext(item.sourceMeta);
      const limitContext = computeLimitContext({
        fileSize: item.file.size,
        sourceMeta: item.sourceMeta,
        deviceMemoryGb,
        oversizeConsented: oversizeConsented || riskModeEnabled,
        riskModeEnabled,
        workerReady: ready,
      });

      if (!limitContext.canTransmute) continue;

      const fileProfile = computeResourceProfile(item.file.size, {
        deviceMemory: deviceMemoryGb,
      });
      const meta = buildBatchTransmuteMeta(
        item.file,
        prepared,
        tool,
        options,
        effectiveOutputExtension,
        encodeSource,
        fileProfile,
        limitContext,
        oversizeConsented,
        riskModeEnabled
      );

      try {
        const response = await transmutate(
          tool.module,
          inputBytes,
          options,
          meta,
          effectiveOutputExtension,
          encodeSource
        );

        if (response.ok && response.bytes) {
          if (response.cacheHit) cacheHits++;
          downloadBatchResult(
            response.bytes,
            item.file.name,
            response.mime!,
            response.extension!,
            usedNames
          );
          completed++;
        }
      } catch {
        // Row stays done; user can change options and full re-convert.
      }
    }

    setRunProgress(null);
    setPhase("staged");

    if (completed === 0) {
      toast({ message: t("panel.batch.cacheRedownloadMiss"), variant: "info" });
      return;
    }

    toast({
      message:
        cacheHits === completed
          ? t("panel.batch.cachedDownloadSummary", { count: completed })
          : t("panel.batch.doneSummary", { done: completed, total: queue.length }),
      variant: "success",
    });
  }, [
    ready,
    toast,
    t,
    deviceMemoryGb,
    oversizeConsented,
    riskModeEnabled,
    tool,
    options,
    effectiveOutputExtension,
    encodeSource,
    transmutate,
  ]);

  const handleConvertAgain = useCallback(() => {
    if (!ready) {
      toast({ message: t("panel.engineInit"), variant: "info" });
      return;
    }

    const selectedDone = itemsRef.current.filter(
      (item) => item.status === "done" && item.selected
    );
    if (selectedDone.length === 0) {
      toast({ message: t("panel.batch.selectAtLeastOne"), variant: "info" });
      return;
    }

    const selectedIdentities = selectedDone.map((item) => buildFileIdentity(item.file));
    if (
      canBatchCacheRedownload(lastRunSnapshot, options, selectedIdentities)
    ) {
      void runCachedRedownload();
      return;
    }

    if (isBatchEncodeOnlyTool(tool)) {
      setLastRunSummary(null);
      commitItems((prev) =>
        prev.map((item) => {
          if (item.status === "done" && item.selected) {
            return {
              ...item,
              status: "ready" as const,
              prepared: item.prepared ?? minimalBatchPreparedContext(item.sourceMeta),
              errorMessage: null,
              blockReason: null,
            };
          }
          return item;
        })
      );
      void runTransmute(true);
      return;
    }

    const runId = ++prepareRunIdRef.current;
    for (const item of selectedDone) {
      releaseBatchItemPrepared(item);
    }
    setLastRunSummary(null);
    const reset = itemsRef.current.map((item) => {
      if (item.status === "done" && item.selected) {
        bytesByIdRef.current.delete(item.id);
        return {
          ...item,
          status: "queued" as const,
          prepared: null,
          bytes: null,
          sourceMeta: null,
          errorMessage: null,
          blockReason: null,
        };
      }
      return item;
    });
    commitItems(() => reset);
    startPrepareQueue(reset, runId, options, "inline");
  }, [
    ready,
    startPrepareQueue,
    runCachedRedownload,
    runTransmute,
    options,
    lastRunSnapshot,
    tool,
    toast,
    t,
    commitItems,
  ]);

  const transmutableSelectedCount = useMemo(
    () =>
      items.filter(
        (item) => item.selected && isTransmutableStatus(item, oversizeConsented, riskModeEnabled)
      ).length,
    [items, oversizeConsented, riskModeEnabled]
  );

  const readyCount = useMemo(
    () =>
      items.filter((item) =>
        isTransmutableStatus(item, oversizeConsented, riskModeEnabled)
      ).length,
    [items, oversizeConsented, riskModeEnabled]
  );

  const allDone = useMemo(
    () => items.length > 0 && items.every((item) => item.status === "done"),
    [items]
  );

  const selectedDoneCount = useMemo(
    () => items.filter((item) => item.status === "done" && item.selected).length,
    [items]
  );

  const selectedDoneIdentities = useMemo(
    () =>
      items
        .filter((item) => item.status === "done" && item.selected)
        .map((item) => buildFileIdentity(item.file)),
    [items]
  );

  const cacheRedownloadAvailable = useMemo(
    () =>
      selectedDoneCount > 0 &&
      canBatchCacheRedownload(lastRunSnapshot, options, selectedDoneIdentities),
    [selectedDoneCount, lastRunSnapshot, options, selectedDoneIdentities]
  );

  const isPreparing = useMemo(
    () => items.some((item) => item.status === "queued" || item.status === "preparing"),
    [items]
  );

  const optionsStale = useMemo(
    () => batchOptionsStale(preparedOptions, options),
    [preparedOptions, options]
  );

  const optionLabelKey = primaryBatchOptionLabelKey(tool);
  const preparedOptionValue = preparedOptions
    ? formatPrimaryBatchOptionValue(preparedOptions)
    : "";
  const currentOptionValue = formatPrimaryBatchOptionValue(options);
  const lastRunOptionValue = lastRunSnapshot
    ? formatPrimaryBatchOptionValue(lastRunSnapshot.options)
    : undefined;

  const workspaceBusy = phase === "running" || isPreparing;

  if (!ready) {
    return (
      <div className="transmute-shell min-h-[22rem] p-5 sm:p-6">
        <p className="text-sm text-text-muted">{t("panel.engineInit")}</p>
      </div>
    );
  }

  if (!initialPrepareComplete) {
    const progressPct =
      prepareProgress.total > 0 ? prepareProgress.current / prepareProgress.total : 0;
    return (
      <div className="transmute-shell min-h-[22rem] p-5 sm:p-6">
        <FilePrepareGate
          fileName={prepareProgress.fileName || files[0]?.name || ""}
          fileSize={files[0]?.size ?? 0}
          progress={progressPct}
          phase="reading"
          detailLabel={t("panel.batch.preparing", {
            current: prepareProgress.current || 1,
            total: prepareProgress.total || files.length,
          })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lastRunSummary && (
        <div className="rounded-xl border border-accent/25 bg-accent-subtle/20 px-4 py-3 text-sm text-text-secondary">
          {t("panel.batch.doneSummary", {
            done: lastRunSummary.done,
            total: lastRunSummary.total,
          })}
        </div>
      )}

      {needsElevatedConsent && elevatedSample && (
        <div className="transmute-shell p-5 sm:p-6">
          <OversizeConsentPanel
            fileSize={elevatedSample.file.size}
            sourceMeta={elevatedSample.prepared?.sourceMeta ?? elevatedSample.sourceMeta}
            onConsent={handleBatchOversizeConsent}
          />
          <p className="mt-2 text-xs text-text-muted">
            {t("panel.batch.elevatedBatchBody", {
              count: items.filter((i) => i.status === "needs_consent").length,
            })}
          </p>
        </div>
      )}

      <BatchWorkspace
        tool={tool}
        items={items}
        options={options}
        onOptionsChange={setOptions}
        onToggleItem={handleToggleItem}
        onSelectAll={handleSelectAll}
        onSelectNone={handleSelectNone}
        onTransmuteSelected={() => void runTransmute(true)}
        onTransmuteAllReady={() => void runTransmute(false)}
        onConvertAgain={handleConvertAgain}
        onReset={handlePanelReset}
        running={workspaceBusy}
        runProgress={runProgress}
        prepareProgress={initialPrepareComplete && isPreparing ? prepareProgress : null}
        aggregateWarningBytes={showAggregateWarning ? aggregateBytes : null}
        transmutableSelectedCount={transmutableSelectedCount}
        readyCount={readyCount}
        allDone={allDone}
        cacheRedownloadAvailable={cacheRedownloadAvailable}
        selectedDoneCount={selectedDoneCount}
        isPreparing={isPreparing}
        optionsStale={optionsStale}
        preparedOptionsReady={preparedOptions != null}
        optionLabelKey={optionLabelKey}
        preparedOptionValue={preparedOptionValue}
        currentOptionValue={currentOptionValue}
        lastRunOptionValue={lastRunOptionValue}
      />

      <p className="text-center text-xs text-text-muted">
        {t("panel.engineLabel", { status: ready ? t("panel.engineReady") : t("panel.engineInit") })}
      </p>
    </div>
  );
}
