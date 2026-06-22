"use client";

import { useEffect } from "react";
import { useI18n } from "@/providers/I18nProvider";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error("Camaleon route error:", error);
  }, [error]);

  const msg = error?.message ?? String(error ?? "Unknown error");
  const isChunkError =
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch");

  if (isChunkError) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold text-text-primary">
          {t("offline.chunkMissTitle")}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("offline.chunkMissBody")}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-border bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary hover:border-accent/30"
          >
            {t("offline.chunkMissRetry")}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary hover:border-accent/30"
          >
            {t("offline.chunkMissHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-text-primary">
        {t("offline.chunkMissTitle")}
      </h1>
      <p className="text-sm text-text-secondary">
        {t("offline.genericErrorBody")}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-border bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary hover:border-accent/30"
      >
        {t("offline.chunkMissRetry")}
      </button>
    </div>
  );
}
