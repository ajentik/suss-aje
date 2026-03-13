"use client";

import { useState, type FormEvent } from "react";
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
        placeholder="Ask about campus..."
        className="flex-1"
        disabled={isLoading}
      />
      <Button type="submit" size="sm" disabled={isLoading || !value.trim()} className="bg-[#003B5C] hover:bg-[#003B5C]/90 text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      </Button>
    </form>
  );
}
