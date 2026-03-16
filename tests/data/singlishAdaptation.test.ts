import { describe, expect, it } from "vitest";
import {
  cgaTerms,
  getAdaptationPhrases,
  medicalTerms,
  singaporePlaces,
  singlishExclamations,
  singlishGrammar,
  singlishParticles,
} from "@/data/singlishAdaptation";

const allCategories = [
  singlishParticles,
  singlishExclamations,
  singlishGrammar,
  medicalTerms,
  cgaTerms,
  singaporePlaces,
];

describe("singlishAdaptation", () => {
  it.each([
    ["singlishParticles", singlishParticles],
    ["singlishExclamations", singlishExclamations],
    ["singlishGrammar", singlishGrammar],
    ["medicalTerms", medicalTerms],
    ["cgaTerms", cgaTerms],
    ["singaporePlaces", singaporePlaces],
  ])("%s is non-empty", (_name: string, list: string[]) => {
    expect(list.length).toBeGreaterThan(0);
  });

  it("getAdaptationPhrases returns combined list with boosts", () => {
    const phrases = getAdaptationPhrases();
    const totalExpected = allCategories.reduce((sum, c) => sum + c.length, 0);

    expect(phrases).toHaveLength(totalExpected);

    for (const phrase of phrases) {
      expect(phrase).toHaveProperty("value");
      expect(typeof phrase.value).toBe("string");
      expect(phrase).toHaveProperty("boost");
      expect(typeof phrase.boost).toBe("number");
    }
  });

  it("has no duplicates across categories", () => {
    const all = allCategories.flat();
    const unique = new Set(all);

    expect(unique.size).toBe(all.length);
  });
});
