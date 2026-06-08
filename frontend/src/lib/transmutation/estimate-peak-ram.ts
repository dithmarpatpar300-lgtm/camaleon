/** Peak working-set estimate for oversize consent copy (see adaptive_limits_proposal.md). */
export function estimatePeakRamBytes(
  fileSize: number,
  width?: number,
  height?: number
): number {
  const rasterBytes = width && height ? width * height * 4 : 0;
  return Math.round(fileSize + rasterBytes * 2.2);
}

export function formatPeakRam(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(mb))} MB`;
}
