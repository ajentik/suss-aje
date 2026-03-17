"use client";

import { useState } from "react";
import { DooIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTranscriptionFeedback } from "@/hooks/useTranscriptionFeedback";

interface TranscriptionFeedbackProps {
  transcript: string;
  provider?: string;
  onDismiss: () => void;
}

export default function TranscriptionFeedback({
  transcript,
  provider = "web-speech",
  onDismiss,
}: TranscriptionFeedbackProps) {
  const [state, setState] = useState<"prompt" | "correction" | "done">("prompt");
  const [correction, setCorrection] = useState("");
  const { submitFeedback } = useTranscriptionFeedback();

  const handlePositive = () => {
    submitFeedback(transcript, null, provider);
    setState("done");
    setTimeout(onDismiss, 600);
  };

  const handleNegative = () => {
    setState("correction");
  };

  const handleSubmitCorrection = () => {
    const trimmed = correction.trim();
    if (!trimmed) return;
    submitFeedback(transcript, trimmed, provider);
    setState("done");
    setTimeout(onDismiss, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitCorrection();
    }
  };

  if (state === "done") {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground animate-in fade-in duration-200">
        <span aria-live="polite">Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 animate-in slide-in-from-bottom-2 duration-200">
      {state === "prompt" && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Was this transcription correct?
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePositive}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors",
                "hover:bg-emerald-500/10 hover:text-emerald-600",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label="Transcription correct"
              title="Correct"
            >
              <DooIcon name="tick" size={14} />
            </button>
            <button
              type="button"
              onClick={handleNegative}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors",
                "hover:bg-red-500/10 hover:text-red-600",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label="Transcription incorrect"
              title="Incorrect"
            >
              <DooIcon name="cross" size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-auto inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Dismiss feedback"
          >
            <DooIcon name="cross" size={14} />
          </button>
        </div>
      )}

      {state === "correction" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            What should it have been?
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type the correct transcription"
              className="h-7 flex-1 rounded-md border border-input bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="Correct transcription"
            />
            <button
              type="button"
              onClick={handleSubmitCorrection}
              disabled={!correction.trim()}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-1.5 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                correction.trim()
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground/50",
              )}
              aria-label="Submit correction"
              title="Submit"
              >
                <DooIcon name="send" size={14} />
              </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cancel correction"
              >
                <DooIcon name="cross" size={14} />
              </button>
          </div>
        </div>
      )}
    </div>
  );
}
