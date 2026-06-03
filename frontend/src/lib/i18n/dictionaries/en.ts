import type { Dictionary } from "../types";

const en: Dictionary = {
  meta: {
    title: "Camaleon — Transmute files in your browser",
    description: "Local, privacy-first file transmutation",
  },

  nav: {
    transmutations: "Transmutations",
    mainNavAria: "Main navigation",
  },

  lang: {
    switchToEn: "Switch language to English",
    switchToEs: "Switch language to Spanish",
  },

  theme: {
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
  },

  footer: {
    privacy: "100% local. Your files never leave your device.",
    version: "Camaleon v{version} — MIT",
  },

  landing: {
    hero: {
      title: "Transmute files",
      tagline: "Matter is neither created nor destroyed, it is only transmuted.",
    },
    privacy: {
      text: "100% local. Your files never leave your device.",
    },
    tools: {
      available: "Available transmutations",
      comingSoon: "Coming soon",
    },
  },

  badges: {
    lossless: "Lossless",
    lossy: "Lossy",
    soon: "Soon",
  },

  toolCard: {
    transmute: "Transmute",
  },

  dropzone: {
    idleLabel: "Drag & drop an image here, or click to select",
    dragLabel: "Release to transmute",
    processingLabel: "Transmuting...",
    ariaLabel: "Select an image file to transmute",
  },

  panel: {
    stagedFileSize: "{size}",
    changeFile: "Change",
    transmuteButton: "Transmute",
    initializing: "Initializing...",
    processing: "Transmuting {fileName}...",
    processingFallback: "Transmuting...",
    size: "Size",
    download: "Download",
    transmuteAnother: "Transmute another",
    errorTitle: "Transmutation failed",
    adjustAndRetry: "Adjust & retry",
    startOver: "Start over",
    engineReady: "Ready",
    engineInit: "Initializing...",
    engineLabel: "Engine: {status}",
    fmtError: "This tool accepts: {formats}",
    notReadyError: "Engine is still initializing. Please wait a moment and try again.",
    unexpectedError: "An unexpected error occurred",
    previewAlt: "Preview of {fileName}",
  },

  tools: {
    "jpg-to-png": {
      description: "Lossless conversion — preserves every pixel perfectly.",
      fidelityHint:
        "File size may increase for photos — PNG is a master/editing format, not for shrinking.",
      options: {
        compression: {
          label: "PNG Compression",
          hint: "Always lossless — higher compression = smaller file + slower processing.",
          lowerLabel: "Faster",
          upperLabel: "Smaller",
          presets: {
            fast: "Fast",
            balanced: "Balanced",
            minimal: "Minimal",
          },
        },
      },
    },
    "png-to-jpg": {
      description: "Compressed for web — smaller files at quality 85.",
      fidelityHint:
        "Quality loss is irreversible. Transparency is flattened to white by default.",
      options: {
        quality: {
          label: "JPEG Quality",
          hint: "Higher quality = larger file. Quality loss is always irreversible.",
          lowerLabel: "Lighter",
          upperLabel: "Faithful",
          presets: {
            web: "Web",
            balanced: "Balanced",
            high: "High",
          },
        },
        background: {
          label: "Background color",
          hint: "Only affects images with transparency.",
          customAria: "Custom background color",
          swatches: {
            white: "White",
            black: "Black",
            gray: "Gray",
          },
        },
      },
    },
    "webp-to-png": {
      description: "Convert modern WebP images to universal PNG format.",
    },
  },

  errors: {
    emptyInput: "The file is empty. Please select a valid image.",
    tooLarge: "The file is too large. Maximum size is 50 MB.",
    wrongFormat: "Unsupported file format. Please use {formats}.",
    corrupt: "The file appears to be corrupt. Please select a valid image.",
    dimensionsTooLarge: "The image dimensions exceed the maximum allowed ({max} pixels).",
    notAvailable: "This conversion is not yet available.",
    engineNotReady: "The transmutation engine is still starting. Please try again.",
    generic: "Transmutation failed. Please try again.",
  },
};

export default en;
