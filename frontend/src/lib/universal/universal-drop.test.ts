import { describe, expect, it } from "vitest";
import { batchOutputToolsForCohort, resolveUniversalDrop } from "./universal-drop";
import {
  clearMixedCohortSession,
  getMixedCohortSession,
  removeCohortFromSession,
  saveMixedCohortSession,
} from "./cohort-session";
import { buildCohorts } from "@/lib/tools/universal-matrix";

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

  it("returns mixed_cohorts with full cohorts for PNG + SVG", () => {
    const files = [new File([], "a.png"), new File([], "b.svg")];
    const result = resolveUniversalDrop(files);
    expect(result.kind).toBe("mixed_cohorts");
    if (result.kind === "mixed_cohorts") {
      expect(result.cohorts).toHaveLength(2);
      expect(result.cohorts.some((c) => c.familyLabel === "PNG")).toBe(true);
      expect(result.cohorts.some((c) => c.familyLabel === "SVG")).toBe(true);
    }
  });

  it("returns unsupported when all files unknown", () => {
    const result = resolveUniversalDrop([new File([], "x.heic")]);
    expect(result.kind).toBe("unsupported");
  });

  it("uses only first file when multi-drop disabled", () => {
    const files = [
      new File([], "a.png"),
      new File([], "b.png"),
      new File([], "c.png"),
    ];
    const result = resolveUniversalDrop(files, undefined, { allowMultiDrop: false });
    expect(result.kind).toBe("single");
    if (result.kind === "single") {
      expect(result.cohort.files).toHaveLength(1);
      expect(result.cohort.files[0].name).toBe("a.png");
    }
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

describe("cohort session", () => {
  it("saves and retrieves mixed cohort session", () => {
    clearMixedCohortSession();
    const { cohorts } = buildCohorts([new File([], "a.png"), new File([], "b.svg")]);
    saveMixedCohortSession(cohorts, [], false);
    const session = getMixedCohortSession();
    expect(session?.cohorts).toHaveLength(2);
  });

  it("removes one cohort and keeps the rest", () => {
    clearMixedCohortSession();
    const { cohorts } = buildCohorts([new File([], "a.png"), new File([], "b.svg")]);
    saveMixedCohortSession(cohorts, [], false);
    const pngCohort = cohorts.find((c) => c.familyLabel === "PNG");
    expect(pngCohort).toBeDefined();
    const remaining = removeCohortFromSession(pngCohort!.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].familyLabel).toBe("SVG");
  });
});
