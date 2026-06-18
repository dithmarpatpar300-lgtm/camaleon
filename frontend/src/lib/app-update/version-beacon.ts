import { compareSemver } from "@/lib/releases/compare-version";
import { VERSION_BEACON_PATH } from "./constants";
import type { VersionBeacon } from "./types";

export function parseVersionBeaconPayload(data: unknown): VersionBeacon | null {
  if (!data || typeof data !== "object") return null;
  const version = (data as { version?: unknown }).version;
  if (typeof version !== "string" || !version.trim()) return null;
  const buildId = (data as { buildId?: unknown }).buildId;
  return {
    version: version.trim(),
    buildId: typeof buildId === "string" && buildId.trim() ? buildId.trim() : undefined,
  };
}

export function isRemoteVersionNewer(
  remoteVersion: string,
  currentVersion: string
): boolean {
  return compareSemver(remoteVersion, currentVersion) > 0;
}

export async function fetchVersionBeacon(
  currentVersion: string,
  signal?: AbortSignal
): Promise<VersionBeacon | null> {
  if (typeof fetch === "undefined") return null;

  const url = `${VERSION_BEACON_PATH}?t=${Date.now()}`;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    const beacon = parseVersionBeaconPayload(data);
    if (!beacon) return null;
    if (!isRemoteVersionNewer(beacon.version, currentVersion)) return null;
    return beacon;
  } catch {
    return null;
  }
}
