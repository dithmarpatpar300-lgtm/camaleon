/** Class toggled on `<html>` while overlay scrollbar is driving scroll — disables CSS smooth. */
export const SCROLL_INSTANT_CLASS = "camaleon-scroll-instant";

export function beginInstantDocumentScroll(): void {
  document.documentElement.classList.add(SCROLL_INSTANT_CLASS);
}

export function endInstantDocumentScroll(): void {
  document.documentElement.classList.remove(SCROLL_INSTANT_CLASS);
}

/**
 * Programmatic scroll that must not inherit `scroll-behavior: smooth` from CSS.
 * Uses `scrollTo({ behavior: "instant" })` (CSSOM) with a style fallback for older engines.
 */
export function scrollDocumentInstant(top: number): void {
  const el = document.documentElement;
  const maxScroll = Math.max(0, el.scrollHeight - window.innerHeight);
  const clamped = Math.max(0, Math.min(maxScroll, top));

  try {
    el.scrollTo({ top: clamped, behavior: "instant" });
  } catch {
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollTop = clamped;
    el.style.scrollBehavior = prev;
  }
}
