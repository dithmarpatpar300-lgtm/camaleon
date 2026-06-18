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
        kind === "simulated" && "offline-status-notice--forced",
        kind === "serverDown" && "offline-status-notice--server-down"
      )}
    >
      <div className="offline-status-notice__inner">
        <span className="offline-status-notice__dot" aria-hidden="true">
          <ConnectivityDot state={dotState} size="xs" pulse={false} subtle />
        </span>
        <div className="offline-status-notice__body">
          <p className="offline-status-notice__message">{t(messageKey)}</p>
          {kind === "simulated" && (
            <button
              type="button"
              onClick={() => setForceOffline(false)}
              className="offline-status-notice__action"
            >
              {t("offline.noticeExitOfflineMode")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
