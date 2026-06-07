/**
 * Reference-counted scroll lock for modals / overlays.
 * Prevents the page behind a dialog from scrolling while keeping position.
 */

type ScrollLockListener = (locked: boolean) => void;

let lockCount = 0;
let savedScrollY = 0;
const listeners = new Set<ScrollLockListener>();

function notify() {
  const locked = lockCount > 0;
  for (const fn of listeners) fn(locked);
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
    savedScrollY = window.scrollY;
    document.documentElement.classList.add("camaleon-scroll-locked");
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    notify();
  }
  return () => releaseScrollLock();
}

function releaseScrollLock() {
  if (lockCount === 0) return;
  lockCount--;
  if (lockCount === 0) {
    document.documentElement.classList.remove("camaleon-scroll-locked");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, savedScrollY);
    notify();
  }
}
