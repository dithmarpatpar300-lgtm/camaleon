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
import { mergeBatchItemOptions } from "@/lib/batch/batch-per-row-options";
import { getBatchDownloadMode } from "@/lib/prefs/batch-universal-prefs";
import { downloadBatchZip } from "@/lib/batch/batch-zip-export";
import {
  canBatchCacheRedownload,
  type BatchLastRunSnapshot,
} from "@/lib/batch/batch-last-run";
import { batchItemsHaveStoredResults } from "@/lib/batch/batch-stored-delivery";
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
import { RiskUnlockProceedPanel } from "./RiskUnlockProceedPanel";

type BatchTransmutationPanelProps = {
  tool: ToolDefinition;
  files: File[];
  onReset: () => void;
  /** True when batch was staged from home universal handoff — cancel returns to `/`. */
  batchFromHandoff?: boolean;
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

export function BatchTransmutationPanel({
  tool,
  files,
  onReset,
  batchFromHandoff = false,
}: BatchTransmutationPanelProps) {
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
  const [riskUnlockAwaitingConfirm, setRiskUnlockAwaitingConfirm] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState({ current: 0, total: files.length, fileName: "" });
  const [runProgress, setRunProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [lastRunSummary, setLastRunSummary] = useState<{ done: number; total: number } | null>(null);
  const [lastRunSnapshot, setLastRunSnapshot] = useState<BatchLastRunSnapshot | null>(null);

  const cancelRef = useRef(false);
  const prepareRunIdRef = useRef(0);
  const prevRiskModeRef = useRef(riskModeEnabled);
  /** Bumps to cancel in-flight transmute / redownload loops (navigation, reset, supersede). */
  const activeRunIdRef = useRef(0);
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
      activeRunIdRef.current += 1;
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

  const handleItemOptionsChange = useCallback(
    (id: string, next: import("@/workers/types").TransmutationOptions) => {
      commitItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                itemOptions: next,
                result: item.status === "done" ? null : item.result,
                status: item.status === "done" ? ("ready" as const) : item.status,
              }
            : item
        )
      );
    },
    [commitItems]
  );

  const deliverBatchOutputs = useCallback(
    (
      completedItems: BatchItem[],
      usedNames: Set<string>
    ): void => {
      const mode = getBatchDownloadMode();
      if (mode === "zip" && completedItems.length >= 2) {
        downloadBatchZip(completedItems, `camaleon-${tool.slug}`);
        toast({
          message: t("panel.batch.zipDone", { count: completedItems.length }),
          variant: "success",
        });
        return;
      }

      for (const item of completedItems) {
        if (!item.result) continue;
        downloadBatchResult(
          item.result.bytes,
          item.file.name,
          item.result.mime,
          item.result.extension,
          usedNames
        );
      }
    },
    [t, toast, tool.slug]
  );

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

  const blockedHardFileCount = useMemo(
    () =>
      items.filter((item) => item.status === "blocked" && item.blockReason === "hard_file")
        .length,
    [items]
  );

  useEffect(() => {
    const wasRisk = prevRiskModeRef.current;
    const riskJustEnabled = !wasRisk && riskModeEnabled;
    const riskJustDisabled = wasRisk && !riskModeEnabled;
    prevRiskModeRef.current = riskModeEnabled;

    if (riskJustDisabled) {
      setRiskUnlockAwaitingConfirm(false);
      return;
    }

    if (!riskJustEnabled || !initialPrepareComplete) return;

    const blockedHard = itemsRef.current.filter(
      (item) => item.status === "blocked" && item.blockReason === "hard_file"
    );
    const needsConsent = itemsRef.current.some((item) => item.status === "needs_consent");

    if (blockedHard.length > 0) {
      setRiskUnlockAwaitingConfirm(true);
      return;
    }

    if (needsConsent && !oversizeConsented) {
      setRiskUnlockAwaitingConfirm(true);
    }
  }, [riskModeEnabled, initialPrepareComplete, oversizeConsented]);

  const handleRiskUnlockContinue = useCallback(() => {
    setRiskUnlockAwaitingConfirm(false);

    const blockedHard = itemsRef.current.filter(
      (item) => item.status === "blocked" && item.blockReason === "hard_file"
    );
    if (blockedHard.length === 0) return;

    for (const item of blockedHard) {
      releaseBatchItemPrepared(item);
    }

    const runId = ++prepareRunIdRef.current;
    const requeued = itemsRef.current.map((item) =>
      item.status === "blocked" && item.blockReason === "hard_file"
        ? {
            ...item,
            status: "queued" as const,
            blockReason: null,
            prepared: null,
            bytes: null,
            sourceMeta: null,
            errorMessage: null,
          }
        : item
    );
    commitItems(() => requeued);
    startPrepareQueue(
      requeued.filter((item) => item.status === "queued"),
      runId,
      options,
      "inline"
    );
  }, [commitItems, startPrepareQueue, options]);

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

  const runStoredResultDelivery = useCallback(
    async (queue: BatchItem[]) => {
      if (queue.length === 0) return;

      const runId = ++activeRunIdRef.current;
      setPhase("running");
      setRunProgress({
        current: queue.length,
        total: queue.length,
        fileName: queue[queue.length - 1]?.file.name ?? "",
      });

      await Promise.resolve();
      if (activeRunIdRef.current !== runId) return;

      const usedNames = new Set<string>();
      deliverBatchOutputs(queue, usedNames);

      if (activeRunIdRef.current !== runId) return;

      setRunProgress(null);
      setPhase("staged");
      toast({
        message:
          getBatchDownloadMode() === "zip" && queue.length >= 2
            ? t("panel.batch.cachedDownloadSummaryZip", { count: queue.length })
            : t("panel.batch.cachedDownloadSummary", { count: queue.length }),
        variant: "success",
      });
    },
    [deliverBatchOutputs, t, toast]
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

      const runId = ++activeRunIdRef.current;
      setPhase("running");
      setRunProgress(null);
      setLastRunSummary(null);
      releaseFramePreviewSessions();

      const usedNames = new Set<string>();
      let completed = 0;
      let skipped = 0;
      let cacheHits = 0;
      const completedIdentities: string[] = [];
      const completedItems: BatchItem[] = [];

      for (let i = 0; i < queue.length; i++) {
        if (activeRunIdRef.current !== runId) return;

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
          mergeBatchItemOptions(options, live.itemOptions),
          effectiveOutputExtension,
          encodeSource,
          fileProfile,
          limitContext,
          oversizeConsented,
          riskModeEnabled
        );

        try {
          const itemOptions = mergeBatchItemOptions(options, live.itemOptions);
          const response = await transmutate(
            tool.module,
            inputBytes,
            itemOptions,
            meta,
            effectiveOutputExtension,
            encodeSource
          );

          if (activeRunIdRef.current !== runId) return;

          if (response.ok && response.bytes) {
            if (response.cacheHit) cacheHits++;
            completed++;
            completedIdentities.push(buildFileIdentity(live.file));
            const doneItem: BatchItem = {
              ...live,
              status: "done",
              selected: false,
              errorMessage: null,
              result: {
                bytes: response.bytes!,
                mime: response.mime!,
                extension: response.extension!,
              },
            };
            completedItems.push(doneItem);
            commitItems((prev) =>
              prev.map((row) => (row.id === live.id ? doneItem : row))
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
          if (activeRunIdRef.current !== runId) return;
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

      if (activeRunIdRef.current !== runId) return;

      setRunProgress(null);
      setLastRunSummary({ done: completed, total: queue.length });

      if (completed > 0) {
        deliverBatchOutputs(completedItems, usedNames);
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
      const allCached = cacheHits === completed;
      const zipMode = getBatchDownloadMode() === "zip" && completed >= 2;
      toast({
        message: allCached
          ? zipMode
            ? t("panel.batch.cachedDownloadSummaryZip", { count: completed })
            : t("panel.batch.cachedDownloadSummary", { count: completed })
          : t("panel.batch.doneSummary", { done: completed, total: queue.length }),
        variant: "success",
      });
    },
    [
      ready,
      needsElevatedConsent,
      buildQueue,
      resolveItemBytesAsync,
      deliverBatchOutputs,
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
    activeRunIdRef.current += 1;
    setRunProgress(null);
    setPhase("staged");
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

    const runId = ++activeRunIdRef.current;
    setPhase("running");
    setRunProgress(null);
    releaseFramePreviewSessions();

    const usedNames = new Set<string>();
    let completed = 0;
    let cacheHits = 0;
    const completedItems: BatchItem[] = [];

    for (let i = 0; i < queue.length; i++) {
      if (activeRunIdRef.current !== runId) return;

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
        mergeBatchItemOptions(options, item.itemOptions),
        effectiveOutputExtension,
        encodeSource,
        fileProfile,
        limitContext,
        oversizeConsented,
        riskModeEnabled
      );

      try {
        const itemOptions = mergeBatchItemOptions(options, item.itemOptions);
        const response = await transmutate(
          tool.module,
          inputBytes,
          itemOptions,
          meta,
          effectiveOutputExtension,
          encodeSource
        );

        if (activeRunIdRef.current !== runId) return;

        if (response.ok && response.bytes) {
          if (response.cacheHit) cacheHits++;
          const doneItem: BatchItem = {
            ...item,
            result: {
              bytes: response.bytes,
              mime: response.mime!,
              extension: response.extension!,
            },
          };
          completedItems.push(doneItem);
          completed++;
        }
      } catch {
        if (activeRunIdRef.current !== runId) return;
        // Row stays done; user can change options and full re-convert.
      }
    }

    if (activeRunIdRef.current !== runId) return;

    setRunProgress(null);
    setPhase("staged");

    if (completed === 0) {
      toast({ message: t("panel.batch.cacheRedownloadMiss"), variant: "info" });
      return;
    }

    deliverBatchOutputs(completedItems, usedNames);

    toast({
      message:
        cacheHits === completed
          ? getBatchDownloadMode() === "zip" && completed >= 2
            ? t("panel.batch.cachedDownloadSummaryZip", { count: completed })
            : t("panel.batch.cachedDownloadSummary", { count: completed })
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
    deliverBatchOutputs,
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
    if (canBatchCacheRedownload(lastRunSnapshot, options, selectedIdentities)) {
      if (batchItemsHaveStoredResults(selectedDone)) {
        void runStoredResultDelivery(selectedDone);
        return;
      }
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
    runStoredResultDelivery,
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

  const prepareCacheReady = preparedOptions != null && !optionsStale;

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

      {needsElevatedConsent && elevatedSample && !riskUnlockAwaitingConfirm && (
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

      {riskUnlockAwaitingConfirm && (
        <RiskUnlockProceedPanel
          fileName={
            items.find((item) => item.status === "blocked" && item.blockReason === "hard_file")
              ?.file.name ??
            elevatedSample?.file.name ??
            files[0]?.name ??
            ""
          }
          fileSize={
            items.find((item) => item.status === "blocked" && item.blockReason === "hard_file")
              ?.file.size ??
            elevatedSample?.file.size ??
            files[0]?.size ??
            0
          }
          fileCount={blockedHardFileCount > 1 ? blockedHardFileCount : undefined}
          onContinue={handleRiskUnlockContinue}
          onStartOver={handlePanelReset}
        />
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
        onItemOptionsChange={handleItemOptionsChange}
        batchFromHandoff={batchFromHandoff}
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
        prepareCacheReady={prepareCacheReady}
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
