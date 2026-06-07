import type { Dictionary } from "../types";

const en: Dictionary = {
  meta: {
    title: "Camaleon — Transmute files in your browser",
    description: "Local, privacy-first file transmutation",
    tools: {
      "jpg-to-png": {
        title: "JPG to PNG — Camaleon",
        description: "Lossless JPG to PNG conversion. Preserves every pixel perfectly — local and private.",
      },
      "png-to-jpg": {
        title: "PNG to JPG — Camaleon",
        description: "Convert PNG to JPG in your browser. Compressed for web — local and private.",
      },
      "webp-to-jpg": {
        title: "WebP to JPG — Camaleon",
        description: "Convert WebP to JPG in your browser. Compressed for web — local and private.",
      },
      "webp-to-png": {
        title: "WebP to PNG — Camaleon",
        description: "Convert WebP to PNG in your browser. Lossless raster storage — local and private.",
      },
      "png-to-webp": {
        title: "PNG to WebP — Camaleon",
        description: "Convert PNG to lossless WebP in your browser. Smaller files for web graphics — local and private.",
      },
      "jpg-to-webp": {
        title: "JPEG to WebP — Camaleon",
        description: "Convert JPEG to lossless WebP in your browser. Local and private — note output may be larger than the source.",
      },
    },
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
    about: "About",
    contact: "Contact",
    privacyPolicy: "Privacy",
    terms: "Terms",
    legalNav: "Legal",
    copyright: "© {year} {name} · {license}",
    version: "v{version}",
    github: "GitHub",
    shortcuts: "Shortcuts",
    shortcutsTitle: "Keyboard shortcuts",
    shortcutOpenPalette: "Open transmutations",
    shortcutClose: "Close",
    engineReady: "Engine ready",
    engineInit: "Engine starting…",
  },

  legal: {
    backHome: "Back to home",
    lastUpdated: "Last updated: {date}",
  },

  landing: {
    hero: {
      title: "Transmute files",
      tagline: "Matter is neither created nor destroyed, it is only transmuted.",
    },
    privacy: {
      text: "100% local. Your files never leave your device.",
      learnMore: "Privacy policy",
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
    pageOverlayLabel: "Release to transmute this file",
  },

  panel: {
    stagedFileSize: "{size}",
    changeFile: "Change",
    transmuteButton: "Transmute",
    initializing: "Initializing...",
    processing: "Transmuting {fileName}...",
    processingFallback: "Transmuting...",
    size: "Size",
    result: {
      final: "Final size",
    },
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
    transparencyNotice: {
      title: "This image has transparency",
      bodyPrefix: "Transparent areas will be flattened onto ",
      bodySuffix: " before JPEG encoding. JPEG does not support transparency.",
      pillAriaLabel: "Background color: {color}. Click to change.",
      pickerTitle: "Flatten onto",
      pickerHint: "Only affects transparent pixels.",
    },
    metrics: {
      original: "Original size",
      estimated: "Estimated size",
      calculating: "Calculating",
      calculate: "Calculate estimate",
      largeFileHint: "Large file — tap to calculate estimated size.",
      cacheReady: "Ready to transmute",
    },
  },

  tools: {
    "jpg-to-png": {
      actionTitle: "Preserve Quality",
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
      actionTitle: "Compress for Web",
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
    "webp-to-jpg": {
      actionTitle: "Compress for Web",
      description: "Convert WebP to JPEG — smaller files at your chosen quality.",
      fidelityHint: "JPEG is lossy — quality loss is irreversible. WebP was likely already compressed; re-encoding adds a second lossy generation. Transparency is flattened to your chosen background.",
      options: {
        quality: { label: "JPEG Quality", hint: "Higher quality = larger file. Quality loss is always irreversible.", lowerLabel: "Lighter", upperLabel: "Faithful", presets: { web: "Web", balanced: "Balanced", high: "High" } },
        background: { label: "Background color", hint: "Only affects images with transparency.", customAria: "Custom background color", swatches: { white: "White", black: "Black", gray: "Gray" } },
      },
    },
    "webp-to-png": {
      actionTitle: "Convert to PNG",
      description: "Lossless raster storage — preserves every pixel from the WebP source.",
      fidelityHint: "Output PNG will be larger than the WebP source — PNG stores the full uncompressed raster.",
      options: {
        compression: {
          label: "PNG Compression",
          hint: "Always lossless — higher compression = smaller file + slower processing.",
          lowerLabel: "Faster",
          upperLabel: "Smaller",
          presets: { fast: "Fast", balanced: "Balanced", minimal: "Minimal" },
        },
      },
    },
    "png-to-webp": {
      actionTitle: "Convert to Lossless WebP",
      description: "Lossless WebP — preserves every pixel including transparency.",
      fidelityHint: "Output is lossless VP8L WebP. Graphics and screenshots often shrink 20–30%; photographic PNGs may end up larger than the source.",
    },
    "jpg-to-webp": {
      actionTitle: "Convert to Lossless WebP",
      description: "Lossless WebP from JPEG — every decoded pixel preserved in VP8L format.",
      fidelityHint: "Lossless WebP from an already-compressed JPEG usually produces a significantly larger file (often 2x-10x). Best for archival round-trips, not for shrinking photos.",
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

  toast: {
    downloadStarted: "Download started",
    dismiss: "Dismiss",
  },

  colors: {
    white: "White",
    black: "Black",
    gray: "Gray",
  },

  commandPalette: {
    ariaLabel: "Command palette — navigate transmutations",
    triggerAriaLabel: "Open command palette",
    title: "Transmutations",
    categoryImage: "Image",
    categorySoon: "Coming soon",
    closeHint: "Esc to close",
  },
};

export default en;
