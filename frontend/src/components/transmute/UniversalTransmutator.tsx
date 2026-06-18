"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { formatBytes } from "@/lib/format/bytes";
import { stageFileHandoff } from "@/lib/transmutation/file-handoff";
import type { ToolDefinition } from "@/lib/tools/types";
import {
  buildAcceptAttribute,
  getAllSupportedInputExtensions,
  getToolsForFileName,
  resolveInputFormatLabel,
  sortToolsForOutputPicker,
} from "@/lib/tools/universal-matrix";
import { cn } from "@/lib/utils";
import { UniversalOutputPicker } from "./UniversalOutputPicker";

type Phase = "idle" | "pick" | "redirecting";

export function UniversalTransmutator() {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [unsupportedName, setUnsupportedName] = useState<string | null>(null);

  const acceptAttr = useMemo(() => buildAcceptAttribute(), []);
  const supportedHint = useMemo(
    () => getAllSupportedInputExtensions().join(", "),
    []
  );

  const matchingTools = useMemo(
    () => (file ? sortToolsForOutputPicker(getToolsForFileName(file.name)) : []),
    [file]
  );

  const inputFormat = useMemo(
    () => (file ? resolveInputFormatLabel(file.name, matchingTools) : null),
    [file, matchingTools]
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setFile(null);
    setUnsupportedName(null);
    setDragging(false);
    dragCounterRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const redirectWithTool = useCallback(
    (targetFile: File, tool: ToolDefinition) => {
      setPhase("redirecting");
      const id = stageFileHandoff(targetFile);
      router.push(`/transmute/${tool.slug}?handoff=${encodeURIComponent(id)}`);
    },
    [router]
  );

  const stageFile = useCallback(
    (next: File) => {
      setUnsupportedName(null);
      const tools = getToolsForFileName(next.name);
      if (tools.length === 0) {
        setFile(null);
        setPhase("idle");
        setUnsupportedName(next.name);
        return;
      }

      setFile(next);
      if (tools.length === 1) {
        redirectWithTool(next, tools[0]);
        return;
      }
      setPhase("pick");
    },
    [redirectWithTool]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (files.length > 1) {
        toast({ message: t("landing.universal.oneFileOnly"), variant: "info" });
      }
      stageFile(files[0]);
    },
    [stageFile, t, toast]
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
      if (!file) return;
      redirectWithTool(file, tool);
    },
    [file, redirectWithTool]
  );

  const showDropzone = phase === "idle" || !file;

  return (
    <section
      id="universal-transmutator"
      className="scroll-mt-28 pb-10"
      aria-labelledby="universal-transmutator-heading"
    >
      <div className="universal-transmutator">
        <header className="universal-transmutator__header">
          <h2
            id="universal-transmutator-heading"
            className="text-sm font-semibold tracking-tight text-text-primary"
          >
            {t("landing.universal.title")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            {t("landing.universal.subtitle")}
          </p>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent-subtle/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-5 w-5 text-accent"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">
              {dragging ? t("landing.universal.dragLabel") : t("landing.universal.dropLabel")}
            </p>
            <p className="text-xs text-text-muted">{t("landing.universal.browseHint")}</p>
          </div>
        )}

        {file && phase !== "idle" && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/70 bg-bg-elevated/40 px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{file.name}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {inputFormat && (
                    <span className="font-mono uppercase tracking-wide text-text-secondary">
                      {inputFormat}
                    </span>
                  )}
                  {inputFormat && " · "}
                  {formatBytes(file.size)}
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

            {phase === "pick" && (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
                  {t("landing.universal.pickOutput", { count: String(matchingTools.length) })}
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
