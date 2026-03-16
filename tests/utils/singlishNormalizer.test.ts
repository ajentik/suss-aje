import { describe, expect, it } from "vitest";
import { normalizeSinglish } from "@/utils/singlishNormalizer";
import {
  SINGLISH_GLOSSARY,
  SINGLISH_GLOSSARY_PROMPT,
  SINGLISH_PARTICLES,
} from "@/utils/singlishGlossary";

describe("normalizeSinglish", () => {
  describe("particle detection", () => {
    it("detects 'lah' particle", () => {
      const result = normalizeSinglish("cannot walk lah");
      expect(result.detectedParticles).toContain("lah");
    });

    it("detects 'lor' particle", () => {
      const result = normalizeSinglish("take medicine lor");
      expect(result.detectedParticles).toContain("lor");
    });

    it("detects 'meh' particle", () => {
      const result = normalizeSinglish("really meh");
      expect(result.detectedParticles).toContain("meh");
    });

    it("detects 'hor' particle", () => {
      const result = normalizeSinglish("this one hor, very pain");
      expect(result.detectedParticles).toContain("hor");
      expect(result.detectedParticles).toContain("one");
    });

    it("detects multiple particles in one sentence", () => {
      const result = normalizeSinglish("you know hor, very pain lah, no choice lor");
      expect(result.detectedParticles).toContain("hor");
      expect(result.detectedParticles).toContain("lah");
      expect(result.detectedParticles).toContain("lor");
    });

    it("returns particles in sorted order", () => {
      const result = normalizeSinglish("okay lor, pain lah, really meh");
      const sorted = [...result.detectedParticles].sort();
      expect(result.detectedParticles).toEqual(sorted);
    });

    it("does not duplicate particles found multiple times", () => {
      const result = normalizeSinglish("pain lah, really lah, okay lah");
      const lahCount = result.detectedParticles.filter((p) => p === "lah").length;
      expect(lahCount).toBe(1);
    });
  });

  describe("normalized output", () => {
    it("strips particles from output", () => {
      const result = normalizeSinglish("cannot walk lah");
      expect(result.normalized).toBe("cannot walk");
    });

    it("strips multiple particles", () => {
      const result = normalizeSinglish("this one hor very pain lah");
      expect(result.normalized).not.toContain("hor");
      expect(result.normalized).not.toContain("lah");
    });

    it("preserves non-particle words", () => {
      const result = normalizeSinglish("I take medicine already");
      expect(result.normalized).toContain("take");
      expect(result.normalized).toContain("medicine");
    });

    it("collapses extra whitespace after stripping", () => {
      const result = normalizeSinglish("pain  lah  very  bad");
      expect(result.normalized).not.toMatch(/\s{2,}/);
    });
  });

  describe("clinical normalization", () => {
    it("converts 'cannot walk lah' to clinical language", () => {
      const result = normalizeSinglish("cannot walk lah");
      expect(result.clinical).toBe("unable to walk");
    });

    it("converts 'got fall before' to clinical language", () => {
      const result = normalizeSinglish("got fall before");
      expect(result.clinical).toBe("has history of falls");
    });

    it("converts 'take medicine already' to clinical language", () => {
      const result = normalizeSinglish("take medicine already");
      expect(result.clinical).toBe("medication taken");
    });

    it("converts 'very pain one' to clinical language", () => {
      const result = normalizeSinglish("very pain one");
      expect(result.clinical).toBe("reports significant pain");
    });

    it("converts 'always forget things' to clinical language", () => {
      const result = normalizeSinglish("always forget things");
      expect(result.clinical).toBe("reports memory issues");
    });

    it("converts 'never take medicine' to clinical language", () => {
      const result = normalizeSinglish("never take medicine");
      expect(result.clinical).toBe("did not take medication");
    });

    it("converts 'got fever' to clinical language", () => {
      const result = normalizeSinglish("got fever");
      expect(result.clinical).toBe("reports fever");
    });

    it("converts 'cannot sleep' to clinical language", () => {
      const result = normalizeSinglish("cannot sleep");
      expect(result.clinical).toBe("reports insomnia");
    });

    it("handles multiple clinical patterns in one sentence", () => {
      const result = normalizeSinglish("got fever and cannot sleep lah");
      expect(result.clinical).toContain("reports fever");
      expect(result.clinical).toContain("reports insomnia");
    });

    it("is case-insensitive for pattern matching", () => {
      const result = normalizeSinglish("Cannot Walk LAH");
      expect(result.clinical).toBe("unable to walk");
    });
  });

  describe("confidence scoring", () => {
    it("returns 0 for empty input", () => {
      const result = normalizeSinglish("");
      expect(result.confidence).toBe(0);
    });

    it("returns higher confidence when particles are detected", () => {
      const withParticle = normalizeSinglish("pain lah");
      const without = normalizeSinglish("pain");
      expect(withParticle.confidence).toBeGreaterThan(without.confidence);
    });

    it("returns higher confidence when clinical patterns match", () => {
      const clinical = normalizeSinglish("cannot walk");
      const plain = normalizeSinglish("hello world");
      expect(clinical.confidence).toBeGreaterThan(plain.confidence);
    });

    it("returns confidence between 0 and 1", () => {
      const result = normalizeSinglish("cannot walk lah very pain one got fever");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      const result = normalizeSinglish("");
      expect(result.normalized).toBe("");
      expect(result.clinical).toBe("");
      expect(result.detectedParticles).toEqual([]);
      expect(result.confidence).toBe(0);
    });

    it("handles whitespace-only input", () => {
      const result = normalizeSinglish("   ");
      expect(result.normalized).toBe("");
      expect(result.clinical).toBe("");
      expect(result.detectedParticles).toEqual([]);
      expect(result.confidence).toBe(0);
    });

    it("handles standard English without Singlish", () => {
      const result = normalizeSinglish("The patient has a headache");
      expect(result.normalized).toBe("The patient has a headache");
      expect(result.detectedParticles).toEqual([]);
    });

    it("handles Mandarin code-switching gracefully", () => {
      const result = normalizeSinglish("很痛 lah cannot walk");
      expect(result.detectedParticles).toContain("lah");
      expect(result.clinical).toContain("unable to walk");
    });

    it("handles mixed Singlish and standard English", () => {
      const result = normalizeSinglish(
        "The patient got fall before and cannot walk lah",
      );
      expect(result.clinical).toContain("has history of falls");
      expect(result.clinical).toContain("unable to walk");
    });

    it("preserves input meaning when no patterns match", () => {
      const input = "scheduled appointment for Tuesday";
      const result = normalizeSinglish(input);
      expect(result.normalized).toBe(input);
      expect(result.clinical).toBe(input);
    });

    it("handles very long input", () => {
      const longInput = "got pain lah ".repeat(100).trim();
      const result = normalizeSinglish(longInput);
      expect(result.detectedParticles).toContain("lah");
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});

describe("singlishGlossary", () => {
  it("exports a non-empty glossary array", () => {
    expect(SINGLISH_GLOSSARY.length).toBeGreaterThan(0);
  });

  it("has examples for every glossary entry", () => {
    for (const entry of SINGLISH_GLOSSARY) {
      expect(entry.examples.length).toBeGreaterThan(0);
    }
  });

  it("exports a non-empty particles array", () => {
    expect(SINGLISH_PARTICLES.length).toBeGreaterThan(0);
  });

  it("includes common particles", () => {
    expect(SINGLISH_PARTICLES).toContain("lah");
    expect(SINGLISH_PARTICLES).toContain("lor");
    expect(SINGLISH_PARTICLES).toContain("meh");
    expect(SINGLISH_PARTICLES).toContain("hor");
  });

  it("exports a prompt string containing glossary content", () => {
    expect(SINGLISH_GLOSSARY_PROMPT).toContain("Singlish");
    expect(SINGLISH_GLOSSARY_PROMPT).toContain("already");
    expect(SINGLISH_GLOSSARY_PROMPT).toContain("got");
    expect(SINGLISH_GLOSSARY_PROMPT).toContain("lah");
  });

  it("prompt string includes clinical context header", () => {
    expect(SINGLISH_GLOSSARY_PROMPT).toContain("Clinical Transcription");
  });

  it("every glossary entry appears in the prompt string", () => {
    for (const entry of SINGLISH_GLOSSARY) {
      expect(SINGLISH_GLOSSARY_PROMPT).toContain(entry.term);
    }
  });
});
