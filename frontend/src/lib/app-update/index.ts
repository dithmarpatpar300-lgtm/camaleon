export { applyAppUpdate, waitForServiceWorkerControl } from "./apply-update";
export { purgeAppShellCaches, shouldPreserveCache } from "./cache-purge";
export {
  HARD_RELOAD_QUERY_PARAM,
  UPDATE_POLL_INTERVAL_MS,
  VERSION_BEACON_PATH,
  WASM_CACHE_NAME,
} from "./constants";
export { buildHardReloadUrl, hardReloadApp } from "./hard-reload";
export {
  clearAppUpdateSnooze,
  isAppUpdateSnoozed,
  snoozeAppUpdate,
} from "./storage";
export {
  activateWaitingServiceWorker,
  applyWaitingServiceWorker,
  hasWaitingServiceWorker,
} from "./sw-activation";
export type { AppUpdateSource, VersionBeacon } from "./types";
export {
  fetchVersionBeacon,
  isRemoteVersionNewer,
  parseVersionBeaconPayload,
} from "./version-beacon";
