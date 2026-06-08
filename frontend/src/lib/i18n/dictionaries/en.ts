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
      "tiff-to-png": {
        title: "TIFF to PNG — Camaleon",
        description: "Convert TIFF to PNG in your browser. Lossless export for scans, print, and archives.",
      },
      "tiff-to-jpg": {
        title: "TIFF to JPG — Camaleon",
        description: "Convert TIFF to JPEG in your browser. Smaller files for web sharing from archival TIFFs.",
      },
      "ico-to-png": {
        title: "ICO to PNG — Camaleon",
        description: "Extract a PNG from ICO or CUR favicon files in your browser. Pick a size when the pack has more than one.",
      },
      "png-to-ico": {
        title: "PNG to ICO — Camaleon",
        description: "Build a Windows favicon (.ico) from PNG in your browser. Pick 16, 32, 48, or 256 px — downscale only.",
      },
      "tga-to-png": {
        title: "TGA to PNG — Camaleon",
        description: "Convert Targa textures and game assets to PNG in your browser. Raw and RLE, with alpha preserved.",
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
    whatsNew: "What's new",
  },

  releaseComms: {
    onboarding: {
      badge: "Welcome",
      title: "Your files stay on your device",
      subtitle:
        "Camaleon converts images entirely in your browser — no uploads, no accounts, no waiting on a server.",
      gotIt: "Got it",
      explore: "Explore transmutations",
      about: "About Camaleon",
      technicalToggle: "How it works technically",
      technical:
        "Rust compiled to WebAssembly runs inside a dedicated Web Worker. Large science images can be downscaled in JavaScript before Wasm. We strip metadata by default, enforce honest limits (40 megapixels, 150 MB), and recycle the worker when you leave a conversion to free memory.",
      highlights: {
        privacy: {
          title: "100% local processing",
          body: "Nothing is uploaded. Your images never leave this tab.",
        },
        tools: {
          title: "15 conversion tools",
          body: "PNG, JPEG, WebP, GIF, BMP, TIFF, ICO, and TGA — lossless and lossy paths where it matters.",
        },
        limits: {
          title: "Honest limits",
          body: "We tell you upfront when a file is too large and offer safe downscale options instead of crashing.",
        },
        i18n: {
          title: "English & Spanish",
          body: "Full UI in both languages, plus dark and light themes.",
        },
      },
    },
    changelog: {
      title: "What's new in {version}",
      gotIt: "Got it",
      remindLater: "Remind me later",
      viewAll: "All updates",
    },
    whatsNew: {
      title: "What's new",
      subtitle: "Release history",
      current: "Current",
      close: "Close",
    },
    tags: {
      feature: "New",
      fix: "Fix",
      perf: "Performance",
      security: "Security",
    },
    entries: {
      v1104: {
        title: "TGA → PNG",
        summary: "Game textures and Targa assets to PNG — raw, RLE, indexed, and 32-bit alpha.",
        technical:
          "New transmutador_tga Wasm module (image 0.25 tga+png). Header probe, TgaDecoder path, orientation normalize, rgb555 honesty, estimate within 5%.",
        highlights: {
          tgaPng: {
            title: "TGA → PNG",
            body: "Convert legacy Targa files for web and editors — uncompressed and RLE textures, alpha when present.",
          },
        },
      },
      v1103: {
        title: "PNG → ICO",
        summary: "Build favicons from PNG — pick 16, 32, 48, or 256 px with honest downscale-only sizing.",
        technical:
          "transmutador_ico encode path: Lanczos3 downscale when max edge exceeds target, no upscale beyond source, IcoEncoder PNG-in-ICO single entry, validate_icon_size presets.",
        highlights: {
          pngIco: {
            title: "PNG → ICO",
            body: "Export a single-resolution favicon for Windows and legacy browsers — presets match common icon sizes.",
          },
        },
      },
      v1102: {
        title: "ICO → PNG",
        summary: "Extract favicon and cursor bitmaps as PNG — multi-size picker included.",
        technical:
          "New transmutador_ico Wasm module (image 0.25 ico+png). ICONDIR probe, entry_index decode for PNG-in-ICO entries, default largest size, .ico and .cur accepted.",
        highlights: {
          icoPng: {
            title: "ICO → PNG",
            body: "Pull a specific size from favicon packs — scrubber when the file embeds more than one resolution.",
          },
        },
      },
      v1101: {
        title: "TIFF → JPEG",
        summary: "Lossy web export from archival TIFF — quality slider and alpha flattening.",
        technical:
          "transmutador_tiff JPEG path: flatten_rgba_on_background, quality validation, page_index on transmute/estimate, alpha detection per IFD for background picker.",
        highlights: {
          tiffJpg: {
            title: "TIFF → JPEG",
            body: "Shrink scans and print masters for web — same multi-page picker, quality presets, and background color when alpha is present.",
          },
        },
      },
      v1100: {
        title: "TIFF → PNG",
        summary: "Archival TIFF support with multi-page picker and 16-bit normalization.",
        technical:
          "New transmutador_tiff Wasm module (image 0.25 + tiff 0.11). IFD probe for page_count, palette/CMYK rejection, page_index on transmute/estimate, and 8-bit downshift matching image cast policy.",
        highlights: {
          tiff: {
            title: "TIFF → PNG",
            body: "Convert scans, print masters, and multi-page TIFFs locally — pick a page when the file has more than one IFD.",
          },
          bitdepth: {
            title: "16-bit honesty",
            body: "High bit-depth sources normalize to 8-bit PNG with documented tone mapping — preview matches output.",
          },
        },
      },
      v190: {
        title: "Tier 2 Wave 1",
        summary: "GIF & BMP suites, smarter limits, and science-image downscale.",
        technical:
          "Four new Wasm modules (GIF/BMP read/write), GIF89a frame compositing, LimitContext preflight, client-side astro downscale via Canvas, and worker recycle on route exit to release Wasm heap memory.",
        highlights: {
          formats: {
            title: "GIF & BMP formats",
            body: "Four new tools: GIF↔PNG and BMP↔PNG, bringing the catalog to 10 active transmutations.",
          },
          gif: {
            title: "GIF frame picker",
            body: "Preview and select a specific animation frame before converting, with proper GIF89a transparency compositing.",
          },
          limits: {
            title: "Adaptive limits",
            body: "Unified LimitContext with precise error messages, dimension blocks, and oversize consent for large files.",
          },
          astro: {
            title: "Science imagery downscale",
            body: "4K–8K presets resize huge astronomical images in-browser before Wasm, so conversions stay within safe memory bounds.",
          },
          memory: {
            title: "Smarter memory lifecycle",
            body: "Leaving a transmutation route recycles the Wasm worker so heavy sessions do not linger in memory.",
          },
        },
      },
    },
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
    tiffPage: {
      title: "TIFF page",
      counter: "{current} / {total}",
      hint: "Scrub to preview another IFD — release to refresh the size estimate.",
      sliderAria: "TIFF page selector",
      previewAlt: "Preview of page {index}",
      loadingPreview: "Rendering preview…",
    },
    icoEntry: {
      title: "Icon size",
      counter: "{current} / {total} · {size}px",
      hint: "Scrub to preview another embedded size — release to refresh the estimate.",
      sliderAria: "ICO size selector",
      previewAlt: "Preview of {size}px entry {index}",
      loadingPreview: "Rendering preview…",
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
    "tiff-to-png": {
      actionTitle: "Convert to PNG",
      description: "Lossless PNG from TIFF — DEFLATE compression for archival and print masters.",
      fidelityHint:
        "16-bit and float sources normalize to 8-bit PNG. Multi-page files: pick one page. Palette and CMYK TIFFs are not supported.",
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
    "ico-to-png": {
      actionTitle: "Extract as PNG",
      description: "Lossless PNG from an icon or cursor file — pick which embedded size to export.",
      fidelityHint:
        "Modern PNG-in-ICO entries are fully supported. Legacy BMP-style ICO layers are rejected with a clear error. .cur files use the same container as .ico.",
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
    "png-to-ico": {
      actionTitle: "Build ICO",
      description: "Single-resolution favicon from PNG — embedded as modern PNG-in-ICO.",
      fidelityHint:
        "Output is downscaled when the source is larger than your preset. Smaller sources are never upscaled — the ICO keeps the original pixel dimensions.",
      options: {
        iconSize: {
          label: "Icon size",
          hint: "Square edge length for the favicon. Common presets: 16, 32, 48, and 256 px.",
          lowerLabel: "",
          upperLabel: "",
          presets: { "16": "16", "32": "32", "48": "48", "256": "256" },
        },
      },
    },
    "tga-to-png": {
      actionTitle: "Convert to PNG",
      description: "Lossless PNG from Targa — DEFLATE compression for textures and game assets.",
      fidelityHint:
        "Raw and RLE TGA supported. 16-bit RGB uses the attribute bit, not alpha — output is RGB PNG. Indexed color maps decode when supported.",
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
    "tiff-to-jpg": {
      actionTitle: "Compress for Web",
      description: "Convert TIFF to JPEG — much smaller files for sharing scans and print masters online.",
      fidelityHint:
        "JPEG is lossy — irreversible. 16-bit sources normalize to 8-bit. Multi-page TIFF: pick one page. Alpha flattens to your chosen background.",
      options: {
        quality: {
          label: "JPEG Quality",
          hint: "Higher quality = larger file. Quality loss is always irreversible.",
          lowerLabel: "Lighter",
          upperLabel: "Faithful",
          presets: { web: "Web", balanced: "Balanced", high: "High" },
        },
        background: {
          label: "Background color",
          hint: "Only affects images with transparency.",
          customAria: "Custom background color",
          swatches: { white: "White", black: "Black", gray: "Gray" },
        },
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
    tiffPalette: "Indexed-color (palette) TIFF is not supported. Re-export as RGB or grayscale first.",
    tiffCmyk: "CMYK TIFF is not supported. Re-export as RGB from your print tool first.",
    tiffPageRange: "That TIFF page does not exist. Pick a page within the file.",
    icoEntryRange: "That icon size entry does not exist. Pick a size within the file.",
    icoBmpLegacy:
      "Legacy BMP-style ICO layer is not supported. Re-save the icon with a modern tool (PNG-in-ICO).",
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
