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
      "avif-to-png": {
        title: "AVIF to PNG — Camaleon",
        description: "Convert AVIF to PNG in your browser. Universal raster export from modern AV1 images — local and private.",
      },
      "avif-to-jpg": {
        title: "AVIF to JPG — Camaleon",
        description: "Convert AVIF to JPEG in your browser. Compressed for web — local and private.",
      },
      "png-to-avif": {
        title: "PNG to AVIF — Camaleon",
        description: "Convert PNG to AVIF in your browser. Modern AV1 compression — local and private.",
      },
      "jpg-to-avif": {
        title: "JPEG to AVIF — Camaleon",
        description: "Convert JPEG to AVIF in your browser. Smaller modern delivery format — local and private.",
      },
    },
  },

  nav: {
    transmutations: "Transmutations",
    mainNavAria: "Main navigation",
    searchPlaceholder: "Search tools…",
    searchPlaceholderShort: "Search…",
    searchAriaLabel: "Search transmutation tools",
  },

  lang: {
    switchToEn: "Switch language to English",
    switchToEs: "Switch language to Spanish",
  },

  theme: {
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
  },

  settings: {
    title: "Settings",
    subtitle: "Preferences",
    close: "Close settings",
    openAria: "Open settings",
    versionFootnote: "Camaleon v{version}",
    general: {
      section: "General",
      languageLabel: "Language",
      languageHint: "Interface copy and tool descriptions.",
      langEn: "English",
      langEs: "Spanish",
      themeLabel: "Theme",
      themeHint: "Light or dark appearance across the app.",
      themeLight: "Light",
      themeDark: "Dark",
    },
    tools: {
      section: "Transmutation defaults",
      jpegQualityLabel: "JPEG quality",
      jpegQualityHint: "Default for PNG/WebP/GIF/BMP/TIFF → JPEG and similar lossy routes.",
      pngCompressionLabel: "PNG compression",
      pngCompressionHint: "Default effort (1 fast – 9 smallest) for routes that output PNG.",
      avifQualityLabel: "AVIF quality",
      avifQualityHint: "Default for PNG/JPEG → AVIF encode tools.",
      avifSpeedLabel: "AVIF encode speed",
      avifSpeedHint: "Default ravif speed (1 slowest – 10 fastest) for AVIF encode.",
      backgroundLabel: "Alpha flatten background",
      backgroundHint: "Default background when transparency is flattened to JPEG.",
      backgroundSwatches: {
        white: "White background",
        black: "Black background",
        gray: "Gray background",
      },
      resetAction: "Reset to factory",
      resetDone: "Transmutation defaults restored to factory values.",
    },
    performance: {
      section: "Performance",
      tierLabel: "Performance profile",
      tierHint: "Override adaptive tier detection. Auto uses device signals.",
      tierAuto: "Auto",
      tierConservative: "Conservative",
      tierBalanced: "Balanced",
      tierAggressive: "Aggressive",
      cacheLabel: "Result cache",
      cacheHint: "Reuse encoded output when sliders change on supported routes.",
      autoEstimateLabel: "Auto-estimate size",
      autoEstimateHint: "Run output size estimate when options change.",
      modeAuto: "Auto",
      modeOn: "On",
      modeOff: "Off",
      resetAction: "Reset to adaptive",
      resetDone: "Performance settings restored to adaptive defaults.",
    },
    notices: {
      section: "Notices & prepare",
      densityLabel: "Notice detail",
      densityHint: "Minimal hides informational notices; warnings and errors always show.",
      densityNormal: "Normal",
      densityMinimal: "Minimal",
      progressLabel: "Prepare progress",
      progressHint: "Ring or bar indicator while a file is being prepared.",
      progressRing: "Ring",
      progressBar: "Bar",
      resetAction: "Reset to defaults",
      resetDone: "Notice and prepare preferences restored.",
    },
    updates: {
      section: "Updates",
      changelogLabel: "Release notes on update",
      changelogHint: "Show what's new when you visit after a version bump.",
      whatsNewLabel: "Release history",
      whatsNewHint: "Browse all shipped versions and highlights.",
      whatsNewAction: "Open What's New",
      welcomeLabel: "Welcome message",
      welcomeHint: "Show the first-visit privacy intro again on the home page.",
      welcomeAction: "Show again",
      welcomeResetDone: "Welcome message will appear on your next home visit.",
    },
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
          title: "19 conversion tools",
          body: "PNG, JPEG, WebP, GIF, BMP, TIFF, ICO, TGA, and AVIF (encode + decode) — lossless and lossy paths where it matters.",
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
      v234: {
        title: "Notices & prepare settings",
        summary:
          "Choose notice rail density and prepare progress style in Settings — minimal mode hides info-only notices.",
        technical:
          "Settings S4: notices-prefs.ts, filterNoticesForDensity in NoticeRail, prepare style in user-settings with legacy migration. Vitest test:notices-prefs. App v2.3.4.",
        highlights: {
          noticeDensity: {
            title: "Quieter notice rail",
            body: "Minimal density hides informational notices; warnings about limits, performance, and fidelity stay visible.",
          },
          prepareProgress: {
            title: "Prepare progress in Settings",
            body: "Pick ring or bar for file prepare — same preference as the in-flow toggle, now in the drawer.",
          },
        },
      },
      v233: {
        title: "Performance settings",
        summary:
          "Override adaptive tier, result cache, and auto-estimate from Settings — changes apply live without reloading.",
        technical:
          "Settings S3: performance-prefs.ts, buildResourceProfileForTier, applyPerformancePrefs in useAdaptiveResourceProfile. Stored in camaleon-user-settings-v1.performance. Vitest test:performance. App v2.3.3.",
        highlights: {
          performancePrefs: {
            title: "Tune for your device",
            body: "Pick Conservative, Balanced, or Aggressive to override auto tier detection — or force cache and estimate on/off independently.",
          },
          settingsPerformance: {
            title: "Performance section in Settings",
            body: "New Performance block with Auto/On/Off segments and reset to adaptive — same static segment pattern as theme.",
          },
        },
      },
      v232: {
        title: "Transmutation defaults",
        summary:
          "Set global JPEG quality, PNG compression, AVIF encode options, and alpha flatten background in Settings — every tool starts with your preferred values.",
        technical:
          "Settings S2: transmutation-defaults.ts, build-default-options.ts, resolveSpecDefault by output format. Stored in camaleon-user-settings-v1.transmutation. Vitest test:defaults. App v2.3.2.",
        highlights: {
          defaults: {
            title: "Your encode defaults, everywhere",
            body: "Adjust sliders once in Settings; PNG→JPG, JPG→PNG, PNG→AVIF, and alpha flatten routes pick them up on the next conversion.",
          },
          settingsTools: {
            title: "Tools section in Settings",
            body: "New Transmutation defaults block with reset to factory — session sliders on each tool still override when you need a one-off change.",
          },
        },
      },
      v231: {
        title: "Settings panel",
        summary:
          "A new preferences drawer centralizes language, theme, and update notifications — plus a refined header utility cluster with an animated settings cog.",
        technical:
          "SettingsProvider + SettingsDrawer (S1). user-settings.ts (camaleon-user-settings-v1). ThemeSegment uses static active cells. Utility cluster alignment + settings trigger states. SPEC §7.13. App v2.3.1.",
        highlights: {
          settingsPanel: {
            title: "Preferences in one place",
            body: "Open the gear in the header for language, theme, release notes toggle, What's New, and welcome reset — without losing quick header toggles.",
          },
          utilityCluster: {
            title: "Polished header controls",
            body: "Settings, language, and theme buttons align cleanly; the cog glows green when idle and turns red while Settings is open.",
          },
          releasePrefs: {
            title: "Control update prompts",
            body: "Choose whether to see release notes after a version bump — the full history stays one tap away.",
          },
        },
      },
      v230: {
        title: "Operational Notice Rail",
        summary:
          "A new context rail in every conversion tool explains when estimation or transmutation may take longer, when limits apply, and when format-specific caveats matter — adaptive across all 19 tools.",
        technical:
          "NoticeRail + lib/notices resolvers (limit, fidelity, performance, estimate). tool-notice-profiles.ts per tool; L0–L3 cost tiers; useEstimateElapsed; cacheReadySlow; FilePrepareGate detailLabel. Vitest test:notices. Legacy notice components removed. App v2.3.0.",
        highlights: {
          noticeRail: {
            title: "Context rail for every tool",
            body: "Up to two prioritized notices between options and size metrics — warnings, limits, and format honesty without modal fatigue.",
          },
          adaptivePerf: {
            title: "Adaptive slow-path guidance",
            body: "AVIF encode, large megapixel files, low speed presets, and elevated byte zones trigger clear, friendly expectations before you transmute.",
          },
          estimateLifecycle: {
            title: "Smarter estimate & transmute feedback",
            body: "Long-running estimates show progress copy after 3 seconds; heavy settings get a “may take a while” ready state and transmute spinner hints.",
          },
        },
      },
      v220: {
        title: "PNG & JPEG → AVIF",
        summary:
          "Eighteenth and nineteenth tools: create AVIF in your browser from PNG or JPEG. Quality and speed sliders, semantic alpha on PNG, and honest generational-loss copy on JPEG.",
        technical:
          "Tier 3.2.0–3.2.2: transmutador_avif_encode (ravif, ~1.67 MB Wasm split from decode). estimate_png/jpg_to_avif_size; worker encodeSource routing. Engine v1.6.0.",
        highlights: {
          pngAvif: {
            title: "PNG → AVIF",
            body: "Encode modern AV1 stills locally — quality + speed control; meaningful alpha preserved when pixels are truly transparent.",
          },
          jpgAvif: {
            title: "JPEG → AVIF",
            body: "Complete the inbound AVIF pair — smaller files for web delivery with a clear lossy-on-lossy honesty hint.",
          },
          encodeCrate: {
            title: "Split encode module",
            body: "AVIF encode ships as its own lazy-loaded Wasm crate so decode and encode each stay within the 3 MB bundle budget.",
          },
        },
      },
      v211: {
        title: "AVIF → JPEG + smoother previews",
        summary:
          "Seventeenth tool: convert AVIF to JPEG in-browser. Animated AVIF and GIF scrubbers decode in the background — instant frame changes after warm-up, no flicker.",
        technical:
          "Tier 3.1.2: transmutador_avif JPEG exports + assess_alpha. frame-preview.worker + session cache; RgbaFrameScrubber coalesced paint; transmute blocked while stale estimate. Engine v1.5.1.",
        highlights: {
          avifJpg: {
            title: "AVIF → JPEG",
            body: "Complete the AVIF outbound pair — quality slider, background flatten, semantic alpha, lossy-on-lossy honesty.",
          },
          framePreview: {
            title: "Animated preview UX",
            body: "Frames warm up off the main thread; scrubbing stays responsive with LRU cache and no per-frame loading overlay.",
          },
          transmuteSync: {
            title: "Estimate-aware Transmute",
            body: "The button waits when the size on screen is outdated and still recalculating — then re-enables when aligned.",
          },
        },
      },
      v200: {
        title: "Tier 3 — AVIF decode",
        summary:
          "Camaleon 2.0 opens the modern formats era: convert AVIF to PNG in-browser, scrub animated AVIF frames, and process large science images with restored 150 MB / 40 MP limits.",
        technical:
          "Tier 3.1.0–3.1.1: transmutador_avif (zenavif), normalize_avif_input, AvifFrameScrubber, estimate + worker frame_index. Hotfixes: sessionLimitForBytes, prepare pixel guard, astro post-resize consent. Engine v1.5.0. See docs/LIMIT_PIPELINE.md.",
        highlights: {
          avifPng: {
            title: "AVIF → PNG",
            body: "Sixteenth tool — decode AV1 in HEIF containers to PNG with compression control and honest size estimates.",
          },
          avifAnimated: {
            title: "Animated AVIF frames",
            body: "Pick which frame to export with a lazy scrubber — prepare stays responsive on multi-frame files.",
          },
          limitPipeline: {
            title: "Large image pipeline",
            body: "Science PNGs up to 150 MB can downscale via 4K–12K presets before Wasm; limit rules documented for maintainers.",
          },
        },
      },
      v1122: {
        title: "Faster size estimates",
        summary:
          "The estimation engine is quicker and lighter — GIF inspect no longer decodes every frame, alpha scans reuse prepare-time hints, and recent slider values stay cached on capable devices.",
        technical:
          "Pre²-Tier 3 on dev: GIF skip_frame_decoding + incremental composite; alpha hint prepare→worker→Wasm; multi-entry ResultCache LRU; core_utils flatten_rgba + SIMD128 alpha_scan; release LTO + simd128/bulk-memory. Engine v1.4.3.",
        highlights: {
          gifEstimate: {
            title: "GIF estimate hot path",
            body: "Animated GIFs inspect metadata without full frame decode and composite only up to the selected frame index.",
          },
          estimateCache: {
            title: "Multi-entry estimate cache",
            body: "Quality and compression sliders hit a small LRU of recent exact estimates instead of re-encoding from scratch every tick.",
          },
          wasmPerf: {
            title: "Wasm build & raster paths",
            body: "Release LTO, SIMD128, shared flatten, and vectorized alpha scan cut redundant work while keeping byte-exact estimate doctrine.",
          },
        },
      },
      v1121: {
        title: "Camaleon brand mark",
        summary:
          "The Lamina 3C chameleon mark ships in the header and browser tab — oval head, transparent favicon, and tuned spacing on every breakpoint.",
        technical:
          "BrandLink + CamaleonMark (reference PNG), public/brand assets, app/icon.png (transparent) + apple-icon.png, scripts/generate-brand-assets.mjs. Header replaces inline SVG crest. Verde Camaleón #22C55E.",
        highlights: {
          brandMark: {
            title: "Lamina 3 option C mark",
            body: "Faithful curled-chameleon silhouette with oval head and spiral tail — extracted from the approved reference, not hand-traced SVG.",
          },
          favicon: {
            title: "Transparent favicon",
            body: "Browser tab icon no longer shows a dark square — centered mark with safe padding on a transparent tile.",
          },
          headerBrand: {
            title: "Header brand link",
            body: "Wordmark visible on mobile, accent hover ring, and a larger optical frame so the mark breathes next to the title.",
          },
        },
      },
      v1120: {
        title: "Visual identity & discovery shell",
        summary:
          "A full Pre-Tier 3 UI pass — new surfaces, scalable tool browser, command palette v2, and a refined transmute workspace on desktop and mobile.",
        technical:
          "UX-0–UX-8 on dev: surface-raised/floating/subnav tokens, SurfaceDialog/Sheet, ModalPortal + useModalDialog, scroll-lock guard, AmbientBloom (mobile perf tier), ToolBrowser (tabs + compact rows), Command Palette search/groups, transmute-shell + ToolPageHeader. SPEC §7.4.1. Plan: docs/planning/pre_tier3_ui_ux_plan.md.",
        highlights: {
          visualIdentity: {
            title: "Camaleon surface system",
            body: "Unified opaque overlays, sticky header/subnav, ambient accent bloom, and light-mode palette sync — readable on every device.",
          },
          toolBrowser: {
            title: "Tool browser v2",
            body: "Family tabs, compact list rows, density toggle, and toolbar hierarchy replace the accordion grid — ready for 25+ tools.",
          },
          surfacesHotfix: {
            title: "Modal & scroll hotfixes",
            body: "What's New close sync, scroll-lock recovery, modal portal race, mobile pill overlap on Huawei, and z-index tab-filter fixes.",
          },
          transmuteShell: {
            title: "Transmute workspace refresh",
            body: "New tool page header, accent dropzone, and raised transmute shell — same engine, radically clearer UX.",
          },
        },
      },
      v1110: {
        title: "Honest transparency detection",
        summary:
          "Lossy conversions only warn when pixels are actually transparent — not when a file merely has an alpha channel.",
        technical:
          "Semantic Alpha Engine: core_utils::semantic_alpha (probe + full raster), Wasm assess_alpha / assess_page_alpha on BMP, PNG, WebP, GIF, TIFF, frontend lib/semantic-alpha at prepare. Encode flatten aligned with assess. SPEC §5.5.3.",
        highlights: {
          semanticAlpha: {
            title: "Semantic Alpha Engine",
            body: "PNG, WebP, GIF, BMP, and TIFF → JPEG now share one Wasm assessment at prepare time. The transparency notice and background picker appear only when alpha would change the output.",
          },
          tiffOpaque: {
            title: "TIFF opaque RGBA fix",
            body: "Archival TIFFs with an alpha channel but fully opaque pixels no longer show a false transparency banner — the case that motivated this release.",
          },
        },
      },
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
      jumpNavAria: "Jump to tool families",
      tabsAria: "Tool families",
      densityAria: "List density",
      jumpLinks: {
        modern: "AVIF",
        "jpeg-png": "JPEG",
        webp: "WebP",
        "gif-bmp": "GIF",
        archival: "TIFF",
        icons: "ICO",
      },
      tabs: {
        all: "All",
      },
      density: {
        compact: "Compact view",
        detailed: "Detailed view",
      },
      toolbarMeta: {
        all: "{count} tools across {families} families",
        filtered: "{count} tools",
      },
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
    avifFrameProgress: "Frame {current} of {total}",
    bmpMeta: "{width} × {height} · {bpp}-bit",
    phases: {
      reading: "Reading file…",
      engine: "Loading conversion engine…",
      analyze: "Analyzing image…",
      analyzeGif: "Reading animation frames…",
      analyzeAvif: "Decoding AVIF…",
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
    transmuteSyncing: "Updating estimate…",
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
    unexpectedError: "An unexpected error occurred",
    prepareFailed: "Could not prepare this file. Try another image or a different format.",
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
      cacheReadySlow: "Ready — conversion may take a while on this file and settings",
    },
    avifFrame: {
      hint: "Frames load in the background — once ready, scrubbing is instant. Pick which frame to export.",
      warmingFrames: "Preparing frames {current} / {total}…",
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
    "avif-to-jpg": {
      actionTitle: "Compress for Web",
      description: "Convert AVIF to JPEG — smaller files at your chosen quality.",
      fidelityHint:
        "JPEG is lossy — quality loss is irreversible. AVIF was likely already compressed; re-encoding adds a second lossy generation. 10/12-bit sources normalize to 8-bit. Animated AVIF: pick one frame to export. Transparency flattens to your chosen background.",
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
    "jpg-to-avif": {
      actionTitle: "Compress to AVIF",
      description: "Convert JPEG to AVIF — re-compress with AV1 for smaller web delivery.",
      fidelityHint:
        "Two lossy generations: JPEG was already compressed; AVIF adds another lossy pass. Quality loss is irreversible. Encode can take several seconds on large images — use higher speed for faster results.",
      options: {
        quality: {
          label: "AVIF Quality",
          hint: "Higher quality = larger file. Lossy — not reversible.",
          lowerLabel: "Smaller",
          upperLabel: "Sharper",
          presets: { web: "Web", balanced: "Balanced", high: "High" },
        },
        speed: {
          label: "Encode Speed",
          hint: "Higher speed = faster processing, often larger output. Lower speed spends more CPU for better compression.",
          lowerLabel: "Smaller file",
          upperLabel: "Faster",
          presets: { quality: "Quality", balanced: "Balanced", fast: "Fast" },
        },
      },
    },
    "png-to-avif": {
      actionTitle: "Compress to AVIF",
      description: "Convert PNG to AVIF — modern AV1 delivery format with quality and encode-speed controls.",
      fidelityHint:
        "AVIF encode is lossy — pixels are re-compressed with AV1. Meaningful transparency is preserved when present. Encode can take several seconds on large images; higher speed finishes faster but may produce larger files.",
      options: {
        quality: {
          label: "AVIF Quality",
          hint: "Higher quality = larger file. Lossy — not reversible.",
          lowerLabel: "Smaller",
          upperLabel: "Sharper",
          presets: { web: "Web", balanced: "Balanced", high: "High" },
        },
        speed: {
          label: "Encode Speed",
          hint: "Higher speed = faster processing, often larger output. Lower speed spends more CPU for better compression.",
          lowerLabel: "Smaller file",
          upperLabel: "Faster",
          presets: { quality: "Quality", balanced: "Balanced", fast: "Fast" },
        },
      },
    },
    "avif-to-png": {
      actionTitle: "Convert to PNG",
      description: "Lossless PNG from AVIF — decode AV1 once, then DEFLATE-compress the raster.",
      fidelityHint:
        "Output PNG is often much larger than the AVIF source for photos — you are expanding compressed AV1 to a full raster. 10/12-bit sources normalize to 8-bit. Animated AVIF: pick one frame to export.",
      options: {
        compression: {
          label: "PNG Compression",
          hint: "Always lossless pixels — higher compression = smaller file + slower processing.",
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
    avifDecodeFailed:
      "This AVIF could not be decoded in the browser engine. It may use an AV1 profile or container layout that Windows Photos accepts via its system codec but zenavif cannot rasterize yet.",
    avifDecodeFailedWithHint:
      "This AVIF could not be decoded in the browser. Windows Photos uses a different system codec (WIC + AV1 extension); your file is likely valid but not supported by our Wasm decoder yet.",
    avifUnsupported:
      "This AVIF variant is not supported in the browser engine yet. Try re-exporting from your editor.",
    avifCorrupt: "Invalid AVIF container. The file may be truncated or not a real AVIF image.",
    avifMiafBrand:
      "MIAF container (mif1 major brand) without a decodable AVIF track. Re-export with major brand avif if this persists.",
    avifFrameRange: "That animation frame does not exist. Pick a frame within the file.",
    engineNotReady: "The transmutation engine is still starting. Please try again.",
    generic: "Transmutation failed. Please try again.",
  },

  notices: {
    performance: {
      L1: "This conversion may take a few seconds depending on file size and options.",
      L2: "Estimate and transmutation may take longer on this file — processing runs entirely in your browser on one CPU core.",
      L2SlowEncode: "Low encode speed prioritizes compression over time — updating the estimate or transmuting may take several minutes on large images. Try a higher speed preset for faster results.",
      L3: "Large file or heavy settings — conversion may take several minutes. Avoid changing sliders while an estimate is running.",
      L3SlowEncode: "Low encode speed on a large or elevated file — this may take several minutes. Raise encode speed or reduce dimensions before transmuting.",
    },
    limit: {
      outputSize:
        "Estimated output is {size} — above the usual {limit} threshold. Conversion can continue; processing may take longer and use more memory.",
      nearPixelLimit:
        "This image is near the {megapixels} MP browser limit — conversion uses significant memory.",
      highRamPeak:
        "Large-file mode — peak memory use will be higher than usual. Close other heavy tabs if the browser feels slow.",
      astroTier:
        "Very large dimensions — use the resize presets above to downscale before conversion.",
    },
    fidelity: {
      bmpPngGrowth:
        "BMP to PNG often increases file size — PNG stores the full uncompressed raster.",
    },
    estimate: {
      cheapSlow: "Still calculating…",
      moderateSlow: "Still calculating — this format may take a moment for an accurate size.",
      expensiveSlow:
        "Still calculating — this tool runs a full preview encode for an accurate size estimate.",
      errorRaw: "{message}",
    },
    transmute: {
      slowL2: "Transmuting — this may take a while on your current settings.",
      slowL3: "Transmuting — large file or heavy settings; please keep this tab open.",
    },
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
    searchLabel: "Search tools",
    searchPlaceholder: "Search by name or format…",
    noResults: "No tools match your search",
    close: "Close",
    categoryImage: "Image",
    categorySoon: "Coming soon",
    closeHint: "Esc to close",
    groups: {
      modern: "Modern formats",
      "jpeg-png": "JPEG & PNG",
      webp: "WebP",
      "gif-bmp": "GIF & BMP",
      archival: "Archival & textures",
      icons: "Icons & favicons",
    },
  },
};

export default en;
