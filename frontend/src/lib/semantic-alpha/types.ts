export type AlphaConfidence = "none" | "structural" | "sampled" | "full";

export type AlphaAssessment = {
  hasAlphaChannel: boolean;
  hasMeaningfulAlpha: boolean;
  confidence: AlphaConfidence;
};

export type AlphaAssessmentHandle = {
  has_alpha_channel: boolean;
  has_meaningful_alpha: boolean;
  confidence: number;
};

const CONFIDENCE_BY_CODE: AlphaConfidence[] = [
  "none",
  "structural",
  "sampled",
  "full",
];

export function wrapAlphaAssessment(handle: AlphaAssessmentHandle): AlphaAssessment {
  return {
    hasAlphaChannel: handle.has_alpha_channel,
    hasMeaningfulAlpha: handle.has_meaningful_alpha,
    confidence: CONFIDENCE_BY_CODE[handle.confidence] ?? "sampled",
  };
}
