"use client";

import { useOffline } from "@/providers/OfflineProvider";
import { useI18n } from "@/providers/I18nProvider";
import { ConnectivityDot } from "@/components/connectivity/ConnectivityDot";
import { cn } from "@/lib/utils";

type NoticeKind = "workingOffline" | "simulated";

function resolveKind(
  networkOnline: boolean,
  forceOffline: boolean,
  serverReachable: boolean
): NoticeKind | null {
  if (forceOffline) return "simulated";
  if (!networkOnline || !serverReachable) return "workingOffline";
  return null;
}

export function OfflineStatusNotice({ layout = "default" }: { layout?: "default" | "dock" }) {
  const { t } = useI18n();
  const { networkOnline, forceOffline, serverReachable, setForceOffline } = useOffline();

  const kind = resolveKind(networkOnline, forceOffline, serverReachable);
  if (!kind) return null;

  const messageKey =
    kind === "simulated" ? "offline.noticeOfflineMode" : "offline.noticeWorkingOffline";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "offline-status-notice pointer-events-auto",
        layout === "dock" && "offline-status-notice--dock",
        kind === "simulated" && "offline-status-notice--forced",
        kind === "workingOffline" && "offline-status-notice--server-down"
      )}
    >
      <div className="offline-status-notice__inner">
        <span className="offline-status-notice__dot" aria-hidden="true">
          <ConnectivityDot state="offline" size="xs" pulse={false} subtle />
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
