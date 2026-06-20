import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearFileHandoffsForTests,
  consumeFileHandoff,
  FILE_HANDOFF_TTL_MS,
  handoffPayloadToFile,
  markPendingHandoffNavigation,
  peekPendingHandoffNavigation,
  resolveHandoffId,
  stageFileHandoffFromFile,
  stageFileHandoffPayload,
} from "./file-handoff";

describe("file-handoff", () => {
  afterEach(() => {
    clearFileHandoffsForTests();
    vi.useRealTimers();
  });

  it("stages bytes from file and consumes once", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "test.png", { type: "image/png" });
    const id = await stageFileHandoffFromFile(file);
    const payload = consumeFileHandoff(id);
    expect(payload?.fileName).toBe("test.png");
    expect(payload?.bytes.byteLength).toBe(3);
    expect(handoffPayloadToFile(payload!).name).toBe("test.png");
    expect(consumeFileHandoff(id)).toBeNull();
  });

  it("expires after TTL", () => {
    vi.useFakeTimers();
    const id = stageFileHandoffPayload({
      fileName: "a.png",
      bytes: new ArrayBuffer(1),
      lastModified: 0,
      originalSize: 1,
    });
    vi.advanceTimersByTime(FILE_HANDOFF_TTL_MS + 1);
    expect(consumeFileHandoff(id)).toBeNull();
  });

  it("tracks pending navigation id", () => {
    markPendingHandoffNavigation("abc");
    expect(resolveHandoffId(null)).toBe("abc");
    expect(peekPendingHandoffNavigation()).toBe("abc");
  });
});
