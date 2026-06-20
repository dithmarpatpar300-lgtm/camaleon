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

  it("assigns unique section ids for every target", () => {
    const ids = TARGETS.map((t) => SETTINGS_FOCUS[t].sectionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("creates focus requests with monotonic seq", () => {
    const a = createSettingsFocusRequest("risk");
    const b = createSettingsFocusRequest("risk");
    expect(a.target).toBe("risk");
    expect(b.seq).toBeGreaterThanOrEqual(a.seq);
  });
});
