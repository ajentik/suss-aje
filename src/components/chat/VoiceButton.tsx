"use client";

import { toast } from "sonner";
import { useSpeechRecognition } from "@/lib/voice/speech-recognition";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
}

export default function VoiceButton({ onTranscript }: VoiceButtonProps) {
  const { isListening, startListening, stopListening } = useSpeechRecognition();

  const handleClick = () => {
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
        "flex items-center justify-center w-10 h-10 rounded-full transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isListening
          ? "bg-surface-danger text-surface-danger-foreground animate-pulse"
          : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
      )}
      title={isListening ? "Stop recording" : "Start voice input"}
      aria-label={isListening ? "Stop recording" : "Start voice input"}
    >
      <Mic size={18} />
    </button>
  );
}
