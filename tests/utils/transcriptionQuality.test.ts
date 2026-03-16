import { describe, expect, it } from "vitest";
import {
  assessTranscriptionQuality,
  type QualityResult,
} from "@/utils/transcriptionQuality";

describe("assessTranscriptionQuality", () => {
  describe("high confidence (>= 0.8)", () => {
    it("returns high quality with no confirmation for confidence 0.8", () => {
      const result: QualityResult = assessTranscriptionQuality(
        "Where is the library?",
        0.8,
      );

      expect(result.quality).toBe("high");
      expect(result.shouldConfirm).toBe(false);
      expect(result.suggestion).toBeUndefined();
    });

    it("returns high quality for confidence 1.0", () => {
      const result = assessTranscriptionQuality("Show me the map", 1.0);

      expect(result.quality).toBe("high");
      expect(result.shouldConfirm).toBe(false);
    });

    it("returns high quality for confidence 0.95", () => {
      const result = assessTranscriptionQuality(
        "What events are happening today?",
        0.95,
      );

      expect(result.quality).toBe("high");
      expect(result.shouldConfirm).toBe(false);
    });
  });

  describe("medium confidence (0.6 - 0.8)", () => {
    it("returns medium quality with confirmation for confidence 0.7", () => {
      const result = assessTranscriptionQuality(
        "Navigate to the canteen",
        0.7,
      );

      expect(result.quality).toBe("medium");
      expect(result.shouldConfirm).toBe(true);
      expect(result.suggestion).toBe("Did you mean...?");
    });

    it("returns medium quality for confidence 0.6", () => {
      const result = assessTranscriptionQuality("Find food nearby", 0.6);

      expect(result.quality).toBe("medium");
      expect(result.shouldConfirm).toBe(true);
    });

    it("returns medium quality for confidence 0.79", () => {
      const result = assessTranscriptionQuality("Hello there", 0.79);

      expect(result.quality).toBe("medium");
      expect(result.shouldConfirm).toBe(true);
    });
  });

  describe("low confidence (< 0.6)", () => {
    it("returns low quality with re-speak suggestion for confidence 0.5", () => {
      const result = assessTranscriptionQuality("mumble words", 0.5);

      expect(result.quality).toBe("low");
      expect(result.shouldConfirm).toBe(true);
      expect(result.suggestion).toBe(
        "I did not catch that clearly. Could you repeat?",
      );
    });

    it("returns low quality for confidence 0.0", () => {
      const result = assessTranscriptionQuality("some text", 0.0);

      expect(result.quality).toBe("low");
      expect(result.shouldConfirm).toBe(true);
    });

    it("returns low quality for confidence 0.59", () => {
      const result = assessTranscriptionQuality("unclear input", 0.59);

      expect(result.quality).toBe("low");
      expect(result.shouldConfirm).toBe(true);
    });
  });

  describe("nonsensical output detection", () => {
    it("flags empty string as low quality regardless of confidence", () => {
      const result = assessTranscriptionQuality("", 0.95);

      expect(result.quality).toBe("low");
      expect(result.shouldConfirm).toBe(true);
      expect(result.suggestion).toBe(
        "I did not catch that clearly. Could you repeat?",
      );
    });

    it("flags single character as low quality regardless of confidence", () => {
      const result = assessTranscriptionQuality("a", 0.9);

      expect(result.quality).toBe("low");
      expect(result.shouldConfirm).toBe(true);
    });

    it("flags whitespace-only string as low quality", () => {
      const result = assessTranscriptionQuality("   ", 0.85);

      expect(result.quality).toBe("low");
      expect(result.shouldConfirm).toBe(true);
    });

    it("flags all-same-word repetition as low quality", () => {
      const result = assessTranscriptionQuality("the the the the", 0.9);

      expect(result.quality).toBe("low");
      expect(result.shouldConfirm).toBe(true);
    });

    it("flags mostly-same-word repetition as low quality", () => {
      const result = assessTranscriptionQuality(
        "hello hello hello hello world",
        0.85,
      );

      expect(result.quality).toBe("low");
      expect(result.shouldConfirm).toBe(true);
    });

    it("does not flag varied text as nonsensical", () => {
      const result = assessTranscriptionQuality(
        "Where is the nearest food court",
        0.85,
      );

      expect(result.quality).toBe("high");
      expect(result.shouldConfirm).toBe(false);
    });

    it("does not flag two-character transcript as nonsensical", () => {
      const result = assessTranscriptionQuality("hi", 0.9);

      expect(result.quality).toBe("high");
      expect(result.shouldConfirm).toBe(false);
    });
  });
});
