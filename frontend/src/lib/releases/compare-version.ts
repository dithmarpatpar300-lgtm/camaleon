/** Compare semver strings (major.minor.patch). Returns positive if a > b. */
export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function isVersionNewer(current: string, lastSeen: string | null): boolean {
  if (!lastSeen) return true;
  return compareSemver(current, lastSeen) > 0;
}
