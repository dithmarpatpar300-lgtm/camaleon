export {
  DEFAULT_MAX_EDGE,
  EXTENDED_MAX_EDGE,
  computeTargetDimensions,
  assertWithinPixelLimit,
  isWithinPixelLimit,
  presetExceedsPixelLimit,
  pickLargestValidPresetEdge,
  getMaxEdgeForDevice,
  allowsExtendedMaxEdge,
  type TargetDimensions,
} from "./dimensions";

export { RESIZE_PRESETS, EXTENDED_PRESET, type ResizePreset } from "./presets";

export {
  downscaleImageBytes,
  type DownscaleProgress,
  type DownscaleResult,
} from "./downscale-image";
