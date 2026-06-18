"use client";

import { memo } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useOffline } from "@/providers/OfflineProvider";
import { cn } from "@/lib/utils";
import { ConnectivityDot, type ConnectivityVisualState } from "./ConnectivityDot";

type Props = {
  variant?: "minimal" | "compact" | "full";
  className?: string;
};

function resolveVisualState(
  online: boolean,
  forceOffline: boolean,
  networkOnline: boolean,
  serverReachable: boolean
): ConnectivityVisualState {
  if (online) return "online";
  if (forceOffline && networkOnline) return "simulated";
  return "offline";
}

function ConnectivityIndicatorInner({ variant = "full", className }: Props) {
  const { t } = useI18n();
  const { online, networkOnline, forceOffline, serverReachable } = useOffline();

  const visual = resolveVisualState(online, forceOffline, networkOnline, serverReachable);
  const labelKey =
    visual === "online"
      ? "connectivity.online"
      : visual === "simulated"
        ? "connectivity.offlineMode"
        : !networkOnline
          ? "connectivity.offline"
          : !serverReachable
            ? "connectivity.serverDown"
            : "connectivity.offline";

  const title = t("connectivity.statusTitle", {
    mode: t(labelKey),
  });

  const isMinimal = variant === "minimal";

  return (
    <span
      className={cn(
        "connectivity-indicator inline-flex items-center",
        isMinimal ? "connectivity-indicator--minimal" : "gap-2",
        className
      )}
      title={title}
      aria-label={title}
    >
      <ConnectivityDot
        state={visual}
        size={isMinimal ? "xs" : variant === "compact" ? "sm" : "md"}
        pulse={!isMinimal}
        subtle={isMinimal}
      />
      {variant === "full" && (
        <span
          className={cn(
            "hidden text-[11px] font-medium uppercase tracking-wide sm:inline",
            visual === "online" ? "text-accent" : "text-error"
          )}
        >
          {t(labelKey)}
        </span>
      )}
    </span>
  );
}

export const ConnectivityIndicator = memo(ConnectivityIndicatorInner);

export const HeaderConnectivityStatus = memo(function HeaderConnectivityStatus() {
  return <ConnectivityIndicator variant="minimal" />;
});
