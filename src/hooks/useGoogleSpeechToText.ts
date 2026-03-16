"use client";

import { useState, useCallback, useRef } from "react";

interface GoogleSTTResult {
  transcript: string;
  confidence: number;
}

interface UseGoogleSpeechToTextOptions {
  /** Max silence duration in ms before auto-stop (default: 30000) */
  silenceTimeout?: number;
}

interface UseGoogleSpeechToTextReturn {
  isRecording: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useGoogleSpeechToText(
  options: UseGoogleSpeechToTextOptions = {}
): UseGoogleSpeechToTextReturn {
  const { silenceTimeout = 30_000 } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const sendAudioToAPI = useCallback(async (audioBlob: Blob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Speech API error (${response.status})`);
      }

      const data = (await response.json()) as GoogleSTTResult;
      setTranscript(data.transcript);
      setConfidence(data.confidence);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to transcribe audio";
      setError(message);
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    setConfidence(0);
    chunksRef.current = [];

    // Request microphone access
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const denied =
        err instanceof DOMException && err.name === "NotAllowedError";
      setError(
        denied
          ? "Microphone access denied. Please allow microphone permissions."
          : "Could not access microphone. Please check your device settings."
      );
      return;
    }

    streamRef.current = stream;

    // Pick a supported MIME type — prefer webm/opus for speech
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, {
        type: mimeType || "audio/webm",
      });
      cleanup();
      void sendAudioToAPI(audioBlob);
    };

    recorder.onerror = () => {
      setError("Recording failed. Please try again.");
      setIsRecording(false);
      cleanup();
    };

    recorder.start();
    setIsRecording(true);

    // Auto-stop after silence timeout
    silenceTimerRef.current = setTimeout(() => {
      stopRecording();
    }, silenceTimeout);
  }, [silenceTimeout, cleanup, sendAudioToAPI, stopRecording]);

  return { isRecording, transcript, confidence, error, startRecording, stopRecording };
}
