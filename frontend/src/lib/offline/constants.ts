/** Dedicated bucket for client-triggered shell reprecache (Settings clear / bootstrap). */
export const SHELL_CACHE_NAME = "camaleon-shell-v1";

export const OFFLINE_FALLBACK_PATH = "/~offline";

/** Fraction of tool routes that must be cached for shellReady (0–1). */
export const SHELL_ROUTE_READY_RATIO = 0.9;

export const SW_MESSAGE_REPRECACHE_SHELL = "REPRECACHE_SHELL" as const;

/** Query flag for origin reachability probes — must bypass SW cache (NetworkOnly). */
export const SERVER_PROBE_QUERY = "camaleon-probe";

/** Static shell assets that must survive real offline navigation (not only force-offline). */
export const OFFLINE_SHELL_ASSET_PATHS = [
  "/brand/camaleon-mark.png",
  "/brand/camaleon-mark-128.png",
  "/brand/camaleon-mark-64.png",
] as const;
