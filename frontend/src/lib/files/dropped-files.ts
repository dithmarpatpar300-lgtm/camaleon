/** Collect all files from an OS drag-and-drop payload (Explorer multi-select safe). */
export function getDroppedFiles(
  dataTransfer: DataTransfer | null | undefined
): File[] {
  if (!dataTransfer) return [];

  const items = dataTransfer.items;
  if (items && items.length > 0) {
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) return files;
  }

  return Array.from(dataTransfer.files);
}
