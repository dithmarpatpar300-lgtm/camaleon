import { evaluateOriginReachability } from "./origin-reachability";
import { readForceOffline } from "./force-offline";

/** Heartbeat while tab visible — local server kill, tunnel drop, etc. */
const PROBE_INTERVAL_MS = 15_000;

export async function checkServerReachability(): Promise<boolean> {
  if (readForceOffline()) return true;
  return evaluateOriginReachability();
}

export function installServerReachabilityListeners(
  onChange: (reachable: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const runProbe = () => {
    if (readForceOffline()) return;
    void evaluateOriginReachability().then(onChange);
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") runProbe();
  };

  window.addEventListener("online", runProbe);
  window.addEventListener("focus", runProbe);
  document.addEventListener("visibilitychange", onVisible);

  const intervalId = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    runProbe();
  }, PROBE_INTERVAL_MS);

  // Optimistic start — first probe runs after a short delay (SW + page settle).
  const bootTimer = window.setTimeout(runProbe, 1_500);

  return () => {
    window.clearInterval(intervalId);
    window.clearTimeout(bootTimer);
    window.removeEventListener("online", runProbe);
    window.removeEventListener("focus", runProbe);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
