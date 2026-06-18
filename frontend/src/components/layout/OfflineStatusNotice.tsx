"use client";

import { useOffline } from "@/providers/OfflineProvider";
import { useI18n } from "@/providers/I18nProvider";
import { ConnectivityDot } from "@/components/connectivity/ConnectivityDot";
import { cn } from "@/lib/utils";

type NoticeKind = "offline" | "simulated" | "serverDown";

function resolveKind(
  networkOnline: boolean,
  forceOffline: boolean,
  serverReachable: boolean
): NoticeKind | null {
  if (!networkOnline) return "offline";
  if (forceOffline) return "simulated";
  if (!serverReachable) return "serverDown";
  return null;
}

export function OfflineStatusNotice() {
  const { t } = useI18n();
  const { networkOnline, forceOffline, serverReachable, setForceOffline } = useOffline();

  const kind = resolveKind(networkOnline, forceOffline, serverReachable);
  if (!kind) return null;

  const messageKey =
    kind === "simulated"
      ? "offline.noticeOfflineMode"
      : kind === "serverDown"
        ? "offline.noticeServerDown"
        : "offline.noticeOffline";

  const dotState = kind === "simulated" || kind === "offline" ? "offline" : "offline";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "offline-status-notice pointer-events-auto fixed z-[60]",
        "top-[3.75rem] right-4 max-w-[min(20rem,calc(100vw-2rem))]",
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5",
        "border-border/80 bg-bg-surface/95 shadow-lg backdrop-blur-md",
        kind === "simulated" && "border-error/25",
        kind === "serverDown" && "border-amber-500/30"
      )}
    >
      <ConnectivityDot state={dotState} size="sm" pulse={false} subtle />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed text-text-secondary">{t(messageKey)}</p>
        {kind === "simulated" && (
          <button
            type="button"
            onClick={() => setForceOffline(false)}
            className="mt-1.5 text-[11px] font-medium text-accent hover:underline"
          >
            {t("offline.noticeExitOfflineMode")}
          </button>
        )}
      </div>
    </div>
  );
}
