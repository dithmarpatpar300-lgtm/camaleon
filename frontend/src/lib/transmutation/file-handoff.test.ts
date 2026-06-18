import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearFileHandoffsForTests,
  consumeFileHandoff,
  FILE_HANDOFF_TTL_MS,
  stageFileHandoff,
} from "./file-handoff";

function makeFile(name = "test.png"): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });
}

describe("file-handoff", () => {
  afterEach(() => {
    clearFileHandoffsForTests();
    vi.useRealTimers();
  });

  it("stages and consumes a file once", () => {
    const file = makeFile();
    const id = stageFileHandoff(file);
    expect(consumeFileHandoff(id)?.name).toBe("test.png");
    expect(consumeFileHandoff(id)).toBeNull();
  });

  it("expires after TTL", () => {
    vi.useFakeTimers();
    const id = stageFileHandoff(makeFile());
    vi.advanceTimersByTime(FILE_HANDOFF_TTL_MS + 1);
    expect(consumeFileHandoff(id)).toBeNull();
  });
});
