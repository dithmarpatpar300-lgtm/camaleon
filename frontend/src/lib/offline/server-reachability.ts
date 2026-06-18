import { probeOriginReachable } from "./network-guard";
import { readForceOffline } from "./force-offline";

export async function checkServerReachability(): Promise<boolean> {
  if (readForceOffline()) return true;
  return probeOriginReachable();
}

export function installServerReachabilityListeners(
  onChange: (reachable: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const runProbe = () => {
    if (readForceOffline()) return;
    void checkServerReachability().then(onChange);
  };

  const onUnreachable = () => {
    if (!readForceOffline()) onChange(false);
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") runProbe();
  };

  window.addEventListener("camaleon:server-unreachable", onUnreachable);
  window.addEventListener("online", runProbe);
  window.addEventListener("focus", runProbe);
  document.addEventListener("visibilitychange", onVisible);

  void checkServerReachability().then(onChange);

  return () => {
    window.removeEventListener("camaleon:server-unreachable", onUnreachable);
    window.removeEventListener("online", runProbe);
    window.removeEventListener("focus", runProbe);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
