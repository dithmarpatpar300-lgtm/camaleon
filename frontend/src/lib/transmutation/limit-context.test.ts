import { describe, it, expect } from "vitest";
import {
  computeLimitContext,
  MAX_PIXELS,
  formatMegapixels,
} from "./limit-context";
import {
  HARD_LIMIT_DESKTOP_BYTES,
  RISK_HARD_LIMIT_DESKTOP_BYTES,
  SOFT_LIMIT_BYTES,
} from "./limits";

const MP_123 = 14575 * 8441;
const MP_40 = MAX_PIXELS + 1;

describe("computeLimitContext", () => {
  it("blocks pixels and consent when risk mode is off", () => {
    const ctx = computeLimitContext({
      fileSize: 60 * 1024 * 1024,
      sourceMeta: { width: 14575, height: 8441, bitDepthLabel: "24-bit" },
      oversizeConsented: false,
      riskModeEnabled: false,
    });

    expect(ctx.exceedsPixelLimit).toBe(true);
    expect(ctx.blockReason).toBe("pixels");
    expect(ctx.canTransmute).toBe(false);
    expect(ctx.needsInputConsent).toBe(true);
    expect(ctx.warnings).not.toContain("risk_mode_active");
  });

  it("allows large pixels and skips consent when risk mode is on", () => {
    const ctx = computeLimitContext({
      fileSize: 60 * 1024 * 1024,
      sourceMeta: { width: 14575, height: 8441, bitDepthLabel: "24-bit" },
      oversizeConsented: false,
      riskModeEnabled: true,
    });

    expect(ctx.exceedsPixelLimit).toBe(true);
    expect(ctx.blockReason).not.toBe("pixels");
    expect(ctx.blockReason).not.toBe("consent");
    expect(ctx.needsInputConsent).toBe(false);
    expect(ctx.canTransmute).toBe(true);
    expect(ctx.warnings).toContain("risk_mode_active");
    expect(ctx.warnings).toContain("astro_tier_dimensions");
  });

  it("raises hard limit bytes in risk mode", () => {
    const normal = computeLimitContext({
      fileSize: 160 * 1024 * 1024,
      sourceMeta: { width: 4096, height: 4096, bitDepthLabel: "24-bit" },
      oversizeConsented: true,
      riskModeEnabled: false,
    });
    const risk = computeLimitContext({
      fileSize: 160 * 1024 * 1024,
      sourceMeta: { width: 4096, height: 4096, bitDepthLabel: "24-bit" },
      oversizeConsented: false,
      riskModeEnabled: true,
    });

    expect(normal.hardLimitBytes).toBe(HARD_LIMIT_DESKTOP_BYTES);
    expect(normal.blockReason).toBe("hard_file");
    expect(risk.hardLimitBytes).toBe(RISK_HARD_LIMIT_DESKTOP_BYTES);
    expect(risk.blockReason).not.toBe("hard_file");
    expect(risk.canTransmute).toBe(true);
  });

  it("uses full hard limit as session ceiling when risk mode is on", () => {
    const ctx = computeLimitContext({
      fileSize: SOFT_LIMIT_BYTES + 1,
      sourceMeta: null,
      oversizeConsented: false,
      riskModeEnabled: true,
    });

    expect(ctx.sessionInputLimitBytes).toBe(RISK_HARD_LIMIT_DESKTOP_BYTES);
  });
});

describe("formatMegapixels", () => {
  it("formats large megapixel counts", () => {
    expect(formatMegapixels(MP_123)).toBe("123");
    expect(formatMegapixels(9_500_000)).toBe("9.5");
  });
});
