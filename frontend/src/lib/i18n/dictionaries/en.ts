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
      "gif-to-png": {
        title: "GIF to PNG — Camaleon",
        description: "Convert GIF to PNG in your browser. Pick any animation frame — lossless raster export.",
      },
      "gif-to-jpg": {
        title: "GIF to JPG — Camaleon",
        description: "Convert GIF to JPG in your browser. Pick any frame — compressed for web.",
      },
      "bmp-to-png": {
        title: "BMP to PNG — Camaleon",
        description: "Convert BMP to PNG in your browser. Lossless compression for uncompressed bitmaps.",
      },
      "bmp-to-jpg": {
        title: "BMP to JPG — Camaleon",
        description: "Convert BMP to JPG in your browser. Smaller files for photos and web use.",
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

  prepare: {
    ariaLabel: "Preparing file: {phase}, {percent}% complete",
    progressLabel: "Progress",
    switchToBar: "Switch to bar view",
    switchToRing: "Switch to ring view",
    gifFrameProgress: "Frame {current}",
    bmpMeta: "{width} × {height} · {bpp}-bit",
    phases: {
      reading: "Reading file…",
      engine: "Loading conversion engine…",
      analyze: "Analyzing image…",
      analyzeGif: "Reading animation frames…",
      analyzeBmp: "Reading bitmap header…",
      analyzeSkippedLimit: "Skipping deep analysis — file exceeds engine limit",
      finalize: "Preparing workspace…",
      resizing: "Resizing image…",
      transmuting: "Transmuting…",
    },
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
    cancel: "Cancel",
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
    prepareFailed: "Could not prepare this file. Try another image or a different format.",
    transmuteUnavailable: "File exceeds engine limit",
    largeFile: {
      title: "File exceeds engine limit",
      body: "This file is larger than the {limit} limit. You can adjust options, but conversion is disabled until you use a smaller file.",
      bmpBody: "Uncompressed BMP files grow quickly — this file exceeds the {limit} limit. Resize or re-export from source before converting.",
    },
    hardLimit: {
      title: "File too large",
      body: "This file exceeds the maximum supported size ({limit}). Try resizing it or use a desktop tool before converting here.",
    },
    oversize: {
      title: "Large file — confirmation required",
      body: "This file is {size} (above the {softLimit} default). Processing may temporarily use about {peakRam} of browser memory and slow this tab.",
      nearPixelLimit: "This image is {megapixels} MP — close to the {maxMp} MP browser safety limit.",
      outputHint: "Output size depends on quality and format — it may be larger or smaller than the original.",
      privacy: "Your file never leaves this device — all processing happens locally in your browser.",
      consent: "I understand — process this file anyway",
      blockedButton: "Confirm above to transmute",
    },
    dimensionsBlock: {
      title: "Image too large to process in the browser",
      body: "{width} × {height} ({megapixels} MP) exceeds the {maxMp} MP limit for in-browser conversion.",
      astroHint: "Science and space imagery (Hubble, JWST, etc.) often exceeds browser limits. Resize or tile the image with an astronomy pipeline before converting here.",
      action: "Reduce dimensions in a desktop editor, or export a smaller preview from your source archive.",
      resizeHint: "You can downscale in your browser to continue — resolution is reduced, but tone and color are preserved.",
      resizeCta: "Resize to continue",
    },
    astroResize: {
      title: "Downscale to continue",
      body: "Choose a maximum edge length. The image is resized locally in your browser before conversion.",
      target: "Target: {width} × {height} ({megapixels} MP) · peak RAM ~{peakRam}",
      extendedConsent: "I understand — 12K downscale may use significant memory on this device",
      extendedHint:
        "12K is for desktop devices with enough RAM. The result must still fit the {maxMp} MP browser limit — wide images may need a smaller preset.",
      exceedsPixelLimit:
        "{width} × {height} ({megapixels} MP) exceeds the {maxMp} MP limit — choose a smaller preset.",
      presetOverLimit: "Exceeds the {maxMp} MP browser limit for this image aspect ratio",
      privacy: "Your original file is unchanged. Downscaling happens entirely on this device.",
      apply: "Apply resize",
      applying: "Resizing…",
      presets: {
        "4k": "4K (4096 px)",
        "6k": "6K (6144 px)",
        "8k": "8K (8192 px)",
        "12k": "12K (12288 px)",
      },
    },
    resizedMeta: {
      notice: "Resized from {width} × {height} — original file unchanged",
    },
    outputSizeNotice: {
      body: "Estimated output is {size} — above the usual {limit} threshold. Conversion can continue; processing may take longer and use more memory.",
    },
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
      estimateUnavailable: "Estimate unavailable for this file.",
      consentRequired: "Confirm the large-file notice above to enable estimate and transmute.",
      pixelsBlocked: "Dimensions exceed the browser limit — estimate unavailable.",
      estimateInterrupted: "Estimate was interrupted — tap Calculate again.",
      cacheReady: "Ready to transmute",
    },
    gifFrame: {
      title: "Animation frame",
      counter: "{current} / {total}",
      hint: "Scrub for instant preview — release to update the size estimate. Disposal methods are applied for an accurate composite.",
      sliderAria: "GIF frame selector",
      previewAlt: "Preview of frame {index}",
      loadingMeta: "Reading GIF frames…",
      loadingPreview: "Rendering preview…",
      noPreview: "Preview unavailable",
    },
    bmpEstimate: {
      growthWarning: "Estimated PNG is larger than this BMP — noisy or high-entropy content may not compress well with DEFLATE.",
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
    "gif-to-png": {
      actionTitle: "Convert to PNG",
      description: "Lossless PNG from GIF — palette and transparency preserved as raster pixels.",
      fidelityHint: "Animated GIFs: pick any frame with the scrubber. Output PNG may be much larger than the GIF source.",
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
    "gif-to-jpg": {
      actionTitle: "Compress for Web",
      description: "Convert GIF to JPEG — smaller files at your chosen quality.",
      fidelityHint: "Animated GIFs: pick any frame with the scrubber. JPEG is lossy — transparency is flattened to your chosen background.",
      options: {
        quality: { label: "JPEG Quality", hint: "Higher quality = larger file. Quality loss is always irreversible.", lowerLabel: "Lighter", upperLabel: "Faithful", presets: { web: "Web", balanced: "Balanced", high: "High" } },
        background: { label: "Background color", hint: "Only affects images with transparency.", customAria: "Custom background color", swatches: { white: "White", black: "Black", gray: "Gray" } },
      },
    },
    "bmp-to-png": {
      actionTitle: "Convert to PNG",
      description: "Lossless PNG from BMP — DEFLATE compression for uncompressed bitmaps.",
      fidelityHint: "BMP is typically uncompressed; PNG often shrinks the file. Very large bitmaps may still produce large PNGs.",
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
    "bmp-to-jpg": {
      actionTitle: "Compress for Web",
      description: "Convert BMP to JPEG — much smaller files for photos and web.",
      fidelityHint: "JPEG is lossy — quality loss is irreversible. 32-bit BMP transparency is flattened to your chosen background.",
      options: {
        quality: { label: "JPEG Quality", hint: "Higher quality = larger file. Quality loss is always irreversible.", lowerLabel: "Lighter", upperLabel: "Faithful", presets: { web: "Web", balanced: "Balanced", high: "High" } },
        background: { label: "Background color", hint: "Only affects images with transparency.", customAria: "Custom background color", swatches: { white: "White", black: "Black", gray: "Gray" } },
      },
    },
  },

  errors: {
    emptyInput: "The file is empty. Please select a valid image.",
    tooLarge: "The file is too large. Maximum size is 50 MB.",
    inputTooLarge: "Input exceeds the session limit ({maxMb} MB). Try a smaller file or confirm the large-file notice.",
    wrongFormat: "Unsupported file format. Please use {formats}.",
    corrupt: "The file appears to be corrupt. Please select a valid image.",
    dimensionsTooLarge: "{width} × {height} ({megapixels} MP) exceeds the {maxMp} MP browser limit.",
    dimensionsTooLargeGeneric:
      "Target dimensions exceed the browser megapixel limit. Choose a smaller resize preset.",
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
