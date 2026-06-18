import { HARD_RELOAD_QUERY_PARAM } from "./constants";

export function buildHardReloadUrl(href: string, timestampMs: number): string {
  const url = new URL(href);
  url.searchParams.set(HARD_RELOAD_QUERY_PARAM, String(timestampMs));
  return url.toString();
}

export function hardReloadApp(href = window.location.href): void {
  window.location.replace(buildHardReloadUrl(href, Date.now()));
}
