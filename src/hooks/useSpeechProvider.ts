"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";

export type SttProvider = "browser" | "google";

export interface SpeechProviderState {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  provider: SttProvider;
  startListening: () => void;
  stopListening: () => void;
}

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

interface GoogleSttResponse {
  transcript: string;
  confidence: number;
  error?: string;
}

const STORAGE_KEY = "asksussi-stt-provider";

function createBrowserRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

function readStoredProvider(): SttProvider | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "browser" || stored === "google") return stored;
  } catch {
    // localStorage unavailable in some environments (e.g. sandboxed iframes)
  }
  return null;
}

function detectLocaleProvider(): SttProvider {
  if (typeof window === "undefined") return "browser";
  const locale = navigator.language ?? "";
  if (locale.toLowerCase().includes("sg")) return "google";
  return "browser";
}

function persistProvider(provider: SttProvider): void {
  try {
    localStorage.setItem(STORAGE_KEY, provider);
  } catch {
    // localStorage unavailable in some environments (e.g. sandboxed iframes)
  }
}

export function useSpeechProvider(
  onResult?: (text: string) => void,
  accent?: string,
): SpeechProviderState {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [providerOverride, setProviderOverride] = useState<SttProvider | null>(null);

  const provider: SttProvider = useMemo(() => {
    if (providerOverride) return providerOverride;
    if (accent?.toLowerCase() === "singlish") return "google";
    const stored = readStoredProvider();
    if (stored) return stored;
    return detectLocaleProvider();
  }, [providerOverride, accent]);

  useEffect(() => {
    persistProvider(provider);
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const startBrowser = useCallback(() => {
    const recognition = createBrowserRecognition();
    if (!recognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    recognitionRef.current = recognition;
    recognition.lang = "en-SG";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0];
      const text = result.transcript;
      const conf =
        typeof (result as unknown as { confidence: number }).confidence ===
        "number"
          ? (result as unknown as { confidence: number }).confidence
          : 1;
      setTranscript(text);
      setConfidence(conf);
      setError(null);
      onResultRef.current?.(text);
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
      setError(msg);
    };

    setError(null);
    setIsListening(true);
    recognition.start();
  }, []);

  const stopBrowser = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const sendToGoogleApi = useCallback(
    (blob: Blob, doFallback: () => void) => {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      fetch("/api/speech", {
        method: "POST",
        body: formData,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<GoogleSttResponse>;
        })
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setTranscript(data.transcript);
          setConfidence(data.confidence);
          setError(null);
          setIsListening(false);
          onResultRef.current?.(data.transcript);
        })
        .catch(() => {
          setIsListening(false);
          doFallback();
        });
    },
    [],
  );

  const fallbackToBrowser = useCallback(() => {
    setError("Google STT failed — falling back to browser.");
    setProviderOverride("browser");
    startBrowser();
  }, [startBrowser]);

  const startGoogle = useCallback(() => {
    setError(null);
    setIsListening(true);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          for (const track of stream.getTracks()) {
            track.stop();
          }

          const audioBlob = new Blob(chunksRef.current, {
            type: "audio/webm",
          });
          sendToGoogleApi(audioBlob, fallbackToBrowser);
        };

        recorder.start();
      })
      .catch(() => {
        setIsListening(false);
        setError("Microphone access denied. Please allow microphone permissions.");
      });
  }, [sendToGoogleApi, fallbackToBrowser]);

  const stopGoogle = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    setTranscript("");
    setConfidence(0);
    setError(null);

    if (provider === "google") {
      startGoogle();
    } else {
      startBrowser();
    }
  }, [provider, startGoogle, startBrowser]);

  const stopListening = useCallback(() => {
    if (provider === "google") {
      stopGoogle();
    } else {
      stopBrowser();
    }
  }, [provider, stopGoogle, stopBrowser]);

  return {
    isListening,
    transcript,
    confidence,
    error,
    provider,
    startListening,
    stopListening,
  };
}
