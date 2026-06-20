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
import { checkServerReachability } from "@/lib/offline/server-reachability";
import { installConnectivityFetchBridge } from "@/lib/offline/network-guard";
import { getServiceWorkerRegistration } from "@/lib/offline/sw-registration";
import { usePathname } from "next/navigation";

type OfflineContextValue = {
  /** Effective UX connectivity. */
  online: boolean;
  networkOnline: boolean;
  serverReachable: boolean;
  forceOffline: boolean;
  setForceOffline: (enabled: boolean) => void;
  swSupported: boolean;
  swRegistered: boolean;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [networkOnline, setNetworkOnline] = useState(true);
  const [serverReachable, setServerReachable] = useState(true);
  const [forceOffline, setForceOfflineState] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    setNetworkOnline(readBrowserOnline());
    setForceOfflineState(readForceOffline());
    const unsubFetch = installConnectivityFetchBridge();
    const unsubNetwork = subscribeConnectivity(
      () => setNetworkOnline(true),
      () => setNetworkOnline(false)
    );
    const unsubForce = subscribeForceOffline(() => {
      setForceOfflineState(readForceOffline());
    });
    const unsubServer = installServerReachabilityListeners(setServerReachable);
    return () => {
      unsubFetch();
      unsubNetwork();
      unsubForce();
      unsubServer();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getServiceWorkerRegistration().then((reg) => {
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

  useEffect(() => {
    if (forceOffline) return;
    const timer = window.setTimeout(() => {
      void checkServerReachability().then(setServerReachable);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pathname, forceOffline]);

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
    }),
    [
      online,
      networkOnline,
      serverReachable,
      forceOffline,
      setForceOffline,
      swRegistered,
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
