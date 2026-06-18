"use client";

import { useAppUpdate } from "@/providers/AppUpdateProvider";
import { useI18n } from "@/providers/I18nProvider";
import { APP_VERSION } from "@/lib/site";

export function AppUpdateNotice() {
  const { updateAvailable, remoteVersion, applying, applyUpdate, snoozeUpdate } =
    useAppUpdate();
  const { t } = useI18n();

  if (!updateAvailable) return null;

  const versionLabel = remoteVersion ?? APP_VERSION;
  const message = remoteVersion
    ? t("appUpdate.message", { version: versionLabel })
    : t("appUpdate.messageGeneric");

  return (
    <div
      role="status"
      aria-live="polite"
      className="app-update-notice pointer-events-auto"
    >
      <div className="app-update-notice__inner">
        <span className="app-update-notice__icon" aria-hidden="true">
          ↑
        </span>
        <p className="app-update-notice__message">{message}</p>
        <div className="app-update-notice__actions">
          <button
            type="button"
            onClick={applyUpdate}
            disabled={applying}
            className="app-update-notice__primary"
          >
            {applying ? t("appUpdate.updating") : t("appUpdate.update")}
          </button>
          <button
            type="button"
            onClick={snoozeUpdate}
            disabled={applying}
            className="app-update-notice__secondary"
          >
            {t("appUpdate.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
