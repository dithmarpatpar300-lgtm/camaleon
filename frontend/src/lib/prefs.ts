import type { Theme } from "@/lib/types";
import type { Locale } from "@/lib/i18n/types";
import { DEFAULT_LOCALE } from "@/lib/i18n";

export const THEME_STORAGE_KEY = "camaleon-theme";
export const THEME_COOKIE_NAME = "camaleon-theme";
export const OVERLAY_SCROLL_CLASS = "camaleon-overlay-scroll";

/** Desktop fine-pointer without reduced motion — custom overlay scrollbar path. */
export function shouldUseOverlayScrollbar(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Keeps `html.camaleon-overlay-scroll` in sync after React hydration.
 * The bootstrap script sets this class before paint, but `<html className={theme}>`
 * replaces the full class list on hydration — this restores it.
 */
export function syncOverlayScrollClass(): boolean {
  const enabled = shouldUseOverlayScrollbar();
  document.documentElement.classList.toggle(OVERLAY_SCROLL_CLASS, enabled);
  return enabled;
}

export function resolveThemeFromCookie(value: string | undefined): Theme {
  if (value === "light" || value === "dark") return value;
  return "dark";
}

export function resolveLocaleFromCookie(value: string | undefined): Locale {
  if (value === "en" || value === "es") return value;
  return DEFAULT_LOCALE;
}

/** Blocking inline script — runs before paint; syncs html + cookies from localStorage. */
export const PREFERENCES_BOOTSTRAP_SCRIPT = `
(function() {
  try {
    var root = document.documentElement;
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (theme !== 'light' && theme !== 'dark') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    document.cookie = '${THEME_COOKIE_NAME}=' + theme + '; path=/; max-age=31536000; SameSite=Lax';

    var locale = localStorage.getItem('camaleon-locale');
    if (locale !== 'en' && locale !== 'es') locale = '${DEFAULT_LOCALE}';
    root.lang = locale;
    document.cookie = 'camaleon-locale=' + locale + '; path=/; max-age=31536000; SameSite=Lax';

    // Overlay scrollbar: only on fine-pointer desktop without reduced-motion preference.
    // The CSS rule that hides the native scrollbar is gated on this class.
    var hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var noReducedMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hasFinePointer && noReducedMotion) {
      root.classList.add('${OVERLAY_SCROLL_CLASS}');
    }
  } catch (e) {}
})();
`;
