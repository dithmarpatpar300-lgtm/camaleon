"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

type DropzoneStatus = "idle" | "processing" | "success" | "error";

type DropzoneProps = {
  accept: string;
  status: DropzoneStatus;
  dragging: boolean;
  sourceFileName: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
  idleLabel?: string;
  processingLabel?: string;
};

export function Dropzone({
  accept,
  status,
  dragging,
  sourceFileName,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  idleLabel = "Drag & drop an image here, or click to select",
  processingLabel = "Transmuting...",
}: DropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const disabled = status === "processing";

  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [disabled]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onFileSelect]
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />
      <Card className="w-full">
        <CardBody>
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="Select an image file to transmute"
            aria-disabled={disabled}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`flex h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
              disabled
                ? "border-border bg-bg-base cursor-not-allowed"
                : dragging
                  ? "border-accent bg-accent-subtle"
                  : "border-border bg-bg-base hover:border-text-muted"
            }`}
          >
            {disabled ? (
              <Spinner
                label={`${processingLabel} ${sourceFileName ?? ""}`}
              />
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
                  {dragging ? "Release to transmute" : idleLabel}
                </span>
              </>
            )}
          </div>
        </CardBody>
      </Card>
    </>
  );
}
