"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readBrowserOnline,
  subscribeConnectivity,
  isServiceWorkerSupported,
} from "@/lib/offline/connectivity";
import {
  readForceOffline,
  subscribeForceOffline,
  writeForceOffline,
  applyForceOfflineNetworkPolicy,
} from "@/lib/offline/force-offline";
import { installServerReachabilityListeners } from "@/lib/offline/server-reachability";
import {
  activateWaitingServiceWorker,
  registerServiceWorker,
} from "@/lib/offline/sw-registration";

type OfflineContextValue = {
  /** Effective UX connectivity. */
  online: boolean;
  networkOnline: boolean;
  serverReachable: boolean;
  forceOffline: boolean;
  setForceOffline: (enabled: boolean) => void;
  swSupported: boolean;
  swRegistered: boolean;
  updateAvailable: boolean;
  reloadForUpdate: () => void;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [networkOnline, setNetworkOnline] = useState(true);
  const [serverReachable, setServerReachable] = useState(true);
  const [forceOffline, setForceOfflineState] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    setNetworkOnline(readBrowserOnline());
    setForceOfflineState(readForceOffline());
    const unsubNetwork = subscribeConnectivity(
      () => setNetworkOnline(true),
      () => setNetworkOnline(false)
    );
    const unsubForce = subscribeForceOffline(() => {
      setForceOfflineState(readForceOffline());
    });
    const unsubServer = installServerReachabilityListeners(setServerReachable);
    return () => {
      unsubNetwork();
      unsubForce();
      unsubServer();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void registerServiceWorker(() => {
      if (!cancelled) setUpdateAvailable(true);
    }).then((reg) => {
      if (!cancelled) setSwRegistered(Boolean(reg));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setForceOffline = useCallback((enabled: boolean) => {
    writeForceOffline(enabled);
    setForceOfflineState(enabled);
    if (enabled) setServerReachable(true);
    void applyForceOfflineNetworkPolicy(enabled);
  }, []);

  useEffect(() => {
    if (readForceOffline()) {
      void applyForceOfflineNetworkPolicy(true);
    }
  }, []);

  useEffect(() => {
    if (forceOffline && swRegistered) {
      void applyForceOfflineNetworkPolicy(true);
    }
  }, [forceOffline, swRegistered]);

  const reloadForUpdate = useCallback(() => {
    activateWaitingServiceWorker();
    window.location.reload();
  }, []);

  const online = networkOnline && serverReachable && !forceOffline;

  const value = useMemo<OfflineContextValue>(
    () => ({
      online,
      networkOnline,
      serverReachable,
      forceOffline,
      setForceOffline,
      swSupported: isServiceWorkerSupported(),
      swRegistered,
      updateAvailable,
      reloadForUpdate,
    }),
    [
      online,
      networkOnline,
      serverReachable,
      forceOffline,
      setForceOffline,
      swRegistered,
      updateAvailable,
      reloadForUpdate,
    ]
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return ctx;
}
