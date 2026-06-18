import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { matchAnyCache } from "./cache-match";

describe("cache-match", () => {
  beforeEach(() => {
    vi.stubGlobal("caches", {
      match: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue([]),
      open: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns direct caches.match hit", async () => {
    const response = new Response("ok");
    vi.mocked(caches.match).mockResolvedValue(response);
    const hit = await matchAnyCache(new Request("https://example.com/wasm/test.js"));
    expect(hit).toBe(response);
  });
});
