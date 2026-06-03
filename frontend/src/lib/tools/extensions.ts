/** Returns true if the file name ends with one of the accepted extensions (case-insensitive). */
export function fileMatchesExtensions(
  fileName: string,
  acceptExtensions: string[]
): boolean {
  const lower = fileName.toLowerCase();
  return acceptExtensions.some((ext) => lower.endsWith(ext.toLowerCase()));
}
