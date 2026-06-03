"use client";

import { useCallback, useRef, useState } from "react";
import { useTransmutationWorker } from "@/hooks/useTransmutationWorker";
import type { TransmutationModule } from "@/workers/types";

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8">
      <h1 className="mb-2 text-4xl font-bold text-zinc-50">Camaleon</h1>
      <p className="mb-8 text-zinc-400">
        Drop a{" "}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm font-mono text-emerald-400">
          .jpg
        </code>
        ,{" "}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm font-mono text-emerald-400">
          .jpeg
        </code>
        , or{" "}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm font-mono text-emerald-400">
          .png
        </code>{" "}
        file to transmute it
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`flex h-64 w-full max-w-xl cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
          status === "processing"
            ? "border-zinc-600 bg-zinc-900 cursor-not-allowed"
            : dragging
              ? "border-emerald-400 bg-emerald-400/10"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
        }`}
      >
        <span className="text-zinc-500">
          {status === "processing" ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5 animate-spin text-emerald-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Transmuting{sourceFileName ? ` ${sourceFileName}` : ""}...
            </span>
          ) : dragging ? (
            "Release to transmute"
          ) : (
            "Drag & drop an image here, or click to select"
          )}
        </span>
      </div>

      {status === "success" && (
        <p className="mt-6 rounded-lg bg-emerald-400/10 px-4 py-2 text-emerald-400">
          Transmutation complete. File downloaded.
        </p>
      )}

      {status === "error" && errorMessage && (
        <div className="mt-6 w-full max-w-xl rounded-lg bg-red-400/10 px-4 py-3 text-red-400">
          <p className="font-semibold">Transmutation failed</p>
          <p className="mt-1 text-sm">{errorMessage}</p>
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-600">
        Engine: {ready ? "Ready" : "Initializing..."}
      </p>
    </main>
  );
}
