/**
 * Reference-counted scroll lock for modals / overlays.
 * Uses overflow:hidden only — preserves scroll position without position:fixed
 * (avoids header/content vertical jump when modals close).
 */

type ScrollLockListener = (locked: boolean) => void;

let lockCount = 0;
const listeners = new Set<ScrollLockListener>();

function notify() {
  const locked = lockCount > 0;
  for (const fn of listeners) fn(locked);
}

function getScrollbarWidth(): number {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

function applyLock() {
  const sbw = getScrollbarWidth();
  document.documentElement.classList.add("camaleon-scroll-locked");
  if (sbw > 0) {
    document.documentElement.style.setProperty("--camaleon-scrollbar-width", `${sbw}px`);
  }
}

function clearLock() {
  document.documentElement.classList.remove("camaleon-scroll-locked");
  document.documentElement.style.removeProperty("--camaleon-scrollbar-width");
}

export function isScrollLocked(): boolean {
  return lockCount > 0;
}

export function subscribeScrollLock(listener: ScrollLockListener): () => void {
  listeners.add(listener);
  listener(lockCount > 0);
  return () => listeners.delete(listener);
}

export function acquireScrollLock(): () => void {
  lockCount++;
  if (lockCount === 1) {
    applyLock();
    notify();
  }
  return () => releaseScrollLock();
}

function releaseScrollLock() {
  if (lockCount === 0) return;
  lockCount--;
  if (lockCount === 0) {
    clearLock();
    notify();
  }
}

/** Safety net — resets a stuck lock (should not be needed in normal flow). */
export function resetScrollLock() {
  lockCount = 0;
  clearLock();
  notify();
}
