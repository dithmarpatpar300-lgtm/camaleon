"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useToast } from "@/providers/ToastProvider";
import { useOffline } from "@/providers/OfflineProvider";
import { formatBytes } from "@/lib/format/bytes";
import {
  clearOfflineCaches,
  estimateWasmCacheBytes,
  listCachedWasmCrates,
} from "@/lib/offline/cache-status";
import { precacheFullToolkit } from "@/lib/offline/precache-toolkit";
import {
  getEffectiveOfflinePrefs,
  markOfflinePrecacheComplete,
  resetOfflinePrefs,
  writeOfflinePrefs,
} from "@/lib/prefs/offline-prefs";
import { WASM_CRATES } from "@/lib/wasm/wasm-crates";
import { cn } from "@/lib/utils";
import { ConnectivityDot, type ConnectivityVisualState } from "@/components/connectivity/ConnectivityDot";
import { SettingsSection } from "./SettingsSection";
import { SettingsSwitch } from "./SettingsSwitch";

type Props = {
  drawerOpen: boolean;
};

function isMobileUa(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-bg-elevated/40 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-text-primary">{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-text-muted">{hint}</p>
    </div>
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
  const [precaching, setPrecaching] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const refreshStatus = useCallback(async () => {
    const [crates, bytes] = await Promise.all([
      listCachedWasmCrates(),
      estimateWasmCacheBytes(),
    ]);
    setCachedCrates(crates);
    setCacheBytes(bytes);
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
    if (!networkOnline) return t("settings.offline.modeOffline");
    if (!serverReachable) return t("connectivity.serverDown");
    return t("settings.offline.modeOffline");
  }, [visualState, networkOnline, serverReachable, t]);

  const modeDetail = useMemo(() => {
    if (!swSupported) return t("settings.offline.swUnsupported");
    if (!swRegistered) return t("settings.offline.swPending");
    if (visualState === "online") return t("settings.offline.modeOnlineDetail");
    if (visualState === "simulated") return t("settings.offline.modeOfflineActiveDetail");
    if (!serverReachable && networkOnline) return t("offline.noticeServerDown");
    return t("settings.offline.modeOfflineDetail");
  }, [swSupported, swRegistered, visualState, networkOnline, serverReachable, t]);

  const enginePct = Math.round((cachedCrates.length / WASM_CRATES.length) * 100);

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

  const handleToggle = useCallback(
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
    await clearOfflineCaches();
    resetOfflinePrefs();
    setPrefs(getEffectiveOfflinePrefs());
    await refreshStatus();
    toast({ message: t("settings.offline.clearDone"), variant: "success" });
  }, [refreshStatus, t, toast]);

  const handleForceOffline = useCallback(() => {
    if (!networkOnline) {
      toast({ message: t("settings.offline.alreadyOffline"), variant: "info" });
      return;
    }
    setForceOffline(!forceOffline);
    toast({
      message: forceOffline
        ? t("settings.offline.offlineModeOff")
        : t("settings.offline.offlineModeOn"),
      variant: "info",
    });
  }, [forceOffline, networkOnline, setForceOffline, t, toast]);

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
      <div className="space-y-5 p-4 sm:p-5">
        {/* Hero status */}
        <div className="rounded-xl border border-border/80 bg-gradient-to-br from-bg-elevated/80 to-bg-base/40 p-4">
          <div className="flex items-start gap-3.5">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-bg-base/60">
              <ConnectivityDot state={visualState} size="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold tracking-tight text-text-primary">{modeTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{modeDetail}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    swRegistered
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-border bg-bg-elevated/50 text-text-muted"
                  )}
                >
                  {swRegistered
                    ? t("settings.offline.badgeSwActive")
                    : t("settings.offline.badgeSwPending")}
                </span>
                <span className="inline-flex items-center rounded-full border border-border/70 bg-bg-elevated/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  {networkOnline
                    ? serverReachable
                      ? t("settings.offline.badgeNetworkUp")
                      : t("connectivity.serverDown")
                    : t("settings.offline.badgeNetworkDown")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-text-secondary">{t("settings.offline.description")}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label={t("settings.offline.statusLabel")}
            value={`${cachedCrates.length}/${WASM_CRATES.length}`}
            hint={t("settings.offline.enginesHint", { pct: String(enginePct) })}
          />
          <StatCard
            label={t("settings.offline.storageLabel")}
            value={cacheBytes != null ? formatBytes(cacheBytes) : "—"}
            hint={t("settings.offline.storageHint")}
          />
        </div>

        {/* Engine progress bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-text-muted">
            <span>{t("settings.offline.cacheProgressLabel")}</span>
            <span className="font-mono tabular-nums">{enginePct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${enginePct}%` }}
            />
          </div>
        </div>

        {isMobileUa() && !prefs.dismissedMobileWarning && (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5 text-xs leading-relaxed text-amber-100/85">
            {t("settings.offline.mobileWarning")}
          </p>
        )}

        {/* Full toolkit */}
        <div className="rounded-lg border border-border/70 bg-bg-elevated/30 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">
                {t("settings.offline.fullToolkitLabel")}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                {t("settings.offline.fullToolkitHint")}
              </p>
            </div>
            <SettingsSwitch
              checked={prefs.fullToolkitPrecache}
              onChange={handleToggle}
              disabled={precaching || !swSupported || !online}
              label={t("settings.offline.fullToolkitLabel")}
            />
          </div>
          {precaching && progress && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-text-muted">
                {t("settings.offline.precacheProgress", {
                  done: String(progress.done),
                  total: String(progress.total),
                })}
              </p>
              <div className="h-1 overflow-hidden rounded-full bg-bg-base">
                <div
                  className="h-full rounded-full bg-accent/80 transition-[width] duration-200"
                  style={{
                    width: `${Math.round((progress.done / progress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Offline mode (cache-only in this tab) */}
        <div className="rounded-lg border border-border/70 bg-bg-elevated/30 p-4">
          <p className="text-sm font-medium text-text-primary">
            {t("settings.offline.offlineModeTitle")}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            {t("settings.offline.offlineModeHint")}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
            {t("settings.offline.offlineModeNote")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
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
        </div>

        <div className="rounded-lg border border-border/60 bg-bg-elevated/20 px-4 py-3.5">
          <p className="text-sm font-medium text-text-primary">
            {t("settings.offline.fireTestTitle")}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
            {t("settings.offline.fireTestHint")}
          </p>
        </div>

        {/* Clear cache */}
        <div className="flex justify-end border-t border-border/60 pt-4">
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
      </div>
    </SettingsSection>
  );
}
