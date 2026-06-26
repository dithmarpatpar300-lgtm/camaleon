import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWasmManifest } from "./wasm-manifest-fetch";
import type { WasmManifest } from "./wasm-manifest-types";
import { WASM_CACHE_NAME } from "./wasm-cache-constants";
import {
  getLastKnownWasmBuildId,
  setWasmSyncBuildId,
} from "./wasm-sync-storage";
import { precacheFullToolkit, type PrecacheProgress } from "@/lib/offline/precache-toolkit";
import { getEffectiveOfflinePrefs, writeOfflinePrefs } from "@/lib/prefs/offline-prefs";

export type WasmSyncState = "idle" | "checking" | "up_to_date" | "stale" | "syncing" | "error";

export type WasmSyncValue = {
  state: WasmSyncState;
  /** Remote manifest if last check succeeded. */
  manifest: WasmManifest | null;
  /** BuildId currently stored in localStorage (last synced). */
  storedBuildId: string | null;
  /** Whether auto-detect is enabled (wasmSyncEnabled pref). */
  autoDetect: boolean;
  /** Sync progress when state === "syncing". */
  syncProgress: PrecacheProgress | null;
  /** Check for manifest changes (fetch + compare). */
  checkNow: () => Promise<void>;
  /** Purge stale Wasm cache + re-download all engines. */
  syncNow: () => Promise<void>;
  /** Toggle auto-detect preference. */
  setAutoDetect: (enabled: boolean) => void;
};

function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : false;
}

/**
 * Wasm Sync Engine — detects when cached Wasm engines are stale relative
 * to the deployed `wasm-manifest.json`.
 *
 * Unlike the app-update engine (2-min poll), this does NOT poll. It checks:
 * - On explicit `checkNow()` call
 * - When `trigger` changes (e.g. Settings drawer opens)
 *
 * The engine is gated by `wasmSyncEnabled` (default true) for auto-checks,
 * but `checkNow()` always works regardless of the pref.
 */
export function useWasmSyncEngine(trigger: unknown): WasmSyncValue {
  const [state, setState] = useState<WasmSyncState>("idle");
  const [manifest, setManifest] = useState<WasmManifest | null>(null);
  const [storedBuildId, setStoredBuildId] = useState<string | null>(null);
  const [autoDetect, setAutoDetectState] = useState(true);
  const [syncProgress, setSyncProgress] = useState<PrecacheProgress | null>(null);

  const checkInFlightRef = useRef(false);
  const syncInFlightRef = useRef(false);

  useEffect(() => {
    setStoredBuildId(getLastKnownWasmBuildId());
    setAutoDetectState(getEffectiveOfflinePrefs().wasmSyncEnabled ?? true);
  }, []);

  const checkNow = useCallback(async () => {
    if (checkInFlightRef.current) return;
    if (!isOnline()) {
      setState("error");
      return;
    }
    checkInFlightRef.current = true;
    setState("checking");
    try {
      const remote = await fetchWasmManifest();
      if (!remote) {
        setState("error");
        return;
      }
      setManifest(remote);
      const known = getLastKnownWasmBuildId();
      setStoredBuildId(known);
      if (known && known === remote.buildId) {
        setState("up_to_date");
      } else {
        setState("stale");
      }
    } catch {
      setState("error");
    } finally {
      checkInFlightRef.current = false;
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncInFlightRef.current) return;
    if (!isOnline()) {
      setState("error");
      return;
    }
    syncInFlightRef.current = true;
    setState("syncing");
    setSyncProgress({ done: 0, total: 26 });
    try {
      if (typeof caches !== "undefined") {
        await caches.delete(WASM_CACHE_NAME);
      }
      await precacheFullToolkit((p) => setSyncProgress(p));
      const remote = manifest ?? (await fetchWasmManifest());
      if (remote) {
        setWasmSyncBuildId(remote.buildId);
        setStoredBuildId(remote.buildId);
        setManifest(remote);
      }
      setState("up_to_date");
    } catch {
      setState("error");
    } finally {
      syncInFlightRef.current = false;
      setSyncProgress(null);
    }
  }, [manifest]);

  const setAutoDetect = useCallback((enabled: boolean) => {
    writeOfflinePrefs({ wasmSyncEnabled: enabled });
    setAutoDetectState(enabled);
  }, []);

  // Auto-check when trigger changes (e.g. drawer opens) and auto-detect is on
  useEffect(() => {
    if (!autoDetect) return;
    if (!isOnline()) return;
    void checkNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, autoDetect]);

  return {
    state,
    manifest,
    storedBuildId,
    autoDetect,
    syncProgress,
    checkNow,
    syncNow,
    setAutoDetect,
  };
}
