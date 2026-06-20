import { describe, expect, it } from "vitest";
import { extractBrandAssetUrls, extractStaticAssetUrls } from "./extract-static-assets";

describe("extractStaticAssetUrls", () => {
  it("extracts script and stylesheet paths from Next HTML", () => {
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="/_next/static/css/app.css" />
        </head>
        <body>
          <script src="/_next/static/chunks/main-app.js"></script>
        </body>
      </html>
    `;

    expect(extractStaticAssetUrls(html).sort()).toEqual([
      "/_next/static/chunks/main-app.js",
      "/_next/static/css/app.css",
    ]);
  });

  it("returns empty array when no static assets", () => {
    expect(extractStaticAssetUrls("<html></html>")).toEqual([]);
  });
});

describe("extractBrandAssetUrls", () => {
  it("extracts brand img src from HTML", () => {
    const html = `<img src="/brand/camaleon-mark.png" width="128" height="128" />`;
    expect(extractBrandAssetUrls(html)).toEqual(["/brand/camaleon-mark.png"]);
  });
});
