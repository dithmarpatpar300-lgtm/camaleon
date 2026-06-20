/** Visual pulse tone — must match each settings section's identity (border/accent language). */
export type SettingsFocusPulse = "warning" | "accent" | "muted";

/** Deep-link targets inside the settings drawer scroll region. */
export type SettingsFocusTarget =
  | "risk"
  | "offline"
  | "batch"
  | "batch-download"
  | "performance"
  | "notices"
  | "updates"
  | "defaults";

export type SettingsFocusConfig = {
  sectionId: string;
  pulse: SettingsFocusPulse;
  /** When set, pulse this row inside the section instead of the whole card. */
  rowId?: string;
};

export const SETTINGS_FOCUS: Record<SettingsFocusTarget, SettingsFocusConfig> = {
  risk: { sectionId: "settings-section-risk", pulse: "warning" },
  offline: { sectionId: "settings-section-offline", pulse: "accent" },
  batch: { sectionId: "settings-section-batch", pulse: "accent" },
  "batch-download": {
    sectionId: "settings-section-batch",
    pulse: "accent",
    rowId: "settings-row-batch-download",
  },
  performance: { sectionId: "settings-section-performance", pulse: "accent" },
  notices: { sectionId: "settings-section-notices", pulse: "muted" },
  updates: { sectionId: "settings-section-updates", pulse: "accent" },
  defaults: { sectionId: "settings-section-defaults", pulse: "muted" },
};

/** Wait for drawer slide-in before scrolling (matches SettingsDrawer enter animation). */
export const SETTINGS_DRAWER_ENTER_MS = 300;

const SCROLL_TOP_INSET_PX = 16;
const SMOOTH_SCROLL_SETTLE_MS = 520;
const STATIC_HIGHLIGHT_MS = 1800;
const STATIC_OUTRO_MS = 420;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function scrollSettingsSectionIntoView(
  scrollContainer: HTMLElement,
  sectionElement: HTMLElement,
  behavior: ScrollBehavior
): void {
  const containerTop = scrollContainer.getBoundingClientRect().top;
  const sectionTop = sectionElement.getBoundingClientRect().top;
  const targetTop =
    sectionTop - containerTop + scrollContainer.scrollTop - SCROLL_TOP_INSET_PX;

  scrollContainer.scrollTo({
    top: Math.max(0, targetTop),
    behavior,
  });
}

function findFocusCard(section: HTMLElement): HTMLElement | null {
  return section.querySelector<HTMLElement>("[data-settings-focus-card]");
}

function findFocusHighlightTarget(
  section: HTMLElement,
  config: SettingsFocusConfig
): HTMLElement | null {
  if (config.rowId) {
    const row = section.querySelector<HTMLElement>(`#${config.rowId}`);
    if (row) return row;
  }
  return findFocusCard(section);
}

function cleanupFocusCard(card: HTMLElement): void {
  card.classList.remove(
    "settings-section-focus-pulse",
    "settings-section-focus-static",
    "settings-section-focus-static-out"
  );
  delete card.dataset.pulse;
}

function fadeOutFocusCard(card: HTMLElement): Promise<void> {
  card.classList.add("settings-section-focus-static-out");
  return new Promise((resolve) => {
    const done = () => {
      cleanupFocusCard(card);
      resolve();
    };
    card.addEventListener("transitionend", (ev) => {
      if (ev.propertyName === "box-shadow") done();
    }, { once: true });
    window.setTimeout(done, STATIC_OUTRO_MS + 80);
  });
}

function applyPulseHighlight(card: HTMLElement, pulse: SettingsFocusPulse): Promise<void> {
  card.dataset.pulse = pulse;

  if (prefersReducedMotion()) {
    card.classList.add("settings-section-focus-static");
    return wait(STATIC_HIGHLIGHT_MS).then(() => fadeOutFocusCard(card));
  }

  card.classList.add("settings-section-focus-pulse");
  return new Promise((resolve) => {
    card.addEventListener(
      "animationend",
      () => {
        cleanupFocusCard(card);
        resolve();
      },
      { once: true }
    );
  });
}

/**
 * Scroll the settings drawer to a section and pulse its card with the section's visual tone.
 */
export async function runSettingsFocusNavigation(
  scrollContainer: HTMLElement,
  target: SettingsFocusTarget
): Promise<void> {
  const config = SETTINGS_FOCUS[target];
  const section = document.getElementById(config.sectionId);
  if (!section) return;

  const card = findFocusHighlightTarget(section, config);
  if (!card) return;

  const reducedMotion = prefersReducedMotion();
  const behavior: ScrollBehavior = reducedMotion ? "instant" : "smooth";

  const scrollTarget =
    config.rowId != null
      ? (section.querySelector<HTMLElement>(`#${config.rowId}`) ?? section)
      : section;

  scrollSettingsSectionIntoView(scrollContainer, scrollTarget, behavior);

  if (!reducedMotion && behavior === "smooth") {
    await wait(SMOOTH_SCROLL_SETTLE_MS);
  }

  await applyPulseHighlight(card, config.pulse);
}

export type SettingsFocusRequest = {
  target: SettingsFocusTarget;
  /** Bumps when the same target is requested again while the drawer is already open. */
  seq: number;
};

export function createSettingsFocusRequest(target: SettingsFocusTarget): SettingsFocusRequest {
  return { target, seq: Date.now() };
}
