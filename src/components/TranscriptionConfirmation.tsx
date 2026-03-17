"use client";

import { useEffect, useRef, useState } from "react";
import { DooIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { QualityResult } from "@/utils/transcriptionQuality";

const AUTO_DISMISS_MS = 5_000;

interface TranscriptionConfirmationProps {
  transcript: string;
  qualityResult: QualityResult;
  onConfirm: () => void;
  onRetry: () => void;
}

export default function TranscriptionConfirmation({
  transcript,
  qualityResult,
  onConfirm,
  onRetry,
}: TranscriptionConfirmationProps) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      onConfirm();
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onConfirm]);

  if (!visible || !qualityResult.shouldConfirm) {
    return null;
  }

  const handleConfirm = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setVisible(false);
    onConfirm();
  };

  const handleRetry = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setVisible(false);
    onRetry();
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        "border bg-card text-card-foreground shadow-sm",
        "animate-in fade-in slide-in-from-bottom-2 duration-200",
      )}
    >
      <p className="flex-1 min-w-0">
        {qualityResult.quality === "low" ? (
          <span>{qualityResult.suggestion}</span>
        ) : (
          <span>
            &ldquo;{transcript}&rdquo;{" "}
            <span className="text-muted-foreground">
              {qualityResult.suggestion}
            </span>
          </span>
        )}
      </p>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleConfirm}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "transition-colors",
          )}
          aria-label="Confirm transcription"
        >
          <DooIcon name="tick" size={14} />
          Correct
        </button>
        <button
          type="button"
          onClick={handleRetry}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            "transition-colors",
          )}
          aria-label="Try transcription again"
        >
          <DooIcon name="sync" size={14} />
          Try again
        </button>
      </div>
    </div>
  );
}
