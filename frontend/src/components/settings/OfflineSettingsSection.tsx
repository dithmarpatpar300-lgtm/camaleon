"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { useOffline } from "@/providers/OfflineProvider";
import { formatBytes } from "@/lib/format/bytes";
import {
  clearOfflineCaches,
  estimateWasmCacheBytes,
  isWasmReady,
  listCachedWasmCrates,
} from "@/lib/offline/cache-status";
import { precacheFullToolkit } from "@/lib/offline/precache-toolkit";
import { reprecacheAppShell } from "@/lib/offline/reprecache-app-shell";
import {
  getShellCacheStatus,
  type ShellCacheStatus,
} from "@/lib/offline/shell-cache-status";
import {
  getEffectiveOfflinePrefs,
  markOfflinePrecacheComplete,
  resetOfflinePrefs,
  writeOfflinePrefs,
} from "@/lib/prefs/offline-prefs";
import { WASM_CRATES } from "@/lib/wasm/wasm-crates";
import { useWasmSyncEngine, type WasmSyncState } from "@/lib/wasm/wasm-sync";
import { cn } from "@/lib/utils";
import { ConnectivityDot, type ConnectivityVisualState } from "@/components/connectivity/ConnectivityDot";
import { SettingsSection } from "./SettingsSection";
import { SettingsRow } from "./SettingsRow";
import { SettingsSwitch } from "./SettingsSwitch";

type Props = {
  drawerOpen: boolean;
};

function isMobileUa(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function SyncBadge({ state, label }: { state: WasmSyncState; label: string }) {
  const styles: Record<WasmSyncState, string> = {
    idle: "border-border bg-bg-elevated/40 text-text-muted",
    checking: "border-accent/30 bg-accent/10 text-accent",
    up_to_date: "border-accent/30 bg-accent/10 text-accent",
    stale: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    syncing: "border-accent/30 bg-accent/10 text-accent",
    error: "border-border bg-bg-elevated/40 text-text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[state]
      )}
    >
      {label}
    </span>
  );
}

export function OfflineSettingsSection({ drawerOpen }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const {
    online,
    networkOnline,
    serverReachable,
    forceOffline,
    setForceOffline,
    swSupported,
    swRegistered,
  } = useOffline();
  const [prefs, setPrefs] = useState(getEffectiveOfflinePrefs);
  const [cachedCrates, setCachedCrates] = useState<string[]>([]);
  const [cacheBytes, setCacheBytes] = useState<number | null>(null);
  const [shellStatus, setShellStatus] = useState<ShellCacheStatus | null>(null);
  const [precaching, setPrecaching] = useState(false);
  const [restoringShell, setRestoringShell] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const wasmSync = useWasmSyncEngine(drawerOpen);

  const refreshStatus = useCallback(async () => {
    const [crates, bytes, shell] = await Promise.all([
      listCachedWasmCrates(),
      estimateWasmCacheBytes(),
      getShellCacheStatus(),
    ]);
    setCachedCrates(crates);
    setCacheBytes(bytes);
    setShellStatus(shell);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    setPrefs(getEffectiveOfflinePrefs());
    void refreshStatus();
  }, [drawerOpen, refreshStatus]);

  const visualState: ConnectivityVisualState = useMemo(() => {
    if (online) return "online";
    if (forceOffline && networkOnline) return "simulated";
    return "offline";
  }, [online, forceOffline, networkOnline]);

  const modeTitle = useMemo(() => {
    if (visualState === "online") return t("settings.offline.modeOnline");
    if (visualState === "simulated") return t("settings.offline.modeOfflineActive");
    return t("settings.offline.modeOffline");
  }, [visualState, t]);

  const modeDetail = useMemo(() => {
    if (!swSupported) return t("settings.offline.swUnsupported");
    if (!swRegistered) return t("settings.offline.swPending");
    if (visualState === "online") return t("settings.offline.modeOnlineDetail");
    if (visualState === "simulated") return t("settings.offline.modeOfflineActiveDetail");
    return t("settings.offline.modeOfflineDetail");
  }, [swSupported, swRegistered, visualState, t]);

  const engineCount = `${cachedCrates.length}/${WASM_CRATES.length}`;
  const shellCount = shellStatus
    ? `${shellStatus.toolRoutesCached}/${shellStatus.toolRoutesTotal}`
    : "—";
  const storageStr = cacheBytes != null ? formatBytes(cacheBytes) : "—";
  const enginePct = Math.round((cachedCrates.length / WASM_CRATES.length) * 100);
  const shellPct =
    shellStatus && shellStatus.toolRoutesTotal > 0
      ? Math.round((shellStatus.toolRoutesCached / shellStatus.toolRoutesTotal) * 100)
      : 0;

  const syncStatusLabel = useMemo(() => {
    switch (wasmSync.state) {
      case "idle":
        return t("settings.offline.syncIdle");
      case "checking":
        return t("settings.offline.syncChecking");
      case "up_to_date":
        return t("settings.offline.syncUpToDate");
      case "stale":
        return t("settings.offline.syncStale");
      case "syncing":
        return t("settings.offline.syncing");
      case "error":
        return t("settings.offline.syncError");
    }
  }, [wasmSync.state, t]);

  const runPrecache = useCallback(async () => {
    if (!online) {
      toast({ message: t("settings.offline.needOnline"), variant: "info" });
      return;
    }
    setPrecaching(true);
    setProgress({ done: 0, total: WASM_CRATES.length * 2 });
    try {
      await precacheFullToolkit((p) => setProgress(p));
      markOfflinePrecacheComplete();
      setPrefs(getEffectiveOfflinePrefs());
      await refreshStatus();
      toast({ message: t("settings.offline.precacheDone"), variant: "success" });
    } catch {
      writeOfflinePrefs({ fullToolkitPrecache: false });
      setPrefs(getEffectiveOfflinePrefs());
      toast({ message: t("settings.offline.precacheFailed"), variant: "info" });
    } finally {
      setPrecaching(false);
      setProgress(null);
    }
  }, [online, refreshStatus, t, toast]);

  const handleToggleToolkit = useCallback(
    async (next: boolean) => {
      if (isMobileUa() && next && !prefs.dismissedMobileWarning) {
        writeOfflinePrefs({ dismissedMobileWarning: true });
      }
      writeOfflinePrefs({ fullToolkitPrecache: next });
      setPrefs(getEffectiveOfflinePrefs());
      if (next) {
        await runPrecache();
      }
    },
    [prefs.dismissedMobileWarning, runPrecache]
  );

  const handleClear = useCallback(async () => {
    const { shellRestored } = await clearOfflineCaches({ reprecacheShell: online });
    resetOfflinePrefs();
    setPrefs(getEffectiveOfflinePrefs());
    await refreshStatus();
    toast({
      message: shellRestored
        ? t("settings.offline.clearDoneShellRestored")
        : t("settings.offline.clearDoneShellPending"),
      variant: shellRestored ? "success" : "info",
    });
  }, [online, refreshStatus, t, toast]);

  const handleRestoreShell = useCallback(async () => {
    if (!online) {
      toast({ message: t("settings.offline.needOnline"), variant: "info" });
      return;
    }
    setRestoringShell(true);
    setProgress({ done: 0, total: 1 });
    try {
      const result = await reprecacheAppShell((p) => setProgress(p));
      await refreshStatus();
      toast({
        message: result.ok
          ? t("settings.offline.restoreCacheDone")
          : t("settings.offline.restoreCacheFailed"),
        variant: result.ok ? "success" : "info",
      });
    } finally {
      setRestoringShell(false);
      setProgress(null);
    }
  }, [online, refreshStatus, t, toast]);

  const handleForceOffline = useCallback(async () => {
    if (!networkOnline) {
      toast({ message: t("settings.offline.alreadyOffline"), variant: "info" });
      return;
    }

    if (!forceOffline) {
      const [shell, wasmOk] = await Promise.all([getShellCacheStatus(), isWasmReady()]);
      if (!shell.shellReady) {
        toast({ message: t("settings.offline.offlineModeBlockedShell"), variant: "info" });
        return;
      }
      if (!wasmOk) {
        toast({ message: t("settings.offline.offlineModeBlockedWasm"), variant: "info" });
        return;
      }
    }

    setForceOffline(!forceOffline);
    toast({
      message: forceOffline
        ? t("settings.offline.offlineModeOff")
        : t("settings.offline.offlineModeOn"),
      variant: "info",
    });
  }, [forceOffline, networkOnline, setForceOffline, t, toast]);

  const handleSyncNow = useCallback(async () => {
    await wasmSync.syncNow();
    await refreshStatus();
    if (wasmSync.state === "up_to_date") {
      toast({ message: t("settings.offline.syncDone"), variant: "success" });
    } else if (wasmSync.state === "error") {
      toast({ message: t("settings.offline.syncFailed"), variant: "info" });
    }
  }, [wasmSync, refreshStatus, t, toast]);

  const handleCheckNow = useCallback(async () => {
    await wasmSync.checkNow();
    if (wasmSync.state === "stale") {
      toast({ message: t("settings.offline.syncStaleToast"), variant: "info" });
    } else if (wasmSync.state === "up_to_date") {
      toast({ message: t("settings.offline.syncUpToDateToast"), variant: "success" });
    }
  }, [wasmSync, t, toast]);

  const actionButtonClass = cn(
    "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  );

  return (
    <SettingsSection
      title={t("settings.offline.section")}
      focusTarget="offline"
      className="[&>[data-settings-focus-card]]:border-accent/20 [&>[data-settings-focus-card]]:shadow-[0_0_0_1px_rgba(34,197,94,0.06)]"
    >
      {/* Status card */}
      <div className="border-b border-border bg-gradient-to-br from-bg-elevated/60 to-bg-base/40 px-4 py-4">
        <div className="flex items-start gap-3.5">
          <div className="relative mt-0.5">
            <div className={cn(
              "absolute -inset-1.5 rounded-full opacity-25 blur-md",
              visualState === "online" ? "bg-accent/50" :
              visualState === "simulated" ? "bg-amber-500/50" : "bg-text-muted/30"
            )} />
            <ConnectivityDot state={visualState} size="lg" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold tracking-tight text-text-primary">{modeTitle}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{modeDetail}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                swRegistered
                  ? "bg-accent/15 text-accent"
                  : "bg-bg-elevated/60 text-text-muted"
              )}>
                {swRegistered
                  ? t("settings.offline.badgeSwActive")
                  : t("settings.offline.badgeSwPending")}
              </span>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                online
                  ? "bg-accent/10 text-accent/80"
                  : "bg-bg-elevated/60 text-text-muted"
              )}>
                {online
                  ? t("settings.offline.badgeNetworkUp")
                  : t("settings.offline.badgeNetworkDown")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache overview */}
      <div className="border-b border-border bg-bg-surface/50 px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
          {t("settings.offline.cacheOverviewLabel")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-bg-elevated/40 px-3 py-3">
            <p className="text-[10px] font-medium text-text-muted">{t("settings.offline.enginesShort")}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-text-primary">{engineCount}</p>
            <div className="mt-2 h-1 overflow-hidden bg-bg-base">
              <div
                className="h-full bg-accent transition-[width] duration-300 ease-out"
                style={{ width: `${enginePct}%` }}
              />
            </div>
          </div>
          <div className="bg-bg-elevated/40 px-3 py-3">
            <p className="text-[10px] font-medium text-text-muted">{t("settings.offline.shellShort")}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-text-primary">{shellCount}</p>
            <div className="mt-2 h-1 overflow-hidden bg-bg-base">
              <div
                className="h-full bg-accent transition-[width] duration-300 ease-out"
                style={{ width: `${shellPct}%` }}
              />
            </div>
          </div>
          <div className="bg-bg-elevated/40 px-3 py-3">
            <p className="text-[10px] font-medium text-text-muted">{t("settings.offline.storageShort")}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-text-primary">{storageStr}</p>
          </div>
        </div>
      </div>

      {/* Engine sync */}
      <SettingsRow
        label={t("settings.offline.syncLabel")}
        description={
          wasmSync.state === "syncing" && wasmSync.syncProgress
            ? t("settings.offline.syncProgressHint", {
                done: String(wasmSync.syncProgress.done),
                total: String(wasmSync.syncProgress.total),
              })
            : wasmSync.manifest
              ? t("settings.offline.syncHintWithVersion", {
                  version: wasmSync.manifest.version,
                  buildId: wasmSync.manifest.buildId.slice(0, 6),
                })
              : t("settings.offline.syncHint")
        }
        bordered
      >
        <div className="flex items-center gap-2">
          <SyncBadge state={wasmSync.state} label={syncStatusLabel} />
          {wasmSync.state === "stale" && (
            <button
              type="button"
              onClick={() => void handleSyncNow()}
              disabled={!online}
              className={cn(
                actionButtonClass,
                "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-500/50",
                !online && "cursor-not-allowed opacity-50"
              )}
            >
              {t("settings.offline.syncUpdateAction")}
            </button>
          )}
          {wasmSync.state !== "stale" && wasmSync.state !== "syncing" && (
            <button
              type="button"
              onClick={() => void handleCheckNow()}
              disabled={!online || wasmSync.state === "checking"}
              className={cn(
                actionButtonClass,
                "border-border bg-bg-base/50 text-text-secondary hover:border-accent/25 hover:text-text-primary",
                (!online || wasmSync.state === "checking") && "cursor-not-allowed opacity-50"
              )}
            >
              {wasmSync.state === "checking" ? t("settings.offline.syncCheckingAction") : t("settings.offline.syncCheckAction")}
            </button>
          )}
        </div>
      </SettingsRow>

      {/* Sync progress bar */}
      {wasmSync.state === "syncing" && wasmSync.syncProgress && (
        <div className="px-4 pb-3">
          <div className="h-1 overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full rounded-full bg-accent/80 transition-[width] duration-200"
              style={{
                width: `${Math.round((wasmSync.syncProgress.done / wasmSync.syncProgress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Auto-detect sync */}
      <SettingsRow
        label={t("settings.offline.syncAutoLabel")}
        description={t("settings.offline.syncAutoHint")}
        bordered
      >
        <SettingsSwitch
          checked={wasmSync.autoDetect}
          onChange={wasmSync.setAutoDetect}
          label={t("settings.offline.syncAutoLabel")}
        />
      </SettingsRow>

      {/* Full toolkit */}
      <SettingsRow
        label={t("settings.offline.fullToolkitLabel")}
        description={
          precaching && progress
            ? t("settings.offline.precacheProgress", {
                done: String(progress.done),
                total: String(progress.total),
              })
            : t("settings.offline.fullToolkitHint")
        }
        bordered
      >
        <SettingsSwitch
          checked={prefs.fullToolkitPrecache}
          onChange={handleToggleToolkit}
          disabled={precaching || !swSupported || !online}
          label={t("settings.offline.fullToolkitLabel")}
        />
      </SettingsRow>

      {/* Precache progress bar */}
      {precaching && progress && (
        <div className="px-4 pb-3">
          <div className="h-1 overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full rounded-full bg-accent/80 transition-[width] duration-200"
              style={{
                width: `${Math.round((progress.done / progress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Offline mode */}
      <SettingsRow
        label={t("settings.offline.offlineModeTitle")}
        description={t("settings.offline.offlineModeHint")}
        layout="stacked"
        bordered
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleForceOffline}
            disabled={!networkOnline && !forceOffline}
            className={cn(
              actionButtonClass,
              forceOffline
                ? "border-error/40 bg-error/10 text-red-200 hover:border-error/55 hover:bg-error/15"
                : "border-border bg-bg-base/50 text-text-secondary hover:border-accent/25 hover:text-text-primary",
              !networkOnline && !forceOffline && "cursor-not-allowed opacity-50"
            )}
          >
            {forceOffline
              ? t("settings.offline.offlineModeExit")
              : t("settings.offline.offlineModeEnter")}
          </button>
        </div>
      </SettingsRow>

      {/* Maintenance */}
      <SettingsRow
        label={t("settings.offline.maintenanceLabel")}
        description={t("settings.offline.maintenanceHint")}
        layout="stacked"
        bordered={false}
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleRestoreShell()}
            disabled={restoringShell || precaching || !online || !swSupported}
            className={cn(
              actionButtonClass,
              "border-accent/30 bg-accent-subtle text-accent hover:border-accent/50",
              (restoringShell || precaching || !online || !swSupported) && "cursor-not-allowed opacity-50"
            )}
          >
            {restoringShell && progress
              ? t("settings.offline.restoreCacheProgress", {
                  done: String(progress.done),
                  total: String(progress.total),
                })
              : t("settings.offline.restoreCacheAction")}
          </button>
          <button
            type="button"
            onClick={() => void handleClear()}
            className={cn(
              actionButtonClass,
              "border-border bg-bg-elevated/50 text-text-secondary hover:border-error/30 hover:text-text-primary"
            )}
          >
            {t("settings.offline.clearAction")}
          </button>
        </div>
      </SettingsRow>
    </SettingsSection>
  );
}
