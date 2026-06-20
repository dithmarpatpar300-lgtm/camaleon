import { describe, expect, it, beforeEach, vi } from "vitest";
import { CURRENT_LEGAL_REVISION } from "./constants";
import {
  isLegalRevisionAcked,
  markLegalRevisionAcked,
  readLegalRevisionAck,
} from "./revision-ack";
import { STORAGE_KEYS } from "@/lib/storage/keys";

const store: Record<string, string> = {};

function mockLocalStorage() {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
  });
}

describe("legal revision ack", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    mockLocalStorage();
  });

  it("returns false when no ack stored", () => {
    expect(isLegalRevisionAcked()).toBe(false);
    expect(readLegalRevisionAck()).toBeNull();
  });

  it("stores and reads ack for current revision", () => {
    markLegalRevisionAcked(CURRENT_LEGAL_REVISION);
    expect(isLegalRevisionAcked()).toBe(true);
    const ack = readLegalRevisionAck();
    expect(ack?.revision).toBe(CURRENT_LEGAL_REVISION);
    expect(ack?.acknowledgedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(localStorage.getItem(STORAGE_KEYS.LEGAL_REVISION_ACK)).toBeTruthy();
  });

  it("returns false when stored revision differs", () => {
    markLegalRevisionAcked("old-revision");
    expect(isLegalRevisionAcked(CURRENT_LEGAL_REVISION)).toBe(false);
  });
});
