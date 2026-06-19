import { zipSync } from "fflate";
import type { BatchItem } from "./batch-types";

export type ZipEntry = {
  name: string;
  bytes: Uint8Array;
};

export function batchItemsToZipEntries(items: BatchItem[]): ZipEntry[] {
  const usedNames = new Set<string>();
  const entries: ZipEntry[] = [];

  for (const item of items) {
    if (!item.result) continue;
    const stem = item.file.name.replace(/\.[^.]+$/, "");
    let name = `${stem}.${item.result.extension}`;
    if (usedNames.has(name)) {
      let n = 2;
      while (usedNames.has(`${stem} (${n}).${item.result.extension}`)) n++;
      name = `${stem} (${n}).${item.result.extension}`;
    }
    usedNames.add(name);
    entries.push({
      name,
      bytes: new Uint8Array(item.result.bytes),
    });
  }

  return entries;
}

export function buildBatchZipBlob(items: BatchItem[]): Blob | null {
  const entries = batchItemsToZipEntries(items);
  if (entries.length === 0) return null;

  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    files[entry.name] = entry.bytes;
  }

  const zipped = zipSync(files);
  return new Blob([zipped], { type: "application/zip" });
}

export function downloadBatchZip(items: BatchItem[], zipBaseName = "camaleon-batch"): void {
  const blob = buildBatchZipBlob(items);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${zipBaseName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
