import { describe, expect, it } from "vitest";
import {
  SETTINGS_FOCUS,
  createSettingsFocusRequest,
  type SettingsFocusTarget,
} from "./settings-focus";

const TARGETS: SettingsFocusTarget[] = [
  "risk",
  "offline",
  "batch",
  "batch-download",
  "performance",
  "notices",
  "updates",
  "defaults",
];

describe("settings-focus", () => {
  it("maps risk to warning pulse tone", () => {
    expect(SETTINGS_FOCUS.risk.pulse).toBe("warning");
    expect(SETTINGS_FOCUS.risk.sectionId).toBe("settings-section-risk");
  });

  it("maps offline and batch to accent pulse tone", () => {
    expect(SETTINGS_FOCUS.offline.pulse).toBe("accent");
    expect(SETTINGS_FOCUS.batch.pulse).toBe("accent");
  });

  it("maps batch-download to batch section with row id", () => {
    expect(SETTINGS_FOCUS["batch-download"].sectionId).toBe("settings-section-batch");
    expect(SETTINGS_FOCUS["batch-download"].rowId).toBe("settings-row-batch-download");
  });

  it("allows sub-targets to share a section id but use distinct row ids", () => {
    expect(SETTINGS_FOCUS.batch.sectionId).toBe(SETTINGS_FOCUS["batch-download"].sectionId);
    expect(SETTINGS_FOCUS["batch-download"].rowId).toBe("settings-row-batch-download");
    expect(SETTINGS_FOCUS.batch.rowId).toBeUndefined();
  });

  it("creates focus requests with monotonic seq", () => {
    const a = createSettingsFocusRequest("risk");
    const b = createSettingsFocusRequest("risk");
    expect(a.target).toBe("risk");
    expect(b.seq).toBeGreaterThanOrEqual(a.seq);
  });
});
