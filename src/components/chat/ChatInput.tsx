"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VoiceButton from "./VoiceButton";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  };

  const handleVoiceTranscript = (text: string) => {
    onSend(text);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t">
      <VoiceButton onTranscript={handleVoiceTranscript} />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Chat message"
        placeholder="Ask about campus..."
        className="flex-1"
        disabled={isLoading}
      />
      <Button aria-label="Send message" type="submit" size="sm" disabled={isLoading || !value.trim()} className="bg-surface-brand hover:bg-surface-brand-hover text-surface-brand-foreground">
        <Send size={18} />
      </Button>
    </form>
  );
}
