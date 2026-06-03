"use client";

import { useCallback, useRef, useState } from "react";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import type { TransmutationModule } from "@/workers/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

type TransmutationStatus = "idle" | "processing" | "success" | "error";

const SUPPORTED_EXTENSIONS = /\.(jpg|jpeg|png)$/i;

function detectModule(fileName: string): TransmutationModule | null {
  if (/\.(jpg|jpeg)$/i.test(fileName)) return "transmutador_jpg";
  if (/\.png$/i.test(fileName)) return "transmutador_png";
  return null;
}

function downloadResult(
  bytes: ArrayBuffer,
  baseName: string,
  mime: string,
  extension: string
) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = baseName.replace(SUPPORTED_EXTENSIONS, "") + "." + extension;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<TransmutationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { transmutate, ready } = useTransmutationWorker();

  const handleFile = useCallback(
    async (file: File) => {
      const module = detectModule(file.name);

      if (!module) {
        setStatus("error");
        setErrorMessage("Supported formats: .jpg, .jpeg, .png");
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
        const response = await transmutate(module, bytes);

        if (response.ok) {
          downloadResult(response.bytes, file.name, response.mime, response.extension);
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
    [transmutate, ready]
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
        handleFile(files[0]);
      }
    },
    [status, handleFile]
  );

  const handleClick = useCallback(() => {
    if (status === "processing") return;
    fileInputRef.current?.click();
  }, [status]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFile]
  );

  const handleDropzoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (status === "processing") return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [status]
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-16">
      {/* Hero text */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold text-text-primary">
          Transmutar archivos
        </h1>
        <p className="text-text-secondary">
          Drop an image to convert it — everything happens in your browser.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Dropzone card */}
      <Card className="w-full">
        <CardBody>
          <div
            role="button"
            tabIndex={status === "processing" ? -1 : 0}
            aria-label="Select an image file to transmute"
            aria-disabled={status === "processing"}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            onKeyDown={handleDropzoneKeyDown}
            className={`flex h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
              status === "processing"
                ? "border-border bg-bg-base cursor-not-allowed"
                : dragging
                  ? "border-accent bg-accent-subtle"
                  : "border-border bg-bg-base hover:border-text-muted"
            }`}
          >
            {status === "processing" ? (
              <Spinner label={`Transmuting ${sourceFileName ?? ""}`} />
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-8 w-8 text-text-muted"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm text-text-muted">
                  {dragging
                    ? "Release to transmute"
                    : "Drag & drop an image here, or click to select"}
                </span>
                <span className="text-xs text-text-muted">
                  <code className="font-mono text-accent">.jpg</code>{" "}
                  <code className="font-mono text-accent">.jpeg</code>{" "}
                  <code className="font-mono text-accent">.png</code>
                </span>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Status messages */}
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

      {/* Engine status */}
      <p className="mt-6 text-xs text-text-muted">
        Engine: {ready ? "Ready" : "Initializing..."}
      </p>

      {/* Format badges */}
      <div className="mt-6 flex items-center gap-2">
        <Badge variant="lossless">PNG — Sin perdida</Badge>
        <Badge variant="lossy">JPEG — Comprimido</Badge>
      </div>
    </div>
  );
}
