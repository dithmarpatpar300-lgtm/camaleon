"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { APP_VERSION } from "@/lib/site";
import {
  applyAppUpdate,
  fetchVersionBeacon,
  hasWaitingServiceWorker,
  HARD_RELOAD_QUERY_PARAM,
  isAppUpdateSnoozed,
  snoozeAppUpdate,
  UPDATE_POLL_INTERVAL_MS,
  type AppUpdateSource,
} from "@/lib/app-update";
import {
  getAutoDetectUpdates,
  subscribeUpdatesPrefs,
} from "@/lib/prefs/updates-prefs";
import {
  getServiceWorkerRegistration,
  subscribeSwUpdateWaiting,
} from "@/lib/offline/sw-registration";

export type CheckForUpdatesResult =
  | { status: "found"; remoteVersion: string | null }
  | { status: "up_to_date" }
  | { status: "offline" }
  | { status: "unavailable" };

type AppUpdateContextValue = {
  updateAvailable: boolean;
  remoteVersion: string | null;
  source: AppUpdateSource | null;
  applying: boolean;
  checkingForUpdates: boolean;
  autoDetectUpdates: boolean;
  applyUpdate: () => void;
  snoozeUpdate: () => void;
  checkForUpdatesNow: () => Promise<CheckForUpdatesResult>;
};

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [beaconVersion, setBeaconVersion] = useState<string | null>(null);
  const [source, setSource] = useState<AppUpdateSource | null>(null);
  const [snoozed, setSnoozed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [autoDetectUpdates, setAutoDetectUpdatesState] = useState(true);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const pollInFlightRef = useRef(false);
  const swUpdateRef = useRef(false);
  const beaconVersionRef = useRef<string | null>(null);

  useEffect(() => {
    swUpdateRef.current = swUpdateAvailable;
  }, [swUpdateAvailable]);

  useEffect(() => {
    beaconVersionRef.current = beaconVersion;
  }, [beaconVersion]);

  const markSwUpdate = useCallback(() => {
    setSwUpdateAvailable(true);
    setSource((prev) => prev ?? "service-worker");
  }, []);

  const checkVersionBeacon = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    if (process.env.NODE_ENV !== "production") return null;
    if (!navigator.onLine) return null;

    const beacon = await fetchVersionBeacon(APP_VERSION);
    if (!beacon) return null;

    setBeaconVersion(beacon.version);
    setSource((prev) => prev ?? "version-beacon");
    return beacon.version;
  }, []);

  const pollForUpdates = useCallback(async (): Promise<boolean> => {
    if (pollInFlightRef.current) {
      return swUpdateRef.current || beaconVersionRef.current !== null;
    }
    pollInFlightRef.current = true;
    try {
      const reg = registrationRef.current ?? (await getServiceWorkerRegistration());
      registrationRef.current = reg;
      await reg?.update();

      let found = false;
      if (await hasWaitingServiceWorker()) {
        markSwUpdate();
        found = true;
      }

      const remoteVersion = await checkVersionBeacon();
      if (remoteVersion) {
        found = true;
      }

      return found;
    } finally {
      pollInFlightRef.current = false;
    }
  }, [checkVersionBeacon, markSwUpdate]);

  const checkForUpdatesNow = useCallback(async (): Promise<CheckForUpdatesResult> => {
    if (process.env.NODE_ENV !== "production") {
      return { status: "unavailable" };
    }
    if (!navigator.onLine) {
      return { status: "offline" };
    }

    setCheckingForUpdates(true);
    try {
      const reg = registrationRef.current ?? (await getServiceWorkerRegistration());
      registrationRef.current = reg;
      await reg?.update();

      let found = false;
      let remote: string | null = null;

      if (await hasWaitingServiceWorker()) {
        markSwUpdate();
        found = true;
      }

      remote = await checkVersionBeacon();
      if (remote) {
        found = true;
      }

      if (found) {
        return { status: "found", remoteVersion: remote };
      }
      return { status: "up_to_date" };
    } finally {
      setCheckingForUpdates(false);
    }
  }, [checkVersionBeacon, markSwUpdate]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    setAutoDetectUpdatesState(getAutoDetectUpdates());

    const url = new URL(window.location.href);
    if (url.searchParams.has(HARD_RELOAD_QUERY_PARAM)) {
      url.searchParams.delete(HARD_RELOAD_QUERY_PARAM);
      window.history.replaceState({}, "", url.toString());
    }

    setSnoozed(isAppUpdateSnoozed());

    void getServiceWorkerRegistration().then((reg) => {
      registrationRef.current = reg;
      if (getAutoDetectUpdates()) {
        void pollForUpdates();
      }
    });

    const unsubSw = subscribeSwUpdateWaiting(() => {
      markSwUpdate();
    });

    const unsubPrefs = subscribeUpdatesPrefs(() => {
      setAutoDetectUpdatesState(getAutoDetectUpdates());
    });

    return () => {
      unsubSw();
      unsubPrefs();
    };
  }, [markSwUpdate, pollForUpdates]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!autoDetectUpdates) return;

    const intervalId = window.setInterval(() => {
      void pollForUpdates();
    }, UPDATE_POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void pollForUpdates();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onOnline = () => {
      void pollForUpdates();
    };
    window.addEventListener("online", onOnline);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
  }, [autoDetectUpdates, pollForUpdates]);

  const updateAvailable =
    !snoozed && (swUpdateAvailable || beaconVersion !== null);

  const remoteVersion = beaconVersion;

  const applyUpdate = useCallback(() => {
    if (applying) return;
    setApplying(true);
    void applyAppUpdate().catch(() => {
      setApplying(false);
    });
  }, [applying]);

  const snoozeUpdate = useCallback(() => {
    snoozeAppUpdate();
    setSnoozed(true);
  }, []);

  const value = useMemo<AppUpdateContextValue>(
    () => ({
      updateAvailable,
      remoteVersion,
      source,
      applying,
      checkingForUpdates,
      autoDetectUpdates,
      applyUpdate,
      snoozeUpdate,
      checkForUpdatesNow,
    }),
    [
      updateAvailable,
      remoteVersion,
      source,
      applying,
      checkingForUpdates,
      autoDetectUpdates,
      applyUpdate,
      snoozeUpdate,
      checkForUpdatesNow,
    ]
  );

  return (
    <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>
  );
}

export function useAppUpdate(): AppUpdateContextValue {
  const ctx = useContext(AppUpdateContext);
  if (!ctx) {
    throw new Error("useAppUpdate must be used within AppUpdateProvider");
  }
  return ctx;
}
