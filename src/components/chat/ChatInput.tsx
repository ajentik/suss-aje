"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceButton from "./VoiceButton";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const PLACEHOLDERS = [
  "Ask me anything about campus...",
  "Where is the library?",
  "What events are on today?",
  "How do I get to Block D?",
  "Find me somewhere to eat",
];

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholder text
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Auto-resize textarea
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0";
    // Min 48px (mobile touch target), max ~140px (about 5 lines)
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 48), 140)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const doSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "48px";
      }
    });
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    doSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const handleVoiceTranscript = (text: string) => {
    onSend(text);
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-end gap-2 px-3 pt-2 pb-3 pb-safe",
        "border-t border-border/60 bg-background/90 backdrop-blur-lg",
        "transition-colors duration-200"
      )}
    >
      <VoiceButton onTranscript={handleVoiceTranscript} />

      <div className="relative flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Chat message"
          placeholder={PLACEHOLDERS[placeholderIdx]}
          disabled={isLoading}
          rows={1}
          className={cn(
            "w-full resize-none rounded-[22px] border bg-secondary/50 px-4 py-3",
            "text-base leading-snug placeholder:text-muted-foreground/50",
            "focus:outline-none focus:bg-background",
            "transition-all duration-300 ease-out",
            "min-h-[48px] max-h-[140px]",
            "disabled:opacity-40",
            isFocused
              ? "border-primary/30 shadow-[0_0_0_3px_oklch(0.45_0.06_240/0.1)]"
              : "border-border/40"
          )}
        />
      </div>

      <button
        aria-label="Send message"
        type="submit"
        disabled={!canSend}
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded-full shrink-0",
          "transition-all duration-250 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          canSend
            ? "bg-surface-brand text-surface-brand-foreground shadow-sm active:scale-90"
            : "bg-muted/60 text-muted-foreground/40"
        )}
      >
        <ArrowUp
          size={20}
          strokeWidth={2.5}
          className={cn(
            "transition-all duration-250",
            canSend ? "opacity-100 translate-y-0" : "opacity-50 translate-y-0.5"
          )}
        />
      </button>
    </form>
  );
}
