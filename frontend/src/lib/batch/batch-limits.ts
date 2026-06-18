const MAX_BATCH_DESKTOP = 50;
const MAX_BATCH_MOBILE = 20;
const MOBILE_RAM_GB = 4;

/** Cap file count for a batch drop. */
export function maxFilesPerBatch(deviceMemoryGb?: number): number {
  if (deviceMemoryGb != null && deviceMemoryGb <= MOBILE_RAM_GB) {
    return MAX_BATCH_MOBILE;
  }
  return MAX_BATCH_DESKTOP;
}

export function capBatchFiles(files: File[], deviceMemoryGb?: number): File[] {
  const max = maxFilesPerBatch(deviceMemoryGb);
  if (files.length <= max) return files;
  return files.slice(0, max);
}

export function sumFileBytes(files: File[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}

/** Soft warning threshold for aggregate size copy (not a hard block in 3.6.0). */
export function shouldWarnAggregateBytes(totalBytes: number, deviceMemoryGb?: number): boolean {
  const mobile = deviceMemoryGb != null && deviceMemoryGb <= MOBILE_RAM_GB;
  return mobile ? totalBytes > 150 * 1024 * 1024 : totalBytes > 300 * 1024 * 1024;
}
