import { DEFAULT_MAX_EDGE, EXTENDED_MAX_EDGE } from "./dimensions";

export type ResizePreset = {
  id: string;
  maxEdge: number;
  labelKey: string;
};

export const RESIZE_PRESETS: ResizePreset[] = [
  { id: "4k", maxEdge: 4096, labelKey: "panel.astroResize.presets.4k" },
  { id: "6k", maxEdge: 6144, labelKey: "panel.astroResize.presets.6k" },
  { id: "8k", maxEdge: DEFAULT_MAX_EDGE, labelKey: "panel.astroResize.presets.8k" },
];

export const EXTENDED_PRESET: ResizePreset = {
  id: "12k",
  maxEdge: EXTENDED_MAX_EDGE,
  labelKey: "panel.astroResize.presets.12k",
};
