"use client";

import type { SourceImageMeta } from "@/lib/format/source-image-meta";
import { formatSourceImageMetaLine } from "@/lib/format/source-image-meta";

type SourceImageMetaLineProps = {
  meta: SourceImageMeta | null;
};

/** Displays `{width} × {height} · {depth}` (and frame count for GIF) under file size. */
export function SourceImageMetaLine({ meta }: SourceImageMetaLineProps) {
  if (!meta) return null;
  return (
    <p className="text-xs text-text-muted">{formatSourceImageMetaLine(meta)}</p>
  );
}
