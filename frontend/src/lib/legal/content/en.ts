import type { LegalPageId } from "../types";
import type { LegalPageContent } from "../types";
import { CURRENT_LEGAL_REVISION } from "../constants";
import { COOKIE_NAMES, SESSION_KEYS, STORAGE_KEYS } from "@/lib/storage/keys";
import {
  SITE_CONTACT_BUG_URL,
  SITE_CONTACT_FEATURE_URL,
  SITE_REPO_URL,
  SITE_SECURITY_ADVISORY_URL,
} from "@/lib/site";

const REVISION = CURRENT_LEGAL_REVISION;

const privacyStorageRows: string[][] = [
  [STORAGE_KEYS.USER_SETTINGS, "Preferences (S1–S7): locale, theme, transmutation defaults, performance, notices, offline, risk mode, updates, batch, tool browser lane/tab/density"],
  [STORAGE_KEYS.THEME, "Theme mirror (dark/light) — synced with cookie"],
  [STORAGE_KEYS.LOCALE, "Locale mirror (en/es) — synced with cookie"],
  [STORAGE_KEYS.ONBOARDING, "Whether welcome onboarding was completed"],
  [STORAGE_KEYS.LAST_SEEN_RELEASE, "Last release version shown in changelog modal"],
  [STORAGE_KEYS.RELEASE_SNOOZE, "ISO timestamp — hide release notes until this time"],
  [STORAGE_KEYS.APP_UPDATE_SNOOZE, "ISO timestamp — hide app-update banner until this time"],
  [STORAGE_KEYS.LEGAL_REVISION_ACK, "Legal revision acknowledgment ({ revision, acknowledgedAt })"],
];

const privacyCookieRows: string[][] = [
  [COOKIE_NAMES.LOCALE, "Language for SSR first paint (en/es)"],
  [COOKIE_NAMES.THEME, "Theme for SSR first paint (dark/light)"],
  [COOKIE_NAMES.TOOL_LANE, "Convert vs Optimize lane for SSR first paint"],
  [COOKIE_NAMES.TOOL_TAB, "Active format tab for SSR first paint"],
  [COOKIE_NAMES.TOOL_DENSITY, "Tool grid density for SSR first paint"],
];

export const legalPagesEn: Record<LegalPageId, LegalPageContent> = {
  about: {
    title: "About Camaleon",
    description:
      "Camaleon v3.4 — local-first image transmutation in your browser, with nothing to hide.",
    lastUpdated: "June 20, 2026",
    legalRevision: REVISION,
    intro:
      "Camaleon is an open-source web application that transmutes images entirely inside your browser. We built it because converting formats should not require uploading your photos to someone else's server.",
    sections: [
      {
        id: "what-is",
        title: "What Camaleon is",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon is a privacy-first image toolkit. You drop a file, pick a tool or output format, and download the result — all on your device. No accounts, no sign-in, no conversion backend.",
          },
        ],
      },
      {
        id: "capabilities",
        title: "What you can do",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon v3.4 ships 25 transmutation tools across Convert and Optimize lanes on the home tool browser.",
          },
          {
            type: "list",
            items: [
              "Convert between JPEG, PNG, WebP, AVIF, SVG, GIF, TIFF, BMP, TGA, and ICO where supported.",
              "Universal transmutator — drop any supported image and pick your output format; Camaleon routes you to the right tool.",
              "Optimize lane — re-encode with quality presets and honest size metrics (results may grow or shrink).",
              "Batch workflows — process multiple files, with per-row selection and individual or ZIP download.",
              "Semantic Alpha and transmutation options where the format supports them.",
            ],
          },
        ],
      },
      {
        id: "how-it-works",
        title: "How it works",
        blocks: [
          {
            type: "paragraph",
            text: "Decoding and encoding run in a Web Worker using Rust compiled to WebAssembly (engine v1.6.0). The website delivers HTML, JavaScript, and Wasm modules from the same origin. Your file bytes are read into browser memory, processed locally, and offered as a download. Camaleon's operators never receive your images.",
          },
        ],
      },
      {
        id: "privacy-first",
        title: "Privacy by design",
        blocks: [
          {
            type: "paragraph",
            text: "By default, Camaleon applies a StripAll metadata policy: EXIF, ICC profiles, and similar container metadata are not copied into outputs. Your original file on disk is never modified — only the downloaded result reflects this policy.",
          },
          {
            type: "callout",
            variant: "info",
            title: "100% local",
            text: "File bytes never leave your device during transmutation. See our Privacy Policy for storage and offline details.",
          },
        ],
      },
      {
        id: "pwa-offline",
        title: "Install & offline",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon is a Progressive Web App (PWA). After at least one online visit, a Service Worker can cache the app shell and Wasm engines you use — or, if you opt in under Settings → Offline & cache, the full toolkit (~10–17 MB). Offline transmutation works without sending files to a server; first visit and updates still require network access.",
          },
        ],
      },
      {
        id: "open-source",
        title: "Open source",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon is released under the MIT License. Source code, build pipeline, and WebAssembly modules are public so anyone can verify how conversion works.",
          },
          {
            type: "paragraph",
            text: `Repository: ${SITE_REPO_URL}`,
          },
        ],
      },
      {
        id: "what-we-dont-do",
        title: "What we do not do",
        blocks: [
          {
            type: "paragraph",
            text: "We intentionally avoid practices common in online converters:",
          },
          {
            type: "list",
            items: [
              "No upload of your files to our servers — there is no conversion backend.",
              "No user accounts or sign-in required.",
              "No third-party analytics or advertising trackers in the app.",
              "No sale or sharing of file content — we never have access to it.",
            ],
          },
        ],
      },
      {
        id: "project-status",
        title: "Project status",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon is actively developed. We label lossless vs lossy conversions honestly, document when output size may grow, and expand formats and tools over time. Settings (language, theme, performance, offline, risk mode, batch defaults, and more) live in a unified preferences drawer.",
          },
        ],
      },
    ],
  },

  contact: {
    title: "Contact",
    description: "How to reach the Camaleon project — feedback, bugs, legal questions, and contributions.",
    lastUpdated: "June 20, 2026",
    legalRevision: REVISION,
    intro:
      "Camaleon is maintained as an open-source project. GitHub is the primary channel — we read issues and pull requests there.",
    sections: [
      {
        id: "overview",
        title: "How to reach us",
        blocks: [
          {
            type: "paragraph",
            text: "Choose the channel that best matches your topic. Please do not attach personal images or private documents to public issues — describe the problem and steps to reproduce instead.",
          },
        ],
      },
      {
        id: "bugs",
        title: "Bug reports",
        blocks: [
          {
            type: "paragraph",
            text: "If something breaks, a conversion looks wrong, or the UI misbehaves, open a GitHub Issue using the bug report template. Include your browser, operating system, tool name, and steps to reproduce.",
          },
        ],
      },
      {
        id: "features",
        title: "Feature requests",
        blocks: [
          {
            type: "paragraph",
            text: "Ideas for new formats, tools, or UX improvements are welcome via the feature request template. Explain the use case — we prioritize local-first, privacy-preserving features.",
          },
        ],
      },
      {
        id: "privacy-legal",
        title: "Privacy & legal questions",
        blocks: [
          {
            type: "paragraph",
            text: "Questions about this Privacy Policy or Terms of Use can be raised in a GitHub Issue labeled appropriately. For policy text, see /privacy and /terms on this site.",
          },
        ],
      },
      {
        id: "translations",
        title: "Translations",
        blocks: [
          {
            type: "paragraph",
            text: "The app supports English and Spanish. Translation improvements and additional locales are welcome via pull request.",
          },
        ],
      },
      {
        id: "security",
        title: "Security vulnerabilities",
        blocks: [
          {
            type: "paragraph",
            text: "If you believe you have found a security vulnerability in the project (not a user file privacy issue — files never leave the browser by design), report it responsibly via a private GitHub security advisory or an issue with minimal public detail until resolved.",
          },
        ],
      },
      {
        id: "releases",
        title: "Release notes",
        blocks: [
          {
            type: "paragraph",
            text: "What's New and release history are available from Settings → Updates or the release comms drawer. Major legal document changes are announced separately — not only through release notes.",
          },
        ],
      },
      {
        id: "no-support",
        title: "No commercial support",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon is provided as-is under the MIT License. We do not offer paid support, SLAs, or enterprise contracts at this time.",
          },
        ],
      },
    ],
    actions: [
      { label: "Report a bug", href: SITE_CONTACT_BUG_URL, external: true, primary: true },
      { label: "Suggest an improvement", href: SITE_CONTACT_FEATURE_URL, external: true },
      { label: "Security advisory (private)", href: SITE_SECURITY_ADVISORY_URL, external: true },
      { label: "View source code", href: SITE_REPO_URL, external: true },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    description: "How Camaleon handles your data — your files stay on your device.",
    lastUpdated: "June 20, 2026",
    legalRevision: REVISION,
    showToc: true,
    intro:
      "This policy explains what Camaleon collects, stores, and processes. We designed the app so image transmutation does not require sending your files to us.",
    sections: [
      {
        id: "summary",
        title: "Summary",
        blocks: [
          {
            type: "callout",
            variant: "info",
            title: "Your files stay local",
            text: "Image files are processed in your browser. We do not operate a server that receives, stores, or analyzes your file contents.",
          },
        ],
      },
      {
        id: "files",
        title: "Files & transmutation",
        blocks: [
          {
            type: "paragraph",
            text: "When you drop or select a file, it is read into memory in your browser. Conversion runs in a Web Worker using WebAssembly modules downloaded from the same origin. Output bytes are offered as a download. At no point are file bytes transmitted to Camaleon's operators.",
          },
        ],
      },
      {
        id: "no-collection",
        title: "What we do not collect",
        blocks: [
          {
            type: "paragraph",
            text: "Regarding your images and transmutations:",
          },
          {
            type: "list",
            items: [
              "We do not upload files to our infrastructure.",
              "We do not log file names, sizes, or conversion results on a server we control.",
              "We do not use third-party conversion APIs or cloud OCR/vision services.",
            ],
          },
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon sets small cookies so the first page load matches your saved preferences (no visual flash). They are not used for tracking or advertising.",
          },
          {
            type: "table",
            headers: ["Cookie", "Purpose"],
            rows: privacyCookieRows,
          },
        ],
      },
      {
        id: "local-storage",
        title: "localStorage",
        blocks: [
          {
            type: "paragraph",
            text: "Browser localStorage persists preferences on your device. Values are not transmitted to us.",
          },
          {
            type: "table",
            headers: ["Key", "Purpose"],
            rows: privacyStorageRows,
          },
          {
            type: "paragraph",
            text: "Legacy keys (camaleon.tools.lane.v1, camaleon.tools.tab.v1, camaleon.tools.density.v1) are migrated once into user-settings.tools and removed.",
          },
        ],
      },
      {
        id: "session-storage",
        title: "sessionStorage",
        blocks: [
          {
            type: "paragraph",
            text: `When you enable voluntary offline mode (Settings → Offline), the tab may store \`${SESSION_KEYS.FORCE_OFFLINE}\` for the session. This flag is cleared when you close the tab. It is used for QA and offline testing — not for tracking.`,
          },
        ],
      },
      {
        id: "cache-offline",
        title: "Cache Storage & offline",
        blocks: [
          {
            type: "paragraph",
            text: "A Service Worker (Serwist PWA) may cache HTML, JavaScript, WebAssembly modules, and static assets on your device so the app works offline after an online visit. By default, only engines you use are cached lazily. Opt-in full toolkit precache (Settings S5) downloads all Wasm crates (~10–17 MB) to Cache Storage. This is browser-managed storage — not data we receive. Clear it via Settings → Offline & cache or your browser's site data controls.",
          },
        ],
      },
      {
        id: "app-updates",
        title: "App update checks",
        blocks: [
          {
            type: "paragraph",
            text: "When auto-detect updates is enabled (Settings → Updates, default on), the app periodically fetches /version.json from the same origin to compare version strings. No file data is sent. You control reload when an update is available.",
          },
        ],
      },
      {
        id: "analytics",
        title: "Analytics & third parties",
        blocks: [
          {
            type: "paragraph",
            text: "The Camaleon application code does not include analytics trackers (no Google Analytics, no advertising pixels). If you access the site through a hosting provider or CDN, that provider may collect standard web server logs (IP address, user agent, requested URL) under their own privacy policy — we do not use those logs to identify individual users or file activity.",
          },
        ],
      },
      {
        id: "metadata",
        title: "Metadata in converted files",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon applies a StripAll metadata policy by default: EXIF, ICC profiles, and similar container metadata from source images are not copied into outputs. This reduces accidental leakage of location or device information in shared files.",
          },
        ],
      },
      {
        id: "risk-mode",
        title: "Risk mode",
        blocks: [
          {
            type: "paragraph",
            text: "If you enable Risk mode in Settings, Camaleon stores riskMode.enabled and an acknowledgedAt ISO timestamp in camaleon-user-settings-v1. This records that you accepted elevated limits at your own risk. Risk mode never bypasses SVG external-resource security checks.",
          },
        ],
      },
      {
        id: "legal-revision-ack",
        title: "Legal revision notice",
        blocks: [
          {
            type: "paragraph",
            text: `When we materially update legal pages, Camaleon may show a dedicated notice and store your acknowledgment in ${STORAGE_KEYS.LEGAL_REVISION_ACK} until the revision changes again.`,
          },
        ],
      },
      {
        id: "children",
        title: "Children",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon is a general-purpose utility. We do not knowingly collect personal information from anyone, including children.",
          },
        ],
      },
      {
        id: "changes",
        title: "Changes to this policy",
        blocks: [
          {
            type: "paragraph",
            text: "We may update this policy as the app evolves. The Last updated date and legal revision at the top will change when we do. Continued use after an update constitutes acceptance of the revised policy.",
          },
        ],
      },
      {
        id: "contact",
        title: "Contact",
        blocks: [
          {
            type: "paragraph",
            text: "Questions about privacy: open an issue on GitHub (see Contact page).",
          },
        ],
      },
    ],
  },

  terms: {
    title: "Terms of Use",
    description: "Terms governing your use of the Camaleon web application.",
    lastUpdated: "June 20, 2026",
    legalRevision: REVISION,
    showToc: true,
    intro:
      "By using Camaleon, you agree to these terms. Please read them carefully. If you do not agree, do not use the application.",
    sections: [
      {
        id: "service",
        title: "The service",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon provides browser-based image transmutation tools — convert, optimize, resize, and related operations. The software runs on your device. We host static files (HTML, JavaScript, WebAssembly) that constitute the application.",
          },
        ],
      },
      {
        id: "no-warranty",
        title: "No warranty",
        blocks: [
          {
            type: "paragraph",
            text: 'Camaleon is provided "as is" and "as available", without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee that conversions will be error-free, lossless where labeled lossy, or suitable for medical, legal, or forensic use.',
          },
        ],
      },
      {
        id: "responsibility",
        title: "Your responsibility",
        blocks: [
          {
            type: "paragraph",
            text: "You are solely responsible for:",
          },
          {
            type: "list",
            items: [
              "Files you choose to transmute and how you use the results.",
              "Verifying output quality before discarding originals.",
              "Compliance with copyright and applicable laws in your jurisdiction.",
              "Maintaining backups of important files.",
            ],
          },
        ],
      },
      {
        id: "batch",
        title: "Batch & multi-file",
        blocks: [
          {
            type: "paragraph",
            text: "Batch and multi-file workflows process files you explicitly select. You are responsible for reviewing selections, output naming, and download packaging (individual files or ZIP). Camaleon does not recover discarded originals.",
          },
        ],
      },
      {
        id: "optimize",
        title: "Optimize results",
        blocks: [
          {
            type: "paragraph",
            text: "The Optimize lane re-encodes images with configurable quality. Output size may decrease, stay similar, or increase depending on source content and settings. We present metrics honestly but do not guarantee compression ratios or file size reduction.",
          },
        ],
      },
      {
        id: "risk-mode",
        title: "Risk mode",
        blocks: [
          {
            type: "callout",
            variant: "warning",
            title: "Elevated limits at your risk",
            text: "Risk mode bypasses default pixel and byte limits and auto-consent flows. You enable it explicitly in Settings. Large files may slow or crash your browser tab. Camaleon is not liable for data loss, browser instability, or OOM errors arising from Risk mode use.",
          },
        ],
      },
      {
        id: "pwa-offline",
        title: "PWA & offline",
        blocks: [
          {
            type: "paragraph",
            text: "Offline operation depends on prior caching in your browser. We do not guarantee uninterrupted offline availability, cache completeness, or compatibility with every browser or storage quota. First visit and app updates require network access.",
          },
        ],
      },
      {
        id: "app-updates",
        title: "App updates",
        blocks: [
          {
            type: "paragraph",
            text: "When you reload to apply an update, in-progress work in the tab may be lost. Save downloads before reloading. Update detection uses a version beacon only — no file data is transmitted.",
          },
        ],
      },
      {
        id: "acceptable-use",
        title: "Acceptable use",
        blocks: [
          {
            type: "paragraph",
            text: "You may not use Camaleon to process material you do not have the right to convert, or for unlawful purposes. We do not monitor usage (we cannot — processing is local), but misuse violates these terms.",
          },
        ],
      },
      {
        id: "intellectual-property",
        title: "Intellectual property",
        blocks: [
          {
            type: "paragraph",
            text: "The Camaleon name, branding, and source code are published under the MIT License unless otherwise noted in the repository. Third-party libraries retain their respective licenses. You retain rights to files you create locally; we claim no ownership of your outputs.",
          },
        ],
      },
      {
        id: "liability",
        title: "Limitation of liability",
        blocks: [
          {
            type: "paragraph",
            text: "To the maximum extent permitted by law, the authors and contributors of Camaleon shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill, arising from your use of the application.",
          },
        ],
      },
      {
        id: "changes",
        title: "Changes to the service and terms",
        blocks: [
          {
            type: "paragraph",
            text: 'We may modify, suspend, or discontinue features at any time. We may update these terms; the "Last updated" date and legal revision reflect the latest version. Material legal changes may be announced via a dedicated in-app notice.',
          },
        ],
      },
      {
        id: "governing-law",
        title: "Governing law",
        blocks: [
          {
            type: "paragraph",
            text: "These terms are written in English. Interpretation follows general principles of contract law in the operator's jurisdiction unless local mandatory consumer protections apply where you live.",
          },
        ],
      },
    ],
  },
};
