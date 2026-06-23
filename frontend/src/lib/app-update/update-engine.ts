import { useCallback, useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/site";
import {
  fetchVersionBeacon,
  hasWaitingServiceWorker,
  UPDATE_POLL_INTERVAL_MS,
  type AppUpdateSource,
} from "@/lib/app-update";
import {
  getServiceWorkerRegistration,
  subscribeSwUpdateWaiting,
} from "@/lib/offline/sw-registration";
import { getAutoDetectUpdates, subscribeUpdatesPrefs } from "@/lib/prefs/updates-prefs";
import { isAppUpdateSnoozed, snoozeAppUpdate } from "@/lib/app-update/storage";

export type UpdateEngineState = "idle" | "checking" | "available" | "applying";

export type CheckForUpdatesResult =
  | { status: "found"; remoteVersion: string | null; source: AppUpdateSource | null }
  | { status: "up_to_date" }
  | { status: "offline" }
  | { status: "unavailable" };

export type UpdateEngineValue = {
  state: UpdateEngineState;
  updateAvailable: boolean;
  remoteVersion: string | null;
  source: AppUpdateSource | null;
  applying: boolean;
  checking: boolean;
  autoDetectUpdates: boolean;
  applyUpdate: () => void;
  snoozeUpdate: () => void;
  checkForUpdatesNow: () => Promise<CheckForUpdatesResult>;
};

function isProduction(): boolean {
  if (typeof process === "undefined") return false;
  return process.env.NODE_ENV === "production";
}

export function useUpdateEngine(): UpdateEngineValue {
  const [source, setSource] = useState<AppUpdateSource | null>(null);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [snoozed, setSnoozed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);

  const pollInFlightRef = useRef(false);
  const swDetectedRef = useRef(false);
  const beaconVersionRef = useRef<string | null>(null);
  const autoDetectRef = useRef(true);

  useEffect(() => { autoDetectRef.current = autoDetect; }, [autoDetect]);

  const markSwUpdate = useCallback(() => {
    swDetectedRef.current = true;
    setSource((prev) => prev ?? "service-worker");
  }, []);

  const setBeaconVersion = useCallback((version: string) => {
    beaconVersionRef.current = version;
    setSource((prev) => prev ?? "version-beacon");
    setRemoteVersion((prev) => prev || version);
  }, []);

  const doSinglePoll = useCallback(async (): Promise<boolean> => {
    if (pollInFlightRef.current) {
      return swDetectedRef.current || beaconVersionRef.current !== null;
    }
    pollInFlightRef.current = true;
    try {
      const reg = await getServiceWorkerRegistration();
      await reg?.update();
      let found = false;
      if (await hasWaitingServiceWorker()) { markSwUpdate(); found = true; }
      if (!isProduction() || !navigator.onLine) return found;
      const beacon = await fetchVersionBeacon(APP_VERSION);
      if (beacon) { setBeaconVersion(beacon.version); found = true; }
      return found;
    } finally {
      pollInFlightRef.current = false;
    }
  }, [markSwUpdate, setBeaconVersion]);

  const checkForUpdatesNow = useCallback(async (): Promise<CheckForUpdatesResult> => {
    if (!isProduction()) return { status: "unavailable" };
    if (!navigator.onLine) return { status: "offline" };
    setChecking(true);
    try {
      const found = await doSinglePoll();
      if (found) {
        return {
          status: "found",
          remoteVersion: beaconVersionRef.current,
          source: swDetectedRef.current ? "service-worker" : "version-beacon",
        };
      }
      return { status: "up_to_date" };
    } finally {
      setChecking(false);
    }
  }, [doSinglePoll]);

  const applyUpdate = useCallback(() => {
    if (applying) return;
    setApplying(true);
    import("@/lib/app-update/apply-update").then((m) =>
      m.applyAppUpdate().catch(() => setApplying(false))
    );
  }, [applying]);

  const snoozeUpdate = useCallback(() => {
    snoozeAppUpdate();
    setSnoozed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAutoDetect(getAutoDetectUpdates());
    setSnoozed(isAppUpdateSnoozed());

    const unsubPrefs = subscribeUpdatesPrefs(() => {
      setAutoDetect(getAutoDetectUpdates());
    });

    const unsubSw = subscribeSwUpdateWaiting(() => {
      if (!isAppUpdateSnoozed()) {
        markSwUpdate();
      }
    });

    return () => { unsubPrefs(); unsubSw(); };
  }, [markSwUpdate]);

  useEffect(() => {
    if (!isProduction() || !autoDetect) return;
    const poll = () => { void doSinglePoll(); };

    void getServiceWorkerRegistration().then(() => poll());

    const intervalId = window.setInterval(poll, UPDATE_POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onOnline = () => poll();
    window.addEventListener("online", onOnline);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
  }, [autoDetect, doSinglePoll]);

  const swDetected = swDetectedRef.current || source === "service-worker";
  const updateAvailable = !snoozed && !applying && (swDetected || remoteVersion !== null);

  const state: UpdateEngineState = applying
    ? "applying"
    : updateAvailable
      ? "available"
      : checking
        ? "checking"
        : "idle";

  return {
    state,
    updateAvailable,
    remoteVersion,
    source,
    applying,
    checking,
    autoDetectUpdates: autoDetect,
    applyUpdate,
    snoozeUpdate,
    checkForUpdatesNow,
  };
}
