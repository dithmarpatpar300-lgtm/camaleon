import { formatBytes } from "@/lib/format/bytes";
import { formatSourceImageMetaLine } from "@/lib/format/source-image-meta";
import type { SourceImageMeta } from "@/lib/format/source-image-meta";

/** `{size} | {width} × {height} · {depth}` — batch row secondary line. */
export function formatBatchFileDetailsLine(
  fileSize: number,
  sourceMeta: SourceImageMeta | null
): string {
  const sizeLabel = formatBytes(fileSize);
  if (!sourceMeta) return sizeLabel;
  return `${sizeLabel} | ${formatSourceImageMetaLine(sourceMeta)}`;
}
