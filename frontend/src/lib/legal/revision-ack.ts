import { CURRENT_LEGAL_REVISION } from "./constants";
import { STORAGE_KEYS } from "@/lib/storage/keys";

export type LegalRevisionAck = {
  revision: string;
  acknowledgedAt: string;
};

export function readLegalRevisionAck(): LegalRevisionAck | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEGAL_REVISION_ACK);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LegalRevisionAck>;
    if (typeof parsed.revision !== "string" || typeof parsed.acknowledgedAt !== "string") {
      return null;
    }
    return { revision: parsed.revision, acknowledgedAt: parsed.acknowledgedAt };
  } catch {
    return null;
  }
}

export function isLegalRevisionAcked(revision: string = CURRENT_LEGAL_REVISION): boolean {
  const ack = readLegalRevisionAck();
  return ack?.revision === revision;
}

export function markLegalRevisionAcked(revision: string = CURRENT_LEGAL_REVISION): void {
  if (typeof localStorage === "undefined") return;
  const payload: LegalRevisionAck = {
    revision,
    acknowledgedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.LEGAL_REVISION_ACK, JSON.stringify(payload));
}
