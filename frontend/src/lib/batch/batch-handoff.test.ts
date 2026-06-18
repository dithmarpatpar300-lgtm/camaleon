import { afterEach, describe, expect, it, vi } from "vitest";
import {
  batchHandoffPayloadToFiles,
  BATCH_HANDOFF_TTL_MS,
  BatchHandoffError,
  clearBatchHandoffsForTests,
  consumeBatchHandoff,
  markPendingBatchHandoffNavigation,
  resolveBatchHandoffId,
  stageBatchHandoffFromFiles,
  stageBatchHandoffPayload,
} from "./batch-handoff";

describe("batch-handoff", () => {
  afterEach(() => {
    clearBatchHandoffsForTests();
    vi.useRealTimers();
  });

  it("stages files and consumes once", async () => {
    const files = [
      new File([new Uint8Array([1, 2])], "a.png", { type: "image/png" }),
      new File([new Uint8Array([3])], "b.png", { type: "image/png" }),
    ];
    const id = await stageBatchHandoffFromFiles(files, "png-to-jpg");
    const payload = consumeBatchHandoff(id);
    expect(payload?.toolSlug).toBe("png-to-jpg");
    expect(payload?.items).toHaveLength(2);
    const restored = batchHandoffPayloadToFiles(payload!);
    expect(restored.map((f) => f.name)).toEqual(["a.png", "b.png"]);
    expect(consumeBatchHandoff(id)).toBeNull();
  });

  it("expires after TTL", () => {
    vi.useFakeTimers();
    const id = stageBatchHandoffPayload({
      toolSlug: "png-to-jpg",
      items: [
        {
          fileName: "a.png",
          bytes: new ArrayBuffer(1),
          lastModified: 0,
        },
      ],
    });
    vi.advanceTimersByTime(BATCH_HANDOFF_TTL_MS + 1);
    expect(consumeBatchHandoff(id)).toBeNull();
  });

  it("tracks pending navigation id", () => {
    markPendingBatchHandoffNavigation("batch-abc");
    expect(resolveBatchHandoffId(null)).toBe("batch-abc");
  });

  it("rejects empty file list", async () => {
    await expect(stageBatchHandoffFromFiles([], "png-to-jpg")).rejects.toBeInstanceOf(
      BatchHandoffError
    );
  });
});
