import { describe, expect, it } from "vitest";
import {
  fileExceedsStandardHardLimit,
  fileFitsRiskHardLimit,
  shouldPromptRiskUnlockProceed,
} from "./risk-unlock";
import { HARD_LIMIT_DESKTOP_BYTES, RISK_HARD_LIMIT_DESKTOP_BYTES } from "./limits";

describe("risk-unlock", () => {
  it("detects standard vs risk hard limits", () => {
    expect(fileExceedsStandardHardLimit(HARD_LIMIT_DESKTOP_BYTES + 1)).toBe(true);
    expect(fileExceedsStandardHardLimit(HARD_LIMIT_DESKTOP_BYTES)).toBe(false);
    expect(fileFitsRiskHardLimit(RISK_HARD_LIMIT_DESKTOP_BYTES)).toBe(true);
    expect(fileFitsRiskHardLimit(RISK_HARD_LIMIT_DESKTOP_BYTES + 1)).toBe(false);
  });

  it("prompts when a gate-blocked file fits the risk ceiling", () => {
    const file = new File([new ArrayBuffer(200 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    expect(
      shouldPromptRiskUnlockProceed(true, true, {
        hardLimitPendingFile: file,
        stagedFileSize: null,
        prevBlockReasonWhileRiskOff: null,
      })
    ).toBe(true);
  });

  it("does not prompt when the file exceeds even the risk ceiling", () => {
    const file = new File([new ArrayBuffer(RISK_HARD_LIMIT_DESKTOP_BYTES + 1)], "huge.png", {
      type: "image/png",
    });
    expect(
      shouldPromptRiskUnlockProceed(true, true, {
        hardLimitPendingFile: file,
        stagedFileSize: null,
        prevBlockReasonWhileRiskOff: null,
      })
    ).toBe(false);
  });

  it("prompts for a staged file that exceeded standard limits", () => {
    const size = HARD_LIMIT_DESKTOP_BYTES + 1024;
    expect(
      shouldPromptRiskUnlockProceed(true, true, {
        hardLimitPendingFile: null,
        stagedFileSize: size,
        prevBlockReasonWhileRiskOff: null,
      })
    ).toBe(true);
  });

  it("prompts when consent was required before Risk mode", () => {
    expect(
      shouldPromptRiskUnlockProceed(true, true, {
        hardLimitPendingFile: null,
        stagedFileSize: 50 * 1024 * 1024,
        prevBlockReasonWhileRiskOff: "consent",
      })
    ).toBe(true);
  });

  it("does not prompt when Risk mode was already on", () => {
    const file = new File([new ArrayBuffer(200 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    expect(
      shouldPromptRiskUnlockProceed(true, false, {
        hardLimitPendingFile: file,
        stagedFileSize: null,
        prevBlockReasonWhileRiskOff: null,
      })
    ).toBe(false);
  });
});
