import { describe, expect, it } from "vitest";
import { batchOutputToolsForCohort, resolveUniversalDrop } from "./universal-drop";

describe("resolveUniversalDrop", () => {
  it("returns empty for no files", () => {
    expect(resolveUniversalDrop([])).toEqual({ kind: "empty" });
  });

  it("returns single for one PNG", () => {
    const files = [new File([], "a.png")];
    const result = resolveUniversalDrop(files);
    expect(result.kind).toBe("single");
    if (result.kind === "single") {
      expect(result.cohort.files).toHaveLength(1);
    }
  });

  it("returns batch for five PNG files", () => {
    const files = Array.from({ length: 5 }, (_, i) => new File([], `photo-${i}.png`));
    const result = resolveUniversalDrop(files);
    expect(result.kind).toBe("batch");
    if (result.kind === "batch") {
      expect(result.cohort.files).toHaveLength(5);
      expect(result.cohort.familyLabel).toBe("PNG");
    }
  });

  it("returns mixed_cohorts for PNG + SVG", () => {
    const files = [new File([], "a.png"), new File([], "b.svg")];
    expect(resolveUniversalDrop(files)).toEqual({ kind: "mixed_cohorts", cohortCount: 2 });
  });

  it("returns unsupported when all files unknown", () => {
    const result = resolveUniversalDrop([new File([], "x.heic")]);
    expect(result.kind).toBe("unsupported");
  });

  it("batchOutputToolsForCohort returns batch-enabled slugs only", () => {
    const files = [new File([], "a.png"), new File([], "b.png")];
    const result = resolveUniversalDrop(files);
    expect(result.kind).toBe("batch");
    if (result.kind === "batch") {
      const tools = batchOutputToolsForCohort(result.cohort);
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t) => t.slug === "png-to-jpg")).toBe(true);
    }
  });
});
