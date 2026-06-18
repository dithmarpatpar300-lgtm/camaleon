"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useI18n } from "@/providers/I18nProvider";

type DropzoneStatus = "idle" | "processing" | "success" | "error";

type DropzoneProps = {
  accept: string;
  status: DropzoneStatus;
  dragging: boolean;
  sourceFileName: string | null;
  multiple?: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  idleLabel?: string;
  processingLabel?: string;
};

export function Dropzone({
  accept,
  status,
  dragging,
  sourceFileName,
  multiple = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onFilesSelect,
  idleLabel,
  processingLabel,
}: DropzoneProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const disabled = status === "processing";

  const handleClick = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
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
      if (!files || files.length === 0) return;
      if (multiple && onFilesSelect) {
        onFilesSelect(Array.from(files));
      } else {
        onFileSelect(files[0]);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [multiple, onFileSelect, onFilesSelect]
  );

  const idleText = idleLabel ?? t("dropzone.idleLabel");
  const procText = processingLabel ?? t("dropzone.processingLabel");

  return (
    <div className="transmute-shell p-5 sm:p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={t("dropzone.ariaLabel")}
        aria-disabled={disabled}
        data-dragging={dragging ? "true" : "false"}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`transmute-dropzone ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {disabled ? (
          <Spinner label={`${procText} ${sourceFileName ?? ""}`} />
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent-subtle/40">
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
            <span className="max-w-xs text-center text-sm text-text-secondary">
              {dragging ? t("dropzone.dragLabel") : idleText}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
