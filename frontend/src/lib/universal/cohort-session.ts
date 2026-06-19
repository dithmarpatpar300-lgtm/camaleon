import type { InputCohort } from "@/lib/tools/universal-matrix";

const SESSION_TTL_MS = 60 * 60 * 1000;

export type MixedCohortSession = {
  cohorts: InputCohort[];
  unsupported: File[];
  capped: boolean;
  expiresAt: number;
};

let activeSession: MixedCohortSession | null = null;

function pruneExpired(): void {
  if (activeSession && Date.now() > activeSession.expiresAt) {
    activeSession = null;
  }
}

export function getMixedCohortSession(): MixedCohortSession | null {
  pruneExpired();
  return activeSession;
}

export function saveMixedCohortSession(
  cohorts: InputCohort[],
  unsupported: File[],
  capped: boolean
): void {
  if (cohorts.length === 0) {
    activeSession = null;
    return;
  }
  activeSession = {
    cohorts,
    unsupported,
    capped,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
}

export function removeCohortFromSession(cohortId: string): InputCohort[] {
  pruneExpired();
  if (!activeSession) return [];
  const remaining = activeSession.cohorts.filter((c) => c.id !== cohortId);
  if (remaining.length === 0) {
    activeSession = null;
    return [];
  }
  activeSession = {
    ...activeSession,
    cohorts: remaining,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  return remaining;
}

export function clearMixedCohortSession(): void {
  activeSession = null;
}
