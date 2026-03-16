"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface QuickAction {
  emoji: string;
  label: string;
  message: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { emoji: "❤️", label: "Nearest AAC", message: "Where is the nearest Active Ageing Centre?" },
  { emoji: "📅", label: "Activities Today", message: "What activities are happening today?" },
  { emoji: "🍜", label: "Where to Eat", message: "Where can I eat nearby?" },
  { emoji: "🏃", label: "Exercise Classes", message: "What exercise classes are available at AACs?" },
  { emoji: "🚌", label: "How to Get There", message: "How do I get to the nearest AAC?" },
  { emoji: "📞", label: "AIC Helpline", message: "What is the AIC hotline number?" },
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
    <div className="relative">
      <div
        ref={scrollRef}
        role="listbox"
        aria-label="Quick action suggestions"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none",
          "scroll-fade-edges"
        )}
      >
        {QUICK_ACTIONS.map((action, i) => (
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
              "inline-flex items-center gap-2 whitespace-nowrap rounded-full",
              "bg-secondary/80 backdrop-blur-sm px-4 py-2.5",
              "text-sm font-medium text-foreground",
              "border border-border/30",
              "hover:bg-primary hover:text-primary-foreground hover:border-primary/30",
              "active:scale-[0.96]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-all duration-200 shrink-0",
              "disabled:opacity-40 disabled:pointer-events-none",
              "min-h-[44px]",
              "animate-chip-enter",
              "shadow-[0_1px_2px_oklch(0_0_0/0.04)]"
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span aria-hidden="true" className="text-base">{action.emoji}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
