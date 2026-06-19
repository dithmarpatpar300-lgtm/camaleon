"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { formatBytes } from "@/lib/format/bytes";
import {
  markPendingHandoffNavigation,
  stageFileHandoffFromFile,
} from "@/lib/transmutation/file-handoff";
import {
  markPendingBatchHandoffNavigation,
  stageBatchHandoffFromFiles,
} from "@/lib/batch/batch-handoff";
import type { ToolDefinition } from "@/lib/tools/types";
import type { InputCohort } from "@/lib/tools/universal-matrix";
import {
  batchOutputToolsForCohort,
  resolveUniversalDrop,
} from "@/lib/universal/universal-drop";
import {
  buildAcceptAttribute,
  getAllSupportedInputExtensions,
  getToolsForFileName,
  sortToolsForOutputPicker,
} from "@/lib/tools/universal-matrix";
import { cn } from "@/lib/utils";
import { UniversalOutputPicker } from "./UniversalOutputPicker";
import { UniversalCohortSummary } from "./UniversalCohortSummary";

type Phase = "idle" | "pick" | "redirecting";

export function UniversalTransmutator() {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const deviceMemoryGb =
    typeof navigator !== "undefined"
      ? (navigator as { deviceMemory?: number }).deviceMemory
      : undefined;

  const [phase, setPhase] = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [cohort, setCohort] = useState<InputCohort | null>(null);
  const [isBatchDrop, setIsBatchDrop] = useState(false);
  const [unsupportedName, setUnsupportedName] = useState<string | null>(null);

  const acceptAttr = useMemo(() => buildAcceptAttribute(), []);
  const supportedHint = useMemo(
    () => getAllSupportedInputExtensions().join(", "),
    []
  );

  const matchingTools = useMemo(() => {
    if (!cohort) return [];
    if (isBatchDrop) return batchOutputToolsForCohort(cohort);
    const file = cohort.files[0];
    return sortToolsForOutputPicker(getToolsForFileName(file.name));
  }, [cohort, isBatchDrop]);

  const totalBytes = useMemo(
    () => (cohort ? cohort.files.reduce((sum, f) => sum + f.size, 0) : 0),
    [cohort]
  );

  const inputFormat = useMemo(() => {
    if (!cohort || cohort.files.length === 0) return null;
    return cohort.familyLabel;
  }, [cohort]);

  const reset = useCallback(() => {
    setPhase("idle");
    setCohort(null);
    setIsBatchDrop(false);
    setUnsupportedName(null);
    setDragging(false);
    dragCounterRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const redirectSingleWithTool = useCallback(
    async (targetFile: File, tool: ToolDefinition) => {
      setPhase("redirecting");
      try {
        const id = await stageFileHandoffFromFile(targetFile);
        markPendingHandoffNavigation(id);
        router.push(`/transmute/${tool.slug}?handoff=${encodeURIComponent(id)}`);
      } catch {
        setPhase("pick");
        toast({ message: t("landing.universal.handoffFailed"), variant: "info" });
      }
    },
    [router, t, toast]
  );

  const redirectBatchWithTool = useCallback(
    async (files: File[], tool: ToolDefinition) => {
      setPhase("redirecting");
      try {
        const id = await stageBatchHandoffFromFiles(files, tool.slug, deviceMemoryGb);
        markPendingBatchHandoffNavigation(id);
        router.push(`/transmute/${tool.slug}?batch=${encodeURIComponent(id)}`);
      } catch {
        setPhase("pick");
        toast({ message: t("landing.universal.handoffFailed"), variant: "info" });
      }
    },
    [router, t, toast, deviceMemoryGb]
  );

  const beginPickPhase = useCallback((nextCohort: InputCohort, batch: boolean) => {
    setUnsupportedName(null);
    setCohort(nextCohort);
    setIsBatchDrop(batch);
    setPhase("pick");
  }, []);

  const stageSingleFile = useCallback(
    (nextCohort: InputCohort) => {
      const file = nextCohort.files[0];
      const tools = getToolsForFileName(file.name);
      if (tools.length === 1) {
        setCohort(nextCohort);
        setIsBatchDrop(false);
        void redirectSingleWithTool(file, tools[0]);
        return;
      }
      beginPickPhase(nextCohort, false);
    },
    [beginPickPhase, redirectSingleWithTool]
  );

  const stageBatchCohort = useCallback(
    (nextCohort: InputCohort) => {
      const tools = batchOutputToolsForCohort(nextCohort);
      if (tools.length === 0) {
        reset();
        toast({
          message: t("landing.universal.batch.noBatchRoute", {
            format: nextCohort.familyLabel,
          }),
          variant: "info",
        });
        return;
      }
      if (tools.length === 1) {
        setCohort(nextCohort);
        setIsBatchDrop(true);
        void redirectBatchWithTool(nextCohort.files, tools[0]);
        return;
      }
      beginPickPhase(nextCohort, true);
    },
    [beginPickPhase, redirectBatchWithTool, reset, t, toast]
  );

  const notifyUnsupportedSkipped = useCallback(
    (unsupported: File[]) => {
      if (unsupported.length === 0) return;
      toast({
        message: t("landing.universal.batch.unsupportedSkipped", {
          count: unsupported.length,
          names: unsupported.map((f) => f.name).join(", "),
        }),
        variant: "info",
      });
    },
    [t, toast]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const resolution = resolveUniversalDrop(Array.from(files), deviceMemoryGb);

      if (resolution.kind === "empty") return;

      if (resolution.kind === "single" || resolution.kind === "batch") {
        if (resolution.capped) {
          toast({
            message: t("landing.universal.batch.capped"),
            variant: "info",
          });
        }
      }

      if (resolution.kind === "unsupported") {
        setCohort(null);
        setPhase("idle");
        setUnsupportedName(resolution.names[0] ?? "");
        return;
      }

      if (resolution.kind === "mixed_cohorts") {
        toast({
          message: t("landing.universal.batch.mixedFormats", {
            count: resolution.cohortCount,
          }),
          variant: "info",
        });
        return;
      }

      notifyUnsupportedSkipped(resolution.unsupported);

      if (resolution.kind === "single") {
        stageSingleFile(resolution.cohort);
        return;
      }

      stageBatchCohort(resolution.cohort);
    },
    [
      deviceMemoryGb,
      notifyUnsupportedSkipped,
      stageBatchCohort,
      stageSingleFile,
      t,
      toast,
    ]
  );

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (phase === "redirecting") return;
      dragCounterRef.current += 1;
      setDragging(true);
    },
    [phase]
  );

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragging(false);
      if (phase === "redirecting") return;
      handleFiles(e.dataTransfer?.files ?? null);
    },
    [handleFiles, phase]
  );

  const onBrowseClick = useCallback(() => {
    if (phase === "redirecting") return;
    fileInputRef.current?.click();
  }, [phase]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const onOutputSelect = useCallback(
    (tool: ToolDefinition) => {
      if (!cohort) return;
      if (isBatchDrop) {
        void redirectBatchWithTool(cohort.files, tool);
        return;
      }
      void redirectSingleWithTool(cohort.files[0], tool);
    },
    [cohort, isBatchDrop, redirectBatchWithTool, redirectSingleWithTool]
  );

  const showDropzone = phase === "idle" || !cohort;

  return (
    <section
      id="universal-transmutator"
      className="scroll-mt-28 pb-12 pt-2"
      aria-labelledby="universal-transmutator-heading"
    >
      <div className="universal-transmutator">
        <header className="universal-transmutator__header">
          <span className="universal-transmutator__badge">{t("landing.universal.badge")}</span>
          <h2
            id="universal-transmutator-heading"
            className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl"
          >
            {t("landing.universal.title")}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted">
            {t("landing.universal.subtitle")}
          </p>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          multiple
          onChange={onInputChange}
          className="hidden"
        />

        {unsupportedName && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-error/25 bg-error/5 px-3.5 py-3 text-xs leading-relaxed text-text-secondary"
          >
            <p>{t("landing.universal.unsupported", { name: unsupportedName })}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-2 font-medium text-accent hover:underline"
            >
              {t("landing.universal.tryAgain")}
            </button>
          </div>
        )}

        {showDropzone && !unsupportedName && (
          <div
            role="button"
            tabIndex={0}
            aria-label={t("landing.universal.dropAria")}
            data-dragging={dragging ? "true" : "false"}
            className={cn("universal-dropzone mt-4", phase === "redirecting" && "opacity-60")}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={onBrowseClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onBrowseClick();
              }
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent-subtle/40 shadow-[0_8px_24px_rgba(34,197,94,0.12)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-6 w-6 text-accent"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-text-primary">
              {dragging ? t("landing.universal.dragLabel") : t("landing.universal.dropLabel")}
            </p>
            <p className="text-xs text-text-muted">{t("landing.universal.browseHint")}</p>
            <p className="text-xs text-text-muted/80">{t("landing.universal.batch.dropHint")}</p>
          </div>
        )}

        {cohort && phase !== "idle" && (
          <div className="mt-4 space-y-4">
            {isBatchDrop ? (
              <UniversalCohortSummary
                formatLabel={inputFormat ?? ""}
                files={cohort.files}
                totalBytes={totalBytes}
                onChangeFiles={reset}
                changeDisabled={phase !== "pick"}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/70 bg-bg-elevated/40 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {cohort.files[0].name}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {inputFormat && (
                      <span className="font-mono uppercase tracking-wide text-text-secondary">
                        {inputFormat}
                      </span>
                    )}
                    {inputFormat && " · "}
                    {formatBytes(cohort.files[0].size)}
                  </p>
                </div>
                {phase === "pick" && (
                  <button
                    type="button"
                    onClick={reset}
                    className="shrink-0 text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
                  >
                    {t("landing.universal.changeFile")}
                  </button>
                )}
              </div>
            )}

            {phase === "pick" && (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
                  {isBatchDrop
                    ? t("landing.universal.batch.pickOutput", {
                        count: String(matchingTools.length),
                      })
                    : t("landing.universal.pickOutput", {
                        count: String(matchingTools.length),
                      })}
                </p>
                <UniversalOutputPicker tools={matchingTools} onSelect={onOutputSelect} />
              </>
            )}

            {phase === "redirecting" && (
              <p className="text-center text-xs text-text-muted">
                {t("landing.universal.redirecting")}
              </p>
            )}
          </div>
        )}

        {phase === "idle" && !unsupportedName && (
          <p className="mt-3 text-[11px] leading-relaxed text-text-muted/80">
            {t("landing.universal.formatsHint", { formats: supportedHint })}
          </p>
        )}
      </div>
    </section>
  );
}
