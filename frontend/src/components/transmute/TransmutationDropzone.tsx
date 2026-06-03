"use client";

import { useCallback, useState } from "react";
import type { ToolDefinition } from "@/lib/tools/types";
import { fileMatchesExtensions } from "@/lib/tools/extensions";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import { downloadResult } from "@/lib/transmutation/download";
import { Dropzone } from "./Dropzone";

type TransmutationStatus = "idle" | "processing" | "success" | "error";

type TransmutationDropzoneProps = {
  tool: ToolDefinition;
};

export function TransmutationDropzone({ tool }: TransmutationDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<TransmutationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);

  const { transmutate, ready } = useTransmutationWorker();

  const accept = tool.acceptExtensions.join(",");

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!fileMatchesExtensions(file.name, tool.acceptExtensions)) {
        setStatus("error");
        setErrorMessage(
          `This tool accepts: ${tool.acceptExtensions.join(", ")}`
        );
        return;
      }

      if (!ready) {
        setStatus("error");
        setErrorMessage(
          "Engine is still initializing. Please wait a moment and try again."
        );
        return;
      }

      setStatus("processing");
      setErrorMessage(null);
      setSourceFileName(file.name);

      try {
        const bytes = await file.arrayBuffer();
        const response = await transmutate(tool.module, bytes);

        if (response.ok) {
          downloadResult(
            response.bytes,
            file.name,
            response.mime,
            response.extension
          );
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(response.error);
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      }
    },
    [tool, transmutate, ready]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (status === "processing") return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [status, handleFileSelect]
  );

  return (
    <div>
      <Dropzone
        accept={accept}
        status={status}
        dragging={dragging}
        sourceFileName={sourceFileName}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileSelect={handleFileSelect}
      />

      {status === "success" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-accent-subtle px-4 py-3 text-sm text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          Transmutación completa. File downloaded.
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="mt-4 w-full rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <p className="font-semibold">Transmutation failed</p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      )}

      <p className="mt-4 text-xs text-text-muted">
        Engine: {ready ? "Ready" : "Initializing..."}
      </p>
    </div>
  );
}
