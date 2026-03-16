"use client";

import { useRef } from "react";

export interface STTComparisonEntry {
  sessionId: string;
  utteranceId: string;
  browserTranscript: string;
  googleTranscript: string;
  browserConfidence: number;
  googleConfidence: number;
  matchRate: number;
  wer: number;
  timestamp: number;
}

export interface STTComparisonStats {
  totalComparisons: number;
  averageMatchRate: number;
  averageWER: number;
  averageBrowserConfidence: number;
  averageGoogleConfidence: number;
  browserWinsCount: number;
  googleWinsCount: number;
  tiesCount: number;
}

export interface STTComparisonConfig {
  /** Percentage of sessions that run dual STT (0–100). Default 10. */
  samplingRate: number;
  /** localStorage key for persisting comparison logs. */
  storageKey: string;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

const DEFAULT_CONFIG: STTComparisonConfig = {
  samplingRate: 10,
  storageKey: "stt-comparison-log",
};

const SESSION_FLAG_KEY = "stt-comparison-enrolled";

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * WER = (substitutions + insertions + deletions) / referenceLength
 * Uses Wagner–Fischer (Levenshtein) on word tokens.
 * Returns 0 when both empty; 1 when reference is empty but hypothesis is not.
 */
export function calculateWER(hypothesis: string, reference: string): number {
  const hyp = tokenize(hypothesis);
  const ref = tokenize(reference);

  if (ref.length === 0 && hyp.length === 0) return 0;
  if (ref.length === 0) return 1;

  const m = ref.length;
  const n = hyp.length;

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  const curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,     // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    prev = [...curr];
  }

  return Math.min(prev[n] / m, 1);
}

export function calculateMatchRate(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  if (tokensA.length === 0 && tokensB.length === 0) return 1;
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setB = new Set(tokensB);
  const matches = tokensA.filter((t) => setB.has(t)).length;

  return matches / Math.max(tokensA.length, tokensB.length);
}

function readLog(storageKey: string): STTComparisonEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as STTComparisonEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLog(storageKey: string, entries: STTComparisonEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  } catch {
    // Storage full — silently drop to avoid breaking the app
  }
}

/**
 * Session-sticky enrollment: decides once per session whether to participate
 * in A/B testing, caching the result in sessionStorage so re-renders don't
 * re-roll the dice.
 */
export function isSessionEnrolled(samplingRate: number): boolean {
  if (typeof window === "undefined") return false;

  const cached = sessionStorage.getItem(SESSION_FLAG_KEY);
  if (cached !== null) return cached === "1";

  const enrolled = Math.random() * 100 < samplingRate;
  sessionStorage.setItem(SESSION_FLAG_KEY, enrolled ? "1" : "0");
  return enrolled;
}

export function getComparisonStats(
  storageKey: string = DEFAULT_CONFIG.storageKey
): STTComparisonStats {
  const entries = readLog(storageKey);

  if (entries.length === 0) {
    return {
      totalComparisons: 0,
      averageMatchRate: 0,
      averageWER: 0,
      averageBrowserConfidence: 0,
      averageGoogleConfidence: 0,
      browserWinsCount: 0,
      googleWinsCount: 0,
      tiesCount: 0,
    };
  }

  let matchRateSum = 0;
  let werSum = 0;
  let browserConfSum = 0;
  let googleConfSum = 0;
  let browserWins = 0;
  let googleWins = 0;
  let ties = 0;

  for (const e of entries) {
    matchRateSum += e.matchRate;
    werSum += e.wer;
    browserConfSum += e.browserConfidence;
    googleConfSum += e.googleConfidence;

    if (e.browserConfidence > e.googleConfidence) browserWins++;
    else if (e.googleConfidence > e.browserConfidence) googleWins++;
    else ties++;
  }

  const n = entries.length;
  return {
    totalComparisons: n,
    averageMatchRate: matchRateSum / n,
    averageWER: werSum / n,
    averageBrowserConfidence: browserConfSum / n,
    averageGoogleConfidence: googleConfSum / n,
    browserWinsCount: browserWins,
    googleWinsCount: googleWins,
    tiesCount: ties,
  };
}

export function useSTTComparison(overrides?: Partial<STTComparisonConfig>) {
  const config: STTComparisonConfig = { ...DEFAULT_CONFIG, ...overrides };
  const utteranceCounter = useRef(0);
  const sessionIdRef = useRef<string>(generateSessionId());

  const enrolled = isSessionEnrolled(config.samplingRate);

  const recordComparison = (
    browser: SpeechRecognitionResult,
    google: SpeechRecognitionResult
  ): STTComparisonEntry | null => {
    if (!enrolled) return null;

    utteranceCounter.current += 1;

    const entry: STTComparisonEntry = {
      sessionId: sessionIdRef.current,
      utteranceId: `${sessionIdRef.current}-${utteranceCounter.current}`,
      browserTranscript: browser.transcript,
      googleTranscript: google.transcript,
      browserConfidence: browser.confidence,
      googleConfidence: google.confidence,
      matchRate: calculateMatchRate(browser.transcript, google.transcript),
      wer: calculateWER(browser.transcript, google.transcript),
      timestamp: Date.now(),
    };

    const log = readLog(config.storageKey);
    log.push(entry);
    writeLog(config.storageKey, log);

    console.log("[STT A/B]", entry);

    return entry;
  };

  const getStats = (): STTComparisonStats =>
    getComparisonStats(config.storageKey);

  const clearLog = () => {
    writeLog(config.storageKey, []);
  };

  return {
    enrolled,
    recordComparison,
    getStats,
    clearLog,
  };
}

function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
