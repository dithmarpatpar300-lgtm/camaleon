import { describe, expect, it, vi, afterEach } from "vitest";
import { buildProbeUrl, isProbeRequest } from "./network-guard";

describe("server probe helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds health probe url with cache-bust query", () => {
    vi.stubGlobal("location", { origin: "http://127.0.0.1:8787" });
    expect(buildProbeUrl("/api/health")).toMatch(
      /^\/api\/health\?camaleon-probe=\d+$/
    );
  });

  it("detects probe requests", () => {
    const probe = new Request(
      "http://127.0.0.1:8787/api/health?camaleon-probe=123"
    );
    const normal = new Request("http://127.0.0.1:8787/version.json");
    expect(isProbeRequest(probe)).toBe(true);
    expect(isProbeRequest(normal)).toBe(false);
  });
});
