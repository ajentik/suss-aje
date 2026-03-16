"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useGoogleSpeechToText } from "@/hooks/useGoogleSpeechToText";

export type SpeechProvider = "browser" | "google";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface UseSpeechRecognitionOptions {
  provider?: SpeechProvider;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
) {
  const { provider = "browser" } = options;

  const [browserListening, setBrowserListening] = useState(false);
  const [browserTranscript, setBrowserTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Google STT hook — always called (rules of hooks), only used when provider is "google"
  const google = useGoogleSpeechToText();

  const onResultRef = useRef<((text: string) => void) | null>(null);
  const onErrorRef = useRef<((message: string) => void) | null>(null);
  const prevGoogleTranscriptRef = useRef("");
  const prevGoogleErrorRef = useRef<string | null>(null);
  const fallbackTriggeredRef = useRef(false);

  const fallbackActive = provider === "google" && google.error !== null;

  const startBrowserListening = useCallback(
    (onResult: (text: string) => void, onError?: (message: string) => void) => {
      const recognition = createRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      recognition.lang = "en-SG";
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setBrowserTranscript(text);
        onResult(text);
      };

      recognition.onend = () => setBrowserListening(false);
      recognition.onerror = (event: { error: string }) => {
        setBrowserListening(false);
        const msg =
          event.error === "not-allowed"
            ? "Microphone access denied. Please allow microphone permissions."
            : event.error === "no-speech"
              ? "No speech detected. Please try again."
              : "Voice input failed. Please try again.";
        onError?.(msg);
      };

      setBrowserListening(true);
      recognition.start();
    },
    []
  );

  // Bridge Google STT results to the callback API via ref comparison
  useEffect(() => {
    if (provider !== "google") return;

    if (
      google.transcript &&
      google.transcript !== prevGoogleTranscriptRef.current &&
      onResultRef.current
    ) {
      prevGoogleTranscriptRef.current = google.transcript;
      onResultRef.current(google.transcript);
    }
  }, [provider, google.transcript]);

  // Auto-fallback: if Google errors, try browser
  useEffect(() => {
    if (provider !== "google") return;
    if (!google.error || google.error === prevGoogleErrorRef.current) return;
    if (fallbackTriggeredRef.current) return;

    prevGoogleErrorRef.current = google.error;
    fallbackTriggeredRef.current = true;
    const onResult = onResultRef.current;
    const onError = onErrorRef.current;

    if (onResult) {
      startBrowserListening(onResult, onError ?? undefined);
    } else {
      onError?.(google.error);
    }
  }, [provider, google.error, startBrowserListening]);

  const startListening = useCallback(
    (onResult: (text: string) => void, onError?: (message: string) => void) => {
      onResultRef.current = onResult;
      onErrorRef.current = onError ?? null;
      fallbackTriggeredRef.current = false;
      prevGoogleTranscriptRef.current = "";
      prevGoogleErrorRef.current = null;

      if (provider === "google") {
        void google.startRecording();
      } else {
        startBrowserListening(onResult, onError);
      }
    },
    [provider, google, startBrowserListening]
  );

  const stopListening = useCallback(() => {
    if (provider === "google" || fallbackActive) {
      google.stopRecording();
    }
    recognitionRef.current?.stop();
    setBrowserListening(false);
  }, [provider, google, fallbackActive]);

  const isListening =
    provider === "google"
      ? google.isRecording || (fallbackActive && browserListening)
      : browserListening;

  const transcript =
    provider === "google"
      ? google.transcript || browserTranscript
      : browserTranscript;

  return { isListening, transcript, startListening, stopListening };
}

function createRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === "undefined") return null;
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  return new SpeechRecognition();
}
