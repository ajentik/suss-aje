import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  tokenize,
  calculateWER,
  calculateMatchRate,
  isSessionEnrolled,
  getComparisonStats,
  useSTTComparison,
} from "@/hooks/useSTTComparison";
import type { STTComparisonEntry } from "@/hooks/useSTTComparison";

const TEST_STORAGE_KEY = "stt-comparison-test";

function seedEntries(entries: STTComparisonEntry[]): void {
  localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(entries));
}

function makeEntry(overrides: Partial<STTComparisonEntry> = {}): STTComparisonEntry {
  return {
    sessionId: "sess-1",
    utteranceId: "sess-1-1",
    browserTranscript: "hello world",
    googleTranscript: "hello world",
    browserConfidence: 0.9,
    googleConfidence: 0.85,
    matchRate: 1,
    wer: 0,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("tokenize", () => {
  it("lowercases and splits on whitespace", () => {
    expect(tokenize("Hello World")).toEqual(["hello", "world"]);
  });

  it("strips punctuation", () => {
    expect(tokenize("It's a test, right?")).toEqual(["its", "a", "test", "right"]);
  });

  it("returns empty array for empty string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("handles multiple spaces", () => {
    expect(tokenize("  spaced   out  ")).toEqual(["spaced", "out"]);
  });
});

describe("calculateWER", () => {
  it("returns 0 for identical strings", () => {
    expect(calculateWER("hello world", "hello world")).toBe(0);
  });

  it("returns 0 when both are empty", () => {
    expect(calculateWER("", "")).toBe(0);
  });

  it("returns 1 when reference is empty but hypothesis is not", () => {
    expect(calculateWER("some words", "")).toBe(1);
  });

  it("calculates correct WER for substitutions", () => {
    // "hello world" vs "hello earth" → 1 substitution / 2 ref words = 0.5
    expect(calculateWER("hello earth", "hello world")).toBe(0.5);
  });

  it("calculates correct WER for insertions", () => {
    // hyp="the big cat" vs ref="the cat" → 1 insertion / 2 ref = 0.5
    expect(calculateWER("the big cat", "the cat")).toBe(0.5);
  });

  it("calculates correct WER for deletions", () => {
    // hyp="the" vs ref="the cat" → 1 deletion / 2 ref = 0.5
    expect(calculateWER("the", "the cat")).toBe(0.5);
  });

  it("caps WER at 1", () => {
    expect(calculateWER("a b c d e f g h", "x")).toBeLessThanOrEqual(1);
  });

  it("is case-insensitive", () => {
    expect(calculateWER("HELLO WORLD", "hello world")).toBe(0);
  });
});

describe("calculateMatchRate", () => {
  it("returns 1 for identical strings", () => {
    expect(calculateMatchRate("hello world", "hello world")).toBe(1);
  });

  it("returns 1 for both empty", () => {
    expect(calculateMatchRate("", "")).toBe(1);
  });

  it("returns 0 when one is empty", () => {
    expect(calculateMatchRate("hello", "")).toBe(0);
    expect(calculateMatchRate("", "hello")).toBe(0);
  });

  it("returns partial match for overlapping words", () => {
    // "hello world" vs "hello earth" → 1 match / max(2, 2) = 0.5
    expect(calculateMatchRate("hello world", "hello earth")).toBe(0.5);
  });

  it("returns 0 for completely different strings", () => {
    expect(calculateMatchRate("foo bar", "baz qux")).toBe(0);
  });
});

describe("isSessionEnrolled", () => {
  beforeEach(() => {
    sessionStorage.removeItem("stt-comparison-enrolled");
  });

  it("returns true when random < samplingRate and caches result", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    expect(isSessionEnrolled(10)).toBe(true);
    expect(sessionStorage.getItem("stt-comparison-enrolled")).toBe("1");
    vi.restoreAllMocks();
  });

  it("returns false when random >= samplingRate and caches result", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(isSessionEnrolled(10)).toBe(false);
    expect(sessionStorage.getItem("stt-comparison-enrolled")).toBe("0");
    vi.restoreAllMocks();
  });

  it("uses cached value on subsequent calls", () => {
    sessionStorage.setItem("stt-comparison-enrolled", "1");
    const randomSpy = vi.spyOn(Math, "random");
    expect(isSessionEnrolled(0)).toBe(true);
    expect(randomSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("enrolls at 100% rate", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(isSessionEnrolled(100)).toBe(true);
    vi.restoreAllMocks();
  });

  it("never enrolls at 0% rate", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(isSessionEnrolled(0)).toBe(false);
    vi.restoreAllMocks();
  });
});

describe("getComparisonStats", () => {
  it("returns zeroed stats when no entries exist", () => {
    const stats = getComparisonStats(TEST_STORAGE_KEY);
    expect(stats.totalComparisons).toBe(0);
    expect(stats.averageMatchRate).toBe(0);
    expect(stats.averageWER).toBe(0);
  });

  it("calculates correct averages", () => {
    seedEntries([
      makeEntry({ browserConfidence: 0.9, googleConfidence: 0.8, matchRate: 1, wer: 0 }),
      makeEntry({ browserConfidence: 0.7, googleConfidence: 0.9, matchRate: 0.5, wer: 0.5 }),
    ]);

    const stats = getComparisonStats(TEST_STORAGE_KEY);
    expect(stats.totalComparisons).toBe(2);
    expect(stats.averageMatchRate).toBe(0.75);
    expect(stats.averageWER).toBe(0.25);
    expect(stats.averageBrowserConfidence).toBe(0.8);
    expect(stats.averageGoogleConfidence).toBeCloseTo(0.85);
  });

  it("counts wins correctly", () => {
    seedEntries([
      makeEntry({ browserConfidence: 0.9, googleConfidence: 0.8 }),
      makeEntry({ browserConfidence: 0.7, googleConfidence: 0.9 }),
      makeEntry({ browserConfidence: 0.8, googleConfidence: 0.8 }),
    ]);

    const stats = getComparisonStats(TEST_STORAGE_KEY);
    expect(stats.browserWinsCount).toBe(1);
    expect(stats.googleWinsCount).toBe(1);
    expect(stats.tiesCount).toBe(1);
  });
});

describe("useSTTComparison", () => {
  beforeEach(() => {
    sessionStorage.removeItem("stt-comparison-enrolled");
    localStorage.removeItem(TEST_STORAGE_KEY);
  });

  it("returns enrolled=true when session is enrolled", () => {
    sessionStorage.setItem("stt-comparison-enrolled", "1");
    const { result } = renderHook(() =>
      useSTTComparison({ storageKey: TEST_STORAGE_KEY, samplingRate: 100 })
    );
    expect(result.current.enrolled).toBe(true);
  });

  it("returns enrolled=false when session is not enrolled", () => {
    sessionStorage.setItem("stt-comparison-enrolled", "0");
    const { result } = renderHook(() =>
      useSTTComparison({ storageKey: TEST_STORAGE_KEY, samplingRate: 0 })
    );
    expect(result.current.enrolled).toBe(false);
  });

  it("recordComparison returns null when not enrolled", () => {
    sessionStorage.setItem("stt-comparison-enrolled", "0");
    const { result } = renderHook(() =>
      useSTTComparison({ storageKey: TEST_STORAGE_KEY })
    );

    let entry: STTComparisonEntry | null = null;
    act(() => {
      entry = result.current.recordComparison(
        { transcript: "hello", confidence: 0.9 },
        { transcript: "hello", confidence: 0.85 }
      );
    });

    expect(entry).toBeNull();
  });

  it("recordComparison persists entry and returns it when enrolled", () => {
    sessionStorage.setItem("stt-comparison-enrolled", "1");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useSTTComparison({ storageKey: TEST_STORAGE_KEY, samplingRate: 100 })
    );

    let entry: STTComparisonEntry | null = null;
    act(() => {
      entry = result.current.recordComparison(
        { transcript: "where is the library", confidence: 0.92 },
        { transcript: "where is the library", confidence: 0.88 }
      );
    });

    expect(entry).not.toBeNull();
    expect(entry!.browserTranscript).toBe("where is the library");
    expect(entry!.googleTranscript).toBe("where is the library");
    expect(entry!.browserConfidence).toBe(0.92);
    expect(entry!.googleConfidence).toBe(0.88);
    expect(entry!.matchRate).toBe(1);
    expect(entry!.wer).toBe(0);
    expect(entry!.sessionId).toBeTruthy();
    expect(entry!.utteranceId).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem(TEST_STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);

    expect(consoleSpy).toHaveBeenCalledWith("[STT A/B]", expect.objectContaining({ browserTranscript: "where is the library" }));
    consoleSpy.mockRestore();
  });

  it("recordComparison calculates WER for different transcripts", () => {
    sessionStorage.setItem("stt-comparison-enrolled", "1");
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useSTTComparison({ storageKey: TEST_STORAGE_KEY, samplingRate: 100 })
    );

    let entry: STTComparisonEntry | null = null;
    act(() => {
      entry = result.current.recordComparison(
        { transcript: "hello world", confidence: 0.9 },
        { transcript: "hello earth", confidence: 0.8 }
      );
    });

    expect(entry!.wer).toBe(0.5);
    expect(entry!.matchRate).toBe(0.5);

    vi.restoreAllMocks();
  });

  it("increments utteranceId across multiple recordings", () => {
    sessionStorage.setItem("stt-comparison-enrolled", "1");
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useSTTComparison({ storageKey: TEST_STORAGE_KEY, samplingRate: 100 })
    );

    const entries: (STTComparisonEntry | null)[] = [];
    act(() => {
      entries.push(
        result.current.recordComparison(
          { transcript: "first", confidence: 0.9 },
          { transcript: "first", confidence: 0.8 }
        )
      );
      entries.push(
        result.current.recordComparison(
          { transcript: "second", confidence: 0.9 },
          { transcript: "second", confidence: 0.8 }
        )
      );
    });

    expect(entries[0]!.utteranceId).toContain("-1");
    expect(entries[1]!.utteranceId).toContain("-2");

    vi.restoreAllMocks();
  });

  it("getStats returns stats from stored entries", () => {
    sessionStorage.setItem("stt-comparison-enrolled", "1");

    seedEntries([
      makeEntry({ matchRate: 0.8, wer: 0.2 }),
      makeEntry({ matchRate: 0.6, wer: 0.4 }),
    ]);

    const { result } = renderHook(() =>
      useSTTComparison({ storageKey: TEST_STORAGE_KEY, samplingRate: 100 })
    );

    let stats: ReturnType<typeof result.current.getStats>;
    act(() => {
      stats = result.current.getStats();
    });

    expect(stats!.totalComparisons).toBe(2);
    expect(stats!.averageMatchRate).toBe(0.7);
    expect(stats!.averageWER).toBeCloseTo(0.3);
  });

  it("clearLog removes all stored entries", () => {
    sessionStorage.setItem("stt-comparison-enrolled", "1");
    seedEntries([makeEntry()]);

    const { result } = renderHook(() =>
      useSTTComparison({ storageKey: TEST_STORAGE_KEY, samplingRate: 100 })
    );

    act(() => {
      result.current.clearLog();
    });

    const stored = localStorage.getItem(TEST_STORAGE_KEY);
    expect(JSON.parse(stored ?? "[]")).toHaveLength(0);
  });
});
