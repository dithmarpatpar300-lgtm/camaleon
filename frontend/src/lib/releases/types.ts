export type ReleaseTag = "feature" | "fix" | "security" | "perf";

export type ReleaseHighlightIcon =
  | "shield"
  | "sparkle"
  | "tool"
  | "cpu"
  | "image"
  | "memory";

export type ReleaseHighlight = {
  id: string;
  icon: ReleaseHighlightIcon;
  titleKey: string;
  bodyKey: string;
};

export type ReleaseEntry = {
  version: string;
  date: string;
  titleKey: string;
  summaryKey: string;
  highlights: ReleaseHighlight[];
  technicalKey?: string;
  tags?: ReleaseTag[];
};

export type OnboardingContent = {
  titleKey: string;
  subtitleKey: string;
  highlights: ReleaseHighlight[];
  technicalKey: string;
};

export type ReleaseManifest = {
  entries: ReleaseEntry[];
  onboarding: OnboardingContent;
};
