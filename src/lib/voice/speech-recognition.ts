"use client";

import { useState, useCallback, useRef } from "react";

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

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);

  const startListening = useCallback(
    (onResult: (text: string) => void, onError?: (message: string) => void) => {
      const recognition = createRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      recognition.lang = "en-SG";
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        onResult(text);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: { error: string }) => {
        setIsListening(false);
        const msg =
          event.error === "not-allowed"
            ? "Microphone access denied. Please allow microphone permissions."
            : event.error === "no-speech"
              ? "No speech detected. Please try again."
              : "Voice input failed. Please try again.";
        onError?.(msg);
      };

      setIsListening(true);
      recognition.start();
    },
    []
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening };
}

function createRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === "undefined") return null;
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  return new SpeechRecognition();
}
