"use client";

import { useCallback } from "react";
import type { FeedbackEntry } from "@/types";

const STORAGE_KEY = "transcription-feedback";

function readEntries(): FeedbackEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FeedbackEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: FeedbackEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useTranscriptionFeedback() {
  const submitFeedback = useCallback(
    (original: string, corrected: string | null, provider = "web-speech"): void => {
      const entry: FeedbackEntry = {
        original,
        corrected,
        timestamp: Date.now(),
        provider,
      };
      const entries = readEntries();
      entries.push(entry);
      writeEntries(entries);
    },
    [],
  );

  const getFeedbackHistory = useCallback((): FeedbackEntry[] => {
    return readEntries();
  }, []);

  const getMisrecognizedPhrases = useCallback((): string[] => {
    const entries = readEntries();
    const corrected = entries
      .filter((e): e is FeedbackEntry & { corrected: string } => e.corrected !== null)
      .map((e) => e.corrected);
    return [...new Set(corrected)];
  }, []);

  const clearFeedback = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { submitFeedback, getFeedbackHistory, getMisrecognizedPhrases, clearFeedback };
}
