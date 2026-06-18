import { describe, expect, it } from "vitest";
import { shouldPreserveCache, purgeAppShellCaches } from "./cache-purge";
import { buildHardReloadUrl } from "./hard-reload";
import { HARD_RELOAD_QUERY_PARAM, WASM_CACHE_NAME } from "./constants";
import {
  isRemoteVersionNewer,
  parseVersionBeaconPayload,
} from "./version-beacon";

describe("shouldPreserveCache", () => {
  it("preserves wasm runtime cache only", () => {
    expect(shouldPreserveCache(WASM_CACHE_NAME)).toBe(true);
    expect(shouldPreserveCache("serwist-precache-v2")).toBe(false);
  });
});

describe("buildHardReloadUrl", () => {
  it("adds cache-bust query param", () => {
    const url = buildHardReloadUrl("https://camaleon.test/transmute/png-to-jpg", 123);
    expect(url).toContain(`${HARD_RELOAD_QUERY_PARAM}=123`);
  });
});

describe("parseVersionBeaconPayload", () => {
  it("parses valid payload", () => {
    expect(parseVersionBeaconPayload({ version: "3.2.5", buildId: "abc" })).toEqual({
      version: "3.2.5",
      buildId: "abc",
    });
  });

  it("rejects invalid payload", () => {
    expect(parseVersionBeaconPayload(null)).toBeNull();
    expect(parseVersionBeaconPayload({ version: 3 })).toBeNull();
  });
});

describe("isRemoteVersionNewer", () => {
  it("compares semver", () => {
    expect(isRemoteVersionNewer("3.2.5", "3.2.4")).toBe(true);
    expect(isRemoteVersionNewer("3.2.4", "3.2.4")).toBe(false);
    expect(isRemoteVersionNewer("3.2.3", "3.2.4")).toBe(false);
  });
});

describe("purgeAppShellCaches", () => {
  it("deletes non-wasm caches", async () => {
    const deleted: string[] = [];
    const original = globalThis.caches;
    globalThis.caches = {
      keys: async () => [WASM_CACHE_NAME, "serwist-precache-v2"],
      delete: async (name: string) => {
        deleted.push(name);
        return true;
      },
    } as CacheStorage;

    await purgeAppShellCaches();
    expect(deleted).toEqual(["serwist-precache-v2"]);

    globalThis.caches = original;
  });
});
