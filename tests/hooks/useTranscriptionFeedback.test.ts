import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useTranscriptionFeedback } from "@/hooks/useTranscriptionFeedback";

describe("useTranscriptionFeedback", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty history initially", () => {
    const { result } = renderHook(() => useTranscriptionFeedback());
    expect(result.current.getFeedbackHistory()).toEqual([]);
  });

  it("stores positive feedback with null corrected", () => {
    const { result } = renderHook(() => useTranscriptionFeedback());

    act(() => {
      result.current.submitFeedback("hello world", null);
    });

    const history = result.current.getFeedbackHistory();
    expect(history).toHaveLength(1);
    expect(history[0].original).toBe("hello world");
    expect(history[0].corrected).toBeNull();
    expect(history[0].provider).toBe("web-speech");
    expect(history[0].timestamp).toBeGreaterThan(0);
  });

  it("stores negative feedback with correction", () => {
    const { result } = renderHook(() => useTranscriptionFeedback());

    act(() => {
      result.current.submitFeedback("can lah", "can la", "web-speech");
    });

    const history = result.current.getFeedbackHistory();
    expect(history).toHaveLength(1);
    expect(history[0].original).toBe("can lah");
    expect(history[0].corrected).toBe("can la");
  });

  it("stores custom provider", () => {
    const { result } = renderHook(() => useTranscriptionFeedback());

    act(() => {
      result.current.submitFeedback("test", null, "whisper");
    });

    const history = result.current.getFeedbackHistory();
    expect(history[0].provider).toBe("whisper");
  });

  it("accumulates multiple entries", () => {
    const { result } = renderHook(() => useTranscriptionFeedback());

    act(() => {
      result.current.submitFeedback("one", null);
      result.current.submitFeedback("two", "two correct");
      result.current.submitFeedback("three", null);
    });

    expect(result.current.getFeedbackHistory()).toHaveLength(3);
  });

  it("getMisrecognizedPhrases returns unique corrections", () => {
    const { result } = renderHook(() => useTranscriptionFeedback());

    act(() => {
      result.current.submitFeedback("can lah", "can la");
      result.current.submitFeedback("shiok man", "shiok man");
      result.current.submitFeedback("can lah again", "can la");
      result.current.submitFeedback("good one", null);
    });

    const phrases = result.current.getMisrecognizedPhrases();
    expect(phrases).toHaveLength(2);
    expect(phrases).toContain("can la");
    expect(phrases).toContain("shiok man");
  });

  it("clearFeedback removes all entries", () => {
    const { result } = renderHook(() => useTranscriptionFeedback());

    act(() => {
      result.current.submitFeedback("test", null);
      result.current.submitFeedback("test2", "corrected");
    });

    expect(result.current.getFeedbackHistory()).toHaveLength(2);

    act(() => {
      result.current.clearFeedback();
    });

    expect(result.current.getFeedbackHistory()).toEqual([]);
  });

  it("persists data in localStorage", () => {
    const { result } = renderHook(() => useTranscriptionFeedback());

    act(() => {
      result.current.submitFeedback("persisted", "corrected");
    });

    const stored = localStorage.getItem("transcription-feedback");
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].original).toBe("persisted");
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("transcription-feedback", "not-valid-json");

    const { result } = renderHook(() => useTranscriptionFeedback());
    expect(result.current.getFeedbackHistory()).toEqual([]);

    act(() => {
      result.current.submitFeedback("after corruption", null);
    });

    expect(result.current.getFeedbackHistory()).toHaveLength(1);
  });
});
