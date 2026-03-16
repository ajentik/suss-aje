import { SINGLISH_PARTICLES, type SinglishParticle } from "./singlishGlossary";

export interface NormalizedResult {
  normalized: string;
  clinical: string;
  detectedParticles: SinglishParticle[];
  confidence: number;
}

interface ClinicalPattern {
  pattern: RegExp;
  replacement: string;
}

const CLINICAL_PATTERNS: ReadonlyArray<ClinicalPattern> = [
  // --- Mobility / falls ---
  { pattern: /\bcannot walk\b/gi, replacement: "unable to walk" },
  { pattern: /\bcannot move\b/gi, replacement: "unable to move" },
  { pattern: /\bcannot stand\b/gi, replacement: "unable to stand" },
  { pattern: /\bgot fall before\b/gi, replacement: "has history of falls" },
  { pattern: /\bgot fall down before\b/gi, replacement: "has history of falls" },
  { pattern: /\bfall down already\b/gi, replacement: "has fallen" },
  { pattern: /\balways fall\b/gi, replacement: "experiences frequent falls" },
  { pattern: /\balways fall down\b/gi, replacement: "experiences frequent falls" },

  // --- Medication ---
  { pattern: /\btake medicine already\b/gi, replacement: "medication taken" },
  { pattern: /\beat medicine already\b/gi, replacement: "medication taken" },
  { pattern: /\bnever take medicine\b/gi, replacement: "did not take medication" },
  { pattern: /\bnever eat medicine\b/gi, replacement: "did not take medication" },
  { pattern: /\bforget take medicine\b/gi, replacement: "missed medication" },
  { pattern: /\bforget eat medicine\b/gi, replacement: "missed medication" },

  // --- Pain ---
  { pattern: /\bvery pain one\b/gi, replacement: "reports significant pain" },
  { pattern: /\bvery pain\b/gi, replacement: "reports significant pain" },
  { pattern: /\bgot pain\b/gi, replacement: "reports pain" },
  { pattern: /\bpain until cannot\b/gi, replacement: "pain severe enough to prevent" },
  { pattern: /\bhere pain\b/gi, replacement: "pain at this location" },
  { pattern: /\bwhere pain\b/gi, replacement: "location of pain" },
  { pattern: /\bvery the pain\b/gi, replacement: "reports severe pain" },

  // --- Cognition / memory ---
  { pattern: /\balways forget things?\b/gi, replacement: "reports memory issues" },
  { pattern: /\balways forget\b/gi, replacement: "reports memory issues" },
  { pattern: /\bcannot remember\b/gi, replacement: "reports difficulty with recall" },

  // --- General health ---
  { pattern: /\bgot fever\b/gi, replacement: "reports fever" },
  { pattern: /\bgot cough\b/gi, replacement: "reports cough" },
  { pattern: /\bgot headache\b/gi, replacement: "reports headache" },
  { pattern: /\bgot rash\b/gi, replacement: "reports rash" },
  { pattern: /\bgot diarrhea\b/gi, replacement: "reports diarrhea" },
  { pattern: /\balready eat\b/gi, replacement: "has eaten" },
  { pattern: /\bnever eat\b/gi, replacement: "did not eat" },
  { pattern: /\bnever go doctor\b/gi, replacement: "did not visit the doctor" },
  { pattern: /\bnever go hospital\b/gi, replacement: "did not visit the hospital" },
  { pattern: /\bnever sleep\b/gi, replacement: "did not sleep" },
  { pattern: /\bcannot sleep\b/gi, replacement: "reports insomnia" },

  // --- Existential "got" (generic fallback — must be AFTER specific "got X" patterns) ---
  { pattern: /\bgot ([a-z]+)\b/gi, replacement: "has $1" },

  // --- Completive "already" (generic fallback) ---
  { pattern: /\b(\w+)\s+already\b/gi, replacement: "has $1" },
];

const PARTICLE_REGEX = new RegExp(
  `\\b(${SINGLISH_PARTICLES.join("|")})\\b`,
  "gi",
);

function detectParticles(text: string): SinglishParticle[] {
  const found = new Set<SinglishParticle>();
  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, "");
    if ((SINGLISH_PARTICLES as ReadonlyArray<string>).includes(cleaned)) {
      found.add(cleaned as SinglishParticle);
    }
  }

  return [...found].sort();
}

function stripParticles(text: string): string {
  return text
    .replace(PARTICLE_REGEX, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
}

function applyClinicalPatterns(text: string): string {
  let result = text;
  for (const { pattern, replacement } of CLINICAL_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function computeConfidence(
  original: string,
  detectedParticles: SinglishParticle[],
  clinical: string,
): number {
  if (original.trim().length === 0) return 0;

  const wordCount = original.trim().split(/\s+/).length;
  const particleCount = detectedParticles.length;
  const wasTransformed = clinical !== original;

  let score = 0;

  if (particleCount > 0) score += Math.min(particleCount * 0.15, 0.45);
  if (wasTransformed) score += 0.35;
  if (wordCount >= 3) score += 0.1;
  if (wordCount >= 6) score += 0.1;

  return Math.min(Math.round(score * 100) / 100, 1);
}

export function normalizeSinglish(transcript: string): NormalizedResult {
  if (!transcript || transcript.trim().length === 0) {
    return {
      normalized: "",
      clinical: "",
      detectedParticles: [],
      confidence: 0,
    };
  }

  const trimmed = transcript.trim().replace(/\s+/g, " ");
  const detectedParticles = detectParticles(trimmed);
  const normalized = stripParticles(trimmed);
  const clinical = applyClinicalPatterns(normalized);
  const confidence = computeConfidence(trimmed, detectedParticles, clinical);

  return {
    normalized,
    clinical,
    detectedParticles,
    confidence,
  };
}
