import { describe, expect, it } from "vitest";
import { getDroppedFiles } from "./dropped-files";

describe("getDroppedFiles", () => {
  it("returns empty array for null/undefined", () => {
    expect(getDroppedFiles(null)).toEqual([]);
    expect(getDroppedFiles(undefined)).toEqual([]);
  });

  it("falls back to files when items are empty", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    const dt = {
      items: { length: 0, 0: undefined },
      files: [file],
    } as unknown as DataTransfer;
    expect(getDroppedFiles(dt)).toEqual([file]);
  });

  it("prefers items over files when items contain files", () => {
    const a = new File(["a"], "a.png", { type: "image/png" });
    const b = new File(["b"], "b.png", { type: "image/png" });
    const dt = {
      items: {
        length: 2,
        0: { kind: "file", getAsFile: () => a },
        1: { kind: "file", getAsFile: () => b },
      },
      files: [a],
    } as unknown as DataTransfer;
    expect(getDroppedFiles(dt)).toEqual([a, b]);
  });
});
