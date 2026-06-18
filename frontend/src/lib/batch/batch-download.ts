import { downloadResult } from "@/lib/transmutation/download";

export function downloadBatchResult(
  bytes: ArrayBuffer,
  baseName: string,
  mime: string,
  extension: string,
  usedNames: Set<string>
): void {
  const stem = baseName.replace(/\.[^.]+$/, "");
  let candidate = `${stem}.${extension}`;
  if (!usedNames.has(candidate)) {
    usedNames.add(candidate);
    downloadResult(bytes, baseName, mime, extension);
    return;
  }

  let n = 2;
  while (usedNames.has(`${stem} (${n}).${extension}`)) {
    n++;
  }
  const deduped = `${stem} (${n}).${extension}`;
  usedNames.add(deduped);

  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = deduped;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
