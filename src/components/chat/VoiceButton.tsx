"use client";

import { toast } from "sonner";
import { useSpeechRecognition } from "@/lib/voice/speech-recognition";
import { DooIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
}

export default function VoiceButton({ onTranscript }: VoiceButtonProps) {
  const { isListening, startListening, stopListening } = useSpeechRecognition();

  const handleClick = () => {
    navigator.vibrate?.(10);
    if (isListening) {
      stopListening();
    } else {
      startListening(onTranscript, (msg) => toast.error(msg));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center w-11 h-11 rounded-full shrink-0",
        "transition-all duration-250 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isListening
          ? "bg-surface-danger text-surface-danger-foreground shadow-[0_0_0_4px_oklch(0.55_0.22_27/0.15)] animate-pulse"
          : "bg-secondary/70 hover:bg-secondary text-muted-foreground active:scale-90"
      )}
      title={isListening ? "Stop recording" : "Start voice input"}
      aria-label={isListening ? "Stop recording" : "Start voice input"}
    >
      <DooIcon name="mic" size={18} />
    </button>
  );
}
