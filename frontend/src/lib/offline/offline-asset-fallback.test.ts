import { describe, expect, it } from "vitest";
import {
  decodeNextImageAssetPath,
  isOfflineAssetPath,
} from "./offline-asset-fallback";

describe("offline-asset-fallback", () => {
  it("detects brand and pwa asset paths", () => {
    expect(isOfflineAssetPath("/brand/camaleon-mark.png")).toBe(true);
    expect(isOfflineAssetPath("/pwa/icon.png")).toBe(true);
    expect(isOfflineAssetPath("/_next/image")).toBe(true);
    expect(isOfflineAssetPath("/transmute/foo")).toBe(false);
  });

  it("decodes Next image optimizer url param", () => {
    expect(
      decodeNextImageAssetPath(
        "/_next/image",
        "url=%2Fbrand%2Fcamaleon-mark.png&w=128&q=75"
      )
    ).toBe("/brand/camaleon-mark.png");
  });
});
