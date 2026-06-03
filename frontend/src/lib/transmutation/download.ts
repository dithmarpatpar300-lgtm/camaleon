export function downloadResult(
  bytes: ArrayBuffer,
  baseName: string,
  mime: string,
  extension: string
) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = baseName.replace(/\.[^.]+$/, "") + "." + extension;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
