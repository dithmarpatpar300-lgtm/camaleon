"use client";

import { useSettings } from "@/providers/SettingsProvider";
import { useI18n } from "@/providers/I18nProvider";
import { useOfflineInstallPromoVisible } from "@/hooks/useOfflineInstallPromo";
import { snoozeOfflinePromo } from "@/lib/offline/offline-promo-storage";

export function OfflineInstallPromoNotice() {
  const visible = useOfflineInstallPromoVisible();
  const { openSettings } = useSettings();
  const { t } = useI18n();

  if (!visible) return null;

  const handleInstall = () => {
    openSettings({ focus: "offline" });
  };

  const handleSnooze = () => {
    snoozeOfflinePromo();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="offline-promo-notice pointer-events-auto"
    >
      <div className="offline-promo-notice__inner">
        <span className="offline-promo-notice__icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              fillRule="evenodd"
              d="M5.5 3.5A1.5 1.5 0 017 2h6a1.5 1.5 0 011.5 1.5v1.05a8.99 8.99 0 012.75 1.774 1.5 1.5 0 11-2.5 1.626A6.97 6.97 0 0010 5.25a6.97 6.97 0 00-3.75 1.65 1.5 1.5 0 11-2.5-1.626A8.99 8.99 0 015.5 4.55V3.5zm7 7.75a1.5 1.5 0 10-3 0v2.086l-.293-.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414l-.293.293V11.25z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <div className="offline-promo-notice__copy">
          <p className="offline-promo-notice__title">{t("offlinePromo.title")}</p>
          <p className="offline-promo-notice__message">{t("offlinePromo.body")}</p>
        </div>
        <div className="offline-promo-notice__actions">
          <button type="button" onClick={handleInstall} className="offline-promo-notice__primary">
            {t("offlinePromo.install")}
          </button>
          <button type="button" onClick={handleSnooze} className="offline-promo-notice__secondary">
            {t("offlinePromo.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
