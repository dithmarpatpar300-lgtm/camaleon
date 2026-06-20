/** Host stacks portaled to document.body or inside an open modal dialog. */
export const FLOATING_NOTICE_HOST_SELECTOR =
  ".floating-notices-bottom-host, .floating-notices-top-host, .floating-notices-bottom-left-host, .surface-modal-notices-slot";

/** Interactive notice surfaces (also portaled — may sit under modal top layer). */
export const FLOATING_NOTICE_SURFACE_SELECTOR =
  ".floating-notice-stack, .toast-card, .app-update-notice, .offline-status-notice, .offline-promo-notice";

export const FLOATING_NOTICE_LAYER_SELECTOR = `${FLOATING_NOTICE_HOST_SELECTOR}, ${FLOATING_NOTICE_SURFACE_SELECTOR}`;

/** True when any element at a point belongs to the floating notices layer. */
export function isPointOverFloatingNotices(clientX: number, clientY: number): boolean {
  if (typeof document === "undefined") return false;

  return document.elementsFromPoint(clientX, clientY).some((el) => {
    if (!(el instanceof Element)) return false;
    return !!el.closest(FLOATING_NOTICE_LAYER_SELECTOR);
  });
}

/** True when a DOM node sits inside the floating notices layer. */
export function isNodeWithinFloatingNotices(node: EventTarget | null): boolean {
  if (!(node instanceof Element)) return false;
  return !!node.closest(FLOATING_NOTICE_LAYER_SELECTOR);
}
