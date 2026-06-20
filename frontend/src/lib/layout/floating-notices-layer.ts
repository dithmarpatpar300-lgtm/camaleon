/** Promote / demote floating notices for modal stacking. */
type LayerController = {
  promote: () => void;
  demote: () => void;
};

let controller: LayerController | null = null;
let toastHoldCount = 0;
let modalHoldCount = 0;
type LayerMode = "idle" | "promoted" | "demoted";
let layerMode: LayerMode = "idle";

function syncBodyModalOpen(): void {
  if (typeof document === "undefined") return;
  if (modalHoldCount > 0) {
    document.body.dataset.modalOpen = "true";
  } else {
    delete document.body.dataset.modalOpen;
  }
}

/**
 * While a modal is open, bottom notices mount inside the dialog (not inert).
 * Popover promotion applies only when no modal is blocking the document.
 */
function applyLayerState(): void {
  syncBodyModalOpen();

  if (modalHoldCount > 0) {
    if (layerMode !== "demoted") {
      controller?.demote();
      layerMode = "demoted";
    }
    return;
  }

  if (toastHoldCount > 0) {
    if (layerMode !== "promoted") {
      controller?.promote();
      layerMode = "promoted";
    }
    return;
  }

  if (layerMode !== "idle") {
    controller?.demote();
    layerMode = "idle";
  }
}

/** Re-promote after layout changes when only toasts are active (no modal). */
export function refreshFloatingNoticesLayer(): void {
  if (modalHoldCount > 0) return;
  if (toastHoldCount > 0 && layerMode !== "promoted") {
    controller?.promote();
    layerMode = "promoted";
  }
}

export function registerFloatingNoticesLayer(next: LayerController): () => void {
  controller = next;
  syncBodyModalOpen();
  if (layerMode === "promoted") {
    controller.promote();
  } else if (layerMode === "demoted") {
    controller.demote();
  }
  return () => {
    if (controller === next) controller = null;
  };
}

/** Test-only reset for module-level hold counters. */
export function resetFloatingNoticesLayerForTests(): void {
  toastHoldCount = 0;
  modalHoldCount = 0;
  layerMode = "idle";
  syncBodyModalOpen();
}

export function getModalHoldCount(): number {
  return modalHoldCount;
}

/** Keep notices in the top layer while at least one toast is visible (no modal open). */
export function bumpFloatingNoticesLayer(): void {
  toastHoldCount += 1;
  applyLayerState();
}

export function releaseFloatingNoticesToastLayer(): void {
  toastHoldCount = Math.max(0, toastHoldCount - 1);
  applyLayerState();
}

/** Modal open: hide top notices behind dialog; bottom notices use in-dialog portal. */
export function holdFloatingNoticesForModal(): () => void {
  modalHoldCount += 1;
  applyLayerState();
  return () => {
    modalHoldCount = Math.max(0, modalHoldCount - 1);
    applyLayerState();
  };
}

/** @deprecated Use releaseFloatingNoticesToastLayer */
export function demoteFloatingNoticesLayer(): void {
  releaseFloatingNoticesToastLayer();
}

function promoteHost(host: HTMLElement | null): void {
  if (!host) return;
  if (typeof host.showPopover !== "function") return;

  if (!host.hasAttribute("popover")) {
    host.setAttribute("popover", "manual");
  }

  try {
    if (host.matches(":popover-open")) {
      host.hidePopover();
    }
    host.showPopover();
  } catch {
    try {
      host.hidePopover();
      host.showPopover();
    } catch {
      host.classList.add("floating-notices-host--elevated");
    }
  }
}

function demoteHost(host: HTMLElement | null): void {
  if (!host) return;
  host.classList.remove("floating-notices-host--elevated");
  if (typeof host.hidePopover !== "function") return;
  if (host.matches(":popover-open")) {
    host.hidePopover();
  }
  host.removeAttribute("popover");
}

export function promoteNoticeHosts(
  bottomHost: HTMLElement | null,
  topHost: HTMLElement | null,
  bottomLeftHost: HTMLElement | null = null
): void {
  promoteHost(bottomHost);
  promoteHost(topHost);
  promoteHost(bottomLeftHost);
}

export function demoteNoticeHosts(
  bottomHost: HTMLElement | null,
  topHost: HTMLElement | null,
  bottomLeftHost: HTMLElement | null = null
): void {
  demoteHost(bottomHost);
  demoteHost(topHost);
  demoteHost(bottomLeftHost);
}
