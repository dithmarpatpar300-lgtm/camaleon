import type { LegalPageId } from "../types";
import type { LegalPageContent } from "../types";
import {
  SITE_CONTACT_BUG_URL,
  SITE_CONTACT_FEATURE_URL,
  SITE_REPO_URL,
  SITE_SECURITY_ADVISORY_URL,
} from "@/lib/site";

export const legalPagesEn: Record<LegalPageId, LegalPageContent> = {
  about: {
    title: "About Camaleon",
    description:
      "Why Camaleon exists — local-first image transmutation in your browser, with nothing to hide.",
    lastUpdated: "June 2026",
    intro:
      "Camaleon is an open-source web application that converts images entirely inside your browser. We built it because file format conversion should not require uploading your photos to a stranger's server.",
    sections: [
      {
        title: "What we do",
        paragraphs: [
          "Camaleon transmutes image formats — JPEG, PNG, WebP, and more over time — using Rust compiled to WebAssembly. All decoding and encoding runs in a Web Worker on your device. The website delivers the app; it never receives your file bytes.",
        ],
      },
      {
        title: "What we do not do",
        paragraphs: ["We intentionally avoid practices common in online converters:"],
        listItems: [
          "No upload of your files to our servers — there is no conversion backend.",
          "No user accounts or sign-in required to transmute.",
          "No third-party analytics or advertising trackers in the app today.",
          "No sale or sharing of file content — we never have access to it.",
        ],
      },
      {
        title: "Open source",
        paragraphs: [
          "Camaleon is released under the MIT License. The source code, build pipeline, and WebAssembly modules are public so anyone can verify how conversion works.",
          `Repository: ${SITE_REPO_URL}`,
        ],
      },
      {
        title: "Metadata and privacy",
        paragraphs: [
          "By default, Camaleon strips metadata (EXIF, ICC, text chunks) from outputs — a privacy-first choice documented in our technical specification. Your original file on disk is never modified; only the downloaded result reflects this policy.",
          "For full details, see our Privacy Policy.",
        ],
      },
      {
        title: "Project status",
        paragraphs: [
          "Camaleon is actively developed. Features and supported formats expand over time. We label lossless vs lossy conversions honestly and document when output size may grow rather than shrink.",
        ],
      },
    ],
  },

  contact: {
    title: "Contact",
    description: "How to reach the Camaleon project — feedback, bugs, and contributions.",
    lastUpdated: "June 2026",
    intro:
      "Camaleon is maintained as an open-source project. The best way to reach us is through GitHub — we read issues and pull requests there.",
    sections: [
      {
        title: "Bug reports and feature requests",
        paragraphs: [
          "If something breaks, a conversion looks wrong, or you have an idea for a new format, open a GitHub Issue. Include your browser, operating system, and steps to reproduce when reporting bugs.",
        ],
      },
      {
        title: "Contributions",
        paragraphs: [
          "Pull requests are welcome. The repository includes technical specifications, architecture docs, and a CI pipeline that runs Rust tests and a production build on every change.",
        ],
      },
      {
        title: "Security concerns",
        paragraphs: [
          "If you believe you have found a security vulnerability in the project (not a user file privacy issue — files never leave the browser by design), please report it responsibly via a private GitHub security advisory or an issue with minimal public detail until resolved.",
        ],
      },
      {
        title: "No commercial support",
        paragraphs: [
          "Camaleon is provided as-is under the MIT License. We do not offer paid support, SLAs, or enterprise contracts at this time.",
        ],
      },
    ],
    actions: [
      { label: "Report a bug", href: SITE_CONTACT_BUG_URL, external: true, primary: true },
      {
        label: "Suggest an improvement",
        href: SITE_CONTACT_FEATURE_URL,
        external: true,
      },
      { label: "Security vulnerability (private)", href: SITE_SECURITY_ADVISORY_URL, external: true },
      { label: "View source code", href: SITE_REPO_URL, external: true },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    description:
      "How Camaleon handles your data — spoiler: your files stay on your device.",
    lastUpdated: "June 2026",
    intro:
      "This policy explains what Camaleon collects, stores, and processes. We designed the app so that image transmutation does not require sending your files to us.",
    sections: [
      {
        title: "Summary",
        paragraphs: [
          "Your image files are processed locally in your browser. We do not operate a server that receives, stores, or analyzes your file contents.",
        ],
      },
      {
        title: "Files and transmutation",
        paragraphs: [
          "When you drop or select a file, it is read into memory in your browser. Conversion runs in a Web Worker using WebAssembly modules downloaded from the same origin as the app. Output bytes are offered to you as a download. At no point in this flow are file bytes transmitted to Camaleon's operators.",
        ],
      },
      {
        title: "What we do not collect",
        paragraphs: ["Regarding your images and transmutations:"],
        listItems: [
          "We do not upload files to our infrastructure.",
          "We do not log file names, sizes, or conversion results on a server we control.",
          "We do not use third-party conversion APIs or cloud OCR/vision services.",
        ],
      },
      {
        title: "Cookies and local storage",
        paragraphs: [
          "Camaleon uses a small set of browser storage mechanisms to remember your preferences:",
        ],
        listItems: [
          "Locale cookie (`camaleon-locale`) — remembers English or Spanish.",
          "Theme cookie (`camaleon-theme`) — remembers dark or light mode.",
          "localStorage — mirrors locale and theme so preferences persist between visits.",
          "These values are not used for tracking or advertising — only for language and theme.",
        ],
      },
      {
        title: "Analytics and third parties",
        paragraphs: [
          "The Camaleon application code does not include analytics trackers (no Google Analytics, no advertising pixels). If you access the site through a hosting provider or CDN, that provider may collect standard web server logs (IP address, user agent, requested URL) under their own privacy policy — we do not use those logs to identify individual users or file activity.",
        ],
      },
      {
        title: "Metadata in converted files",
        paragraphs: [
          "Camaleon applies a StripAll metadata policy by default: EXIF, ICC profiles, and similar container metadata from source images are not copied into outputs. This reduces accidental leakage of location or device information in shared files. It is a feature, not a bug.",
        ],
      },
      {
        title: "Children",
        paragraphs: [
          "Camaleon is a general-purpose utility. We do not knowingly collect personal information from anyone, including children.",
        ],
      },
      {
        title: "Changes",
        paragraphs: [
          "We may update this policy as the app evolves. The \"Last updated\" date at the top will change when we do. Continued use after an update constitutes acceptance of the revised policy.",
        ],
      },
      {
        title: "Contact",
        paragraphs: ["Questions about privacy: open an issue on GitHub (see Contact page)."],
      },
    ],
  },

  terms: {
    title: "Terms of Use",
    description: "Terms governing your use of the Camaleon web application.",
    lastUpdated: "June 2026",
    intro:
      "By using Camaleon, you agree to these terms. Please read them. If you do not agree, do not use the application.",
    sections: [
      {
        title: "The service",
        paragraphs: [
          "Camaleon provides browser-based image format conversion tools. The software runs on your device. We host static files (HTML, JavaScript, WebAssembly) that constitute the application.",
        ],
      },
      {
        title: "No warranty",
        paragraphs: [
          'Camaleon is provided "as is" and "as available", without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee that conversions will be error-free, lossless where labeled lossy, or suitable for medical, legal, or forensic use.',
        ],
      },
      {
        title: "Your responsibility",
        paragraphs: ["You are solely responsible for:"],
        listItems: [
          "Files you choose to convert and how you use the results.",
          "Verifying output quality before discarding originals.",
          "Compliance with copyright and applicable laws in your jurisdiction.",
          "Maintaining backups of important files.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "You may not use Camaleon to process material you do not have the right to convert, or for unlawful purposes. We do not monitor usage (we cannot — processing is local), but misuse violates these terms.",
        ],
      },
      {
        title: "Intellectual property",
        paragraphs: [
          "The Camaleon name, branding, and source code are published under the MIT License unless otherwise noted in the repository. Third-party libraries (Rust crates, npm packages) retain their respective licenses.",
        ],
      },
      {
        title: "Limitation of liability",
        paragraphs: [
          "To the maximum extent permitted by law, the authors and contributors of Camaleon shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill, arising from your use of the application.",
        ],
      },
      {
        title: "Changes to the service and terms",
        paragraphs: [
          "We may modify, suspend, or discontinue features at any time. We may update these terms; the \"Last updated\" date reflects the latest revision. Material changes will be noted in the repository changelog.",
        ],
      },
      {
        title: "Governing law",
        paragraphs: [
          "These terms are written in English. Interpretation follows general principles of contract law in the operator's jurisdiction unless local mandatory consumer protections apply where you live.",
        ],
      },
    ],
  },
};
