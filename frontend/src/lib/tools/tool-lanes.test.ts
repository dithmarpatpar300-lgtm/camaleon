import { describe, expect, it } from "vitest";
import { getActiveTools } from "./tool-registry";
import {
  filterToolsByLane,
  laneForCategory,
} from "./tool-lanes";

describe("tool-lanes", () => {
  it("maps category to lane", () => {
    expect(laneForCategory("image")).toBe("convert");
    expect(laneForCategory("optimize")).toBe("optimize");
  });

  it("splits active tools into convert and optimize lanes", () => {
    const active = getActiveTools();
    const convert = filterToolsByLane(active, "convert");
    const optimize = filterToolsByLane(active, "optimize");

    expect(convert.every((t) => t.category === "image")).toBe(true);
    expect(optimize.every((t) => t.category === "optimize")).toBe(true);
    expect(convert.length + optimize.length).toBe(active.length);
    expect(optimize.length).toBe(4);
  });
});
