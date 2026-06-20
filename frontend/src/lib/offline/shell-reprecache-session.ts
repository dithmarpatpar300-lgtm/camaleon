import { SESSION_KEYS } from "@/lib/storage/keys";

export function markShellReprecachePending(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(SESSION_KEYS.SHELL_REPRECACHE_PENDING, "1");
}

export function consumeShellReprecachePending(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const pending = sessionStorage.getItem(SESSION_KEYS.SHELL_REPRECACHE_PENDING) === "1";
  if (pending) sessionStorage.removeItem(SESSION_KEYS.SHELL_REPRECACHE_PENDING);
  return pending;
}

export function isShellReprecachePending(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEYS.SHELL_REPRECACHE_PENDING) === "1";
}
