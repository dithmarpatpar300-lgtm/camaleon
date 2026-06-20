import type { LimitBlockReason } from "@/lib/transmutation/limit-context";
import { getHardLimitBytes } from "@/lib/transmutation/limits";

export function fileExceedsStandardHardLimit(
  fileSize: number,
  deviceMemoryGb?: number
): boolean {
  return fileSize > getHardLimitBytes(deviceMemoryGb, false);
}

export function fileFitsRiskHardLimit(
  fileSize: number,
  deviceMemoryGb?: number
): boolean {
  return fileSize <= getHardLimitBytes(deviceMemoryGb, true);
}

export type RiskUnlockPromptContext = {
  hardLimitPendingFile: File | null;
  stagedFileSize: number | null;
  /** Last block reason captured while Risk mode was off (consent / hard_file). */
  prevBlockReasonWhileRiskOff: LimitBlockReason;
  deviceMemoryGb?: number;
};

/**
 * Whether to show the post–Risk-mode “proceed?” confirmation instead of a hard-limit error.
 */
export function shouldPromptRiskUnlockProceed(
  riskModeEnabled: boolean,
  riskJustEnabled: boolean,
  ctx: RiskUnlockPromptContext
): boolean {
  if (!riskModeEnabled || !riskJustEnabled) return false;

  const { hardLimitPendingFile, stagedFileSize, prevBlockReasonWhileRiskOff, deviceMemoryGb } =
    ctx;

  if (hardLimitPendingFile) {
    return fileFitsRiskHardLimit(hardLimitPendingFile.size, deviceMemoryGb);
  }

  if (stagedFileSize == null) return false;

  if (
    fileExceedsStandardHardLimit(stagedFileSize, deviceMemoryGb) &&
    fileFitsRiskHardLimit(stagedFileSize, deviceMemoryGb)
  ) {
    return true;
  }

  return prevBlockReasonWhileRiskOff === "consent";
}
