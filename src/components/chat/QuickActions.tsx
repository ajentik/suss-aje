"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface QuickAction {
  emoji: string;
  label: string;
  message: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { emoji: "🗺️", label: "Campus Map", message: "Show me the campus map" },
  { emoji: "📅", label: "Events Today", message: "What events are happening today?" },
  { emoji: "🍔", label: "Where to Eat", message: "Where can I eat near campus?" },
  { emoji: "📚", label: "Library Hours", message: "What are the library hours?" },
  { emoji: "🚌", label: "Shuttle Schedule", message: "What is the shuttle bus schedule?" },
  { emoji: "🏥", label: "Nearest AAC", message: "Where is the nearest AAC (Academic Advisory Centre)?" },
];

interface QuickActionsProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function QuickActions({ onSend, disabled }: QuickActionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleChipClick = useCallback(
    (message: string) => {
      if (!disabled) onSend(message);
    },
    [onSend, disabled]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const container = scrollRef.current;
      if (!container) return;

      const chips = Array.from(
        container.querySelectorAll<HTMLButtonElement>("[role='option']")
      );
      const activeIndex = chips.findIndex((c) => c === document.activeElement);

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = chips[activeIndex + 1] ?? chips[0];
        next?.focus();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = chips[activeIndex - 1] ?? chips[chips.length - 1];
        prev?.focus();
      }
    },
    []
  );

  return (
    <div
      ref={scrollRef}
      role="listbox"
      aria-label="Quick action suggestions"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-none"
    >
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          role="option"
          aria-selected={false}
          aria-label={action.label}
          tabIndex={-1}
          onClick={() => handleChipClick(action.message)}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full",
            "border border-primary/20 bg-background px-3 py-1.5",
            "text-sm font-medium text-primary",
            "hover:bg-primary hover:text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "transition-colors shrink-0",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          <span aria-hidden="true">{action.emoji}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}
