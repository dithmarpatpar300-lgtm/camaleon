"use client";

import { useEffect, useState } from "react";
import { SettingsFocusLink } from "@/components/settings/SettingsFocusLink";
import { useI18n } from "@/providers/I18nProvider";
import { useOffline } from "@/providers/OfflineProvider";
import { isWasmCrateCached } from "@/lib/offline/cache-status";
import type { TransmutationModule } from "@/workers/types";

type Props = {
  module: TransmutationModule;
};

export function UncachedToolNotice({ module }: Props) {
  const { t } = useI18n();
  const { online } = useOffline();
  const [cached, setCached] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void isWasmCrateCached(module).then((value) => {
      if (!cancelled) setCached(value);
    });
    return () => {
      cancelled = true;
    };
  }, [module]);

  if (online || cached === null || cached) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-border bg-bg-elevated/60 px-4 py-3 text-sm text-text-secondary"
    >
      <p>{t("offline.uncachedTool")}</p>
      <p className="mt-2">
        <SettingsFocusLink
          focus="offline"
          labelKey="offline.uncachedToolOpenOffline"
          className="text-accent"
        />
      </p>
    </div>
  );
}
