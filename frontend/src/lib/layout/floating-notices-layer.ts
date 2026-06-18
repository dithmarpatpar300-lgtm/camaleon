/** Promote / demote floating notices for modal stacking. */
type LayerController = {
  promote: () => void;
  demote: () => void;
};

let controller: LayerController | null = null;

export function registerFloatingNoticesLayer(next: LayerController): () => void {
  controller = next;
  return () => {
    if (controller === next) controller = null;
  };
}

/** Move notice hosts into the top layer (above open modal dialogs). */
export function bumpFloatingNoticesLayer(): void {
  if (typeof document !== "undefined" && !document.querySelector("dialog[open]")) {
    return;
  }
  controller?.promote();
}

/** Return hosts to normal fixed stacking (restores modal backdrop blur). */
export function demoteFloatingNoticesLayer(): void {
  controller?.demote();
}

function promoteHost(host: HTMLElement | null): void {
  if (!host) return;
  if (typeof host.showPopover !== "function") return;

  if (!host.hasAttribute("popover")) {
    host.setAttribute("popover", "manual");
  }

  try {
    host.showPopover();
  } catch {
    host.hidePopover();
    host.showPopover();
  }
}

function demoteHost(host: HTMLElement | null): void {
  if (!host) return;
  if (typeof host.hidePopover !== "function") return;
  if (host.matches(":popover-open")) {
    host.hidePopover();
  }
  host.removeAttribute("popover");
}

export function promoteNoticeHosts(
  bottomHost: HTMLElement | null,
  topHost: HTMLElement | null
): void {
  promoteHost(bottomHost);
  promoteHost(topHost);
}

export function demoteNoticeHosts(
  bottomHost: HTMLElement | null,
  topHost: HTMLElement | null
): void {
  demoteHost(bottomHost);
  demoteHost(topHost);
}
