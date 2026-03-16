export type QualityLevel = "high" | "medium" | "low";

export interface QualityResult {
  quality: QualityLevel;
  shouldConfirm: boolean;
  suggestion?: string;
}

const MIN_MEANINGFUL_LENGTH = 2;
const MAX_REPEATED_WORD_RATIO = 0.8;

function isNonsensical(transcript: string): boolean {
  const trimmed = transcript.trim();

  if (trimmed.length < MIN_MEANINGFUL_LENGTH) {
    return true;
  }

  const words = trimmed.toLowerCase().split(/\s+/);
  if (words.length > 1) {
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
    const maxCount = Math.max(...wordCounts.values());
    if (maxCount / words.length >= MAX_REPEATED_WORD_RATIO) {
      return true;
    }
  }

  return false;
}

export function assessTranscriptionQuality(
  transcript: string,
  confidence: number,
): QualityResult {
  if (isNonsensical(transcript)) {
    return {
      quality: "low",
      shouldConfirm: true,
      suggestion:
        "I did not catch that clearly. Could you repeat?",
    };
  }

  if (confidence >= 0.8) {
    return { quality: "high", shouldConfirm: false };
  }

  if (confidence >= 0.6) {
    return {
      quality: "medium",
      shouldConfirm: true,
      suggestion: "Did you mean...?",
    };
  }

  return {
    quality: "low",
    shouldConfirm: true,
    suggestion:
      "I did not catch that clearly. Could you repeat?",
  };
}
