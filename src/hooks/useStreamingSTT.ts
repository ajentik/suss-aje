"use client";

import { useState, useCallback, useRef } from "react";

interface TranscriptEvent {
  transcript: string;
  isFinal: boolean;
  stability: number;
}

export interface StreamingSTTState {
  isStreaming: boolean;
  interimText: string;
  finalText: string;
  start: () => void;
  stop: () => void;
  error: string | null;
}

const PREFERRED_MIME = "audio/webm;codecs=opus";

export function useStreamingSTT(): StreamingSTTState {
  const [isStreaming, setIsStreaming] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((t) => {
      t.stop();
    });
    abortControllerRef.current?.abort();

    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    abortControllerRef.current = null;

    setIsStreaming(false);
  }, []);

  const start = useCallback(() => {
    setInterimText("");
    setFinalText("");
    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("Microphone access is not available in this browser.");
      return;
    }

    setIsStreaming(true);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        mediaStreamRef.current = mediaStream;

        const mimeType = MediaRecorder.isTypeSupported(PREFERRED_MIME)
          ? PREFERRED_MIME
          : "";
        const recorder = new MediaRecorder(
          mediaStream,
          mimeType ? { mimeType } : undefined,
        );
        mediaRecorderRef.current = recorder;

        const chunks: Blob[] = [];

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(chunks, {
            type: mimeType || "audio/webm",
          });
          sendAudioToSTT(audioBlob);
        };

        recorder.start();
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to access microphone.";
        setError(message);
        setIsStreaming(false);
      });

    async function sendAudioToSTT(blob: Blob) {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/speech/stream", {
          method: "POST",
          body: blob,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          const errorMsg =
            (errorBody as { error?: string } | null)?.error ??
            `Server error: ${response.status}`;
          setError(errorMsg);
          setIsStreaming(false);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setError("No response stream available.");
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let currentEvent = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ") && currentEvent) {
              const data = line.slice(6);
              handleSSEEvent(currentEvent, data);
              currentEvent = "";
            }
          }
        }
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          const message =
            err instanceof Error
              ? err.message
              : "Speech recognition failed.";
          setError(message);
        }
      } finally {
        setIsStreaming(false);
      }
    }

    function handleSSEEvent(event: string, data: string) {
      if (event === "transcript") {
        try {
          const parsed = JSON.parse(data) as TranscriptEvent;
          if (parsed.isFinal) {
            setFinalText((prev) =>
              prev ? `${prev} ${parsed.transcript}` : parsed.transcript,
            );
            setInterimText("");
          } else {
            setInterimText(parsed.transcript);
          }
        } catch {
          /* malformed SSE data */
        }
      } else if (event === "error") {
        try {
          const parsed = JSON.parse(data) as { error: string };
          setError(parsed.error);
        } catch {
          setError("Speech recognition error.");
        }
      }
    }
  }, []);

  return { isStreaming, interimText, finalText, start, stop, error };
}
