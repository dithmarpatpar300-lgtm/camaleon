"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ToolDefinition } from "@/lib/tools/types";
import type { OutputExtension, TransmutationOptions } from "@/workers/types";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { useRiskMode } from "@/providers/RiskModeProvider";
import { buildDefaultOptions } from "@/lib/transmutation/build-default-options";
import { releasePreparedContext } from "@/lib/transmutation/prepare/types";
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
import { computeResourceProfile } from "@/lib/device/resource-profile";
import { localizeError } from "@/lib/i18n/errors";
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
  const [phase, setPhase] = useState<BatchPhase>("loading");
  const [options, setOptions] = useState<TransmutationOptions>(() =>
    buildDefaultOptions(tool.optionSpecs, tool)
  );
  const [oversizeConsented, setOversizeConsented] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState({ current: 0, total: files.length, fileName: "" });
  const [runProgress, setRunProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [lastRunSummary, setLastRunSummary] = useState<{ done: number; total: number } | null>(null);

  const cancelRef = useRef(false);
  const prepareRunIdRef = useRef(0);
  const bytesByIdRef = useRef(new Map<string, ArrayBuffer>());
  const itemsRef = useRef(items);
  itemsRef.current = items;

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

  const applyPatch = useCallback((runId: number, id: string, patch: BatchItemPatch) => {
    if (runId !== prepareRunIdRef.current) return;
    if (patch.bytes) bytesByIdRef.current.set(id, patch.bytes);
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const startPrepareQueue = useCallback(
    (seed: BatchItem[], runId: number) => {
      cancelRef.current = false;
      void runBatchPrepareQueue(
        seed,
        tool,
        riskModeEnabled,
        deviceMemoryGb,
        setPrepareProgress,
        (id, patch) => applyPatch(runId, id, patch),
        () => cancelRef.current || runId !== prepareRunIdRef.current,
        { options, estimate }
      ).then(() => {
        if (!cancelRef.current && runId === prepareRunIdRef.current) {
          setPhase("staged");
        }
      });
    },
    [tool, riskModeEnabled, deviceMemoryGb, applyPatch, options, estimate]
  );

  useEffect(() => {
    if (!ready) return;

    const runId = ++prepareRunIdRef.current;
    const seed = batchItemsFromFiles(files);
    bytesByIdRef.current.clear();
    setItems(seed);
    setPhase("loading");
    setLastRunSummary(null);
    startPrepareQueue(seed, runId);

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
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === "ready" ||
        item.status === "needs_consent" ||
        item.status === "done" ||
        item.status === "error"
          ? { ...item, selected: true }
          : item
      )
    );
  }, []);

  const handleSelectNone = useCallback(() => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  }, []);

  const handleBatchOversizeConsent = useCallback(() => {
    setOversizeConsented(true);
    setItems((prev) =>
      prev.map((item) =>
        item.status === "needs_consent"
          ? { ...item, status: "ready" as const, blockReason: null }
          : item
      )
    );
  }, []);

  const buildQueue = useCallback(
    (selectedOnly: boolean) => {
      return itemsRef.current.filter((item) => {
        if (selectedOnly && !item.selected) return false;
        return isTransmutableStatus(item, oversizeConsented, riskModeEnabled);
      });
    },
    [oversizeConsented, riskModeEnabled]
  );

  const resolveItemBytes = useCallback((item: BatchItem): ArrayBuffer | null => {
    if (item.bytes && item.bytes.byteLength > 0) return item.bytes;
    const cached = bytesByIdRef.current.get(item.id);
    if (cached && cached.byteLength > 0) return cached;
    return null;
  }, []);

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

      for (let i = 0; i < queue.length; i++) {
        const live = itemsRef.current.find((row) => row.id === queue[i].id) ?? queue[i];
        const inputBytes = resolveItemBytes(live);
        const prepared = live.prepared;

        if (!inputBytes || !prepared) {
          skipped++;
          setItems((prev) =>
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
        setItems((prev) =>
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
          setItems((prev) =>
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
            releasePreparedContext(prepared);
            bytesByIdRef.current.delete(live.id);
            setItems((prev) =>
              prev.map((row) =>
                row.id === live.id
                  ? {
                      ...row,
                      status: "done",
                      selected: false,
                      prepared: null,
                      bytes: null,
                      errorMessage: null,
                    }
                  : row
              )
            );
          } else {
            const errMsg = !response.ok ? response.error : "transmute_failed";
            setItems((prev) =>
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
          setItems((prev) =>
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
      resolveItemBytes,
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
    ]
  );

  const handlePanelReset = useCallback(() => {
    cancelRef.current = true;
    for (const item of itemsRef.current) {
      releaseBatchItemPrepared(item);
    }
    bytesByIdRef.current.clear();
    onReset();
  }, [onReset]);

  const handleConvertAgain = useCallback(() => {
    if (!ready) {
      toast({ message: t("panel.engineInit"), variant: "info" });
      return;
    }
    const runId = ++prepareRunIdRef.current;
    for (const item of itemsRef.current) {
      releaseBatchItemPrepared(item);
    }
    bytesByIdRef.current.clear();
    setLastRunSummary(null);
    setPhase("loading");
    const reset = itemsRef.current.map((item) => ({
      ...item,
      status: "queued" as const,
      prepared: null,
      bytes: null,
      sourceMeta: null,
      errorMessage: null,
      blockReason: null,
      selected: true,
    }));
    setItems(reset);
    startPrepareQueue(reset, runId);
  }, [ready, startPrepareQueue, toast, t]);

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

  if (phase === "loading" || !ready) {
    return (
      <div className="transmute-shell min-h-[22rem] p-5 sm:p-6">
        <FilePrepareGate
          fileName={prepareProgress.fileName || files[0]?.name || ""}
          fileSize={files[0]?.size ?? 0}
          progress={prepareProgress.total > 0 ? prepareProgress.current / prepareProgress.total : 0}
          phase="reading"
          detailLabel={t("panel.batch.preparing", {
            current: prepareProgress.current || 1,
            total: prepareProgress.total,
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
        running={phase === "running"}
        runProgress={runProgress}
        aggregateWarningBytes={showAggregateWarning ? aggregateBytes : null}
        transmutableSelectedCount={transmutableSelectedCount}
        readyCount={readyCount}
        allDone={allDone}
      />

      <p className="text-center text-xs text-text-muted">
        {t("panel.engineLabel", { status: ready ? t("panel.engineReady") : t("panel.engineInit") })}
      </p>
    </div>
  );
}
