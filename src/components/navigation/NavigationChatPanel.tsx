"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Navigation,
  Mic,
  ArrowUp,
  ChevronDown,
  MapPin,
  X,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationChat, type NavChatMessage } from "@/hooks/useNavigationChat";
import { useWalkingRoute } from "@/hooks/useWalkingRoute";
import { findPOI } from "@/lib/maps/campus-pois";
import { useSpeechRecognition } from "@/lib/voice/speech-recognition";
import { toast } from "sonner";
import type { POI } from "@/types";

function PlaceCard({
  name,
  distance,
  onNavigate,
}: {
  name: string;
  distance?: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 p-3 mt-2 animate-chat-scale-in">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0">
        <MapPin className="w-[18px] h-[18px] text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug truncate">{name}</p>
        {distance && (
          <p className="text-xs text-muted-foreground">{distance}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-full text-xs font-medium",
          "bg-surface-brand text-surface-brand-foreground",
          "hover:bg-surface-brand-hover active:scale-95 transition-all duration-200"
        )}
      >
        <Navigation className="w-3.5 h-3.5" />
        Navigate
      </button>
    </div>
  );
}

function MessageBubble({ message, onNavigate }: { message: NavChatMessage; onNavigate: (poi: POI) => void }) {
  const isUser = message.role === "user";

  const handleNavigatePlace = useCallback(() => {
    if (!message.place) return;
    const poi = findPOI(message.place.name);
    if (poi) {
      onNavigate(poi);
    } else {
      toast.error(`Could not find "${message.place.name}" on the map.`);
    }
  }, [message.place, onNavigate]);

  return (
    <div
      className={cn(
        "flex w-full mb-3 animate-chat-slide-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex flex-col", isUser ? "max-w-[82%]" : "max-w-[88%]")}>
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? [
                  "bg-surface-brand text-surface-brand-foreground",
                  "rounded-[20px] rounded-br-[6px]",
                  "shadow-[0_1px_3px_oklch(0_0_0/0.08)]",
                ]
              : [
                  "bg-secondary text-foreground",
                  "rounded-[20px] rounded-bl-[6px]",
                ]
          )}
        >
          {message.content}
        </div>
        {message.place && (
          <PlaceCard
            name={message.place.name}
            distance={message.place.distance}
            onNavigate={handleNavigatePlace}
          />
        )}
      </div>
    </div>
  );
}

export default function NavigationChatPanel() {
  const {
    sendQuery,
    isLoading,
    conversationHistory,
    clearHistory,
  } = useNavigationChat();

  const { walkTo } = useWalkingRoute();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { isListening, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    sendQuery(trimmed);
    setInputValue("");
  }, [inputValue, isLoading, sendQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening(
        (transcript: string) => sendQuery(transcript),
        (msg: string) => toast.error(msg),
      );
    }
  }, [isListening, startListening, stopListening, sendQuery]);

  const handleNavigate = useCallback(
    (poi: POI) => {
      walkTo(poi);
      setIsOpen(false);
    },
    [walkTo],
  );

  const handleClear = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  const canSend = inputValue.trim().length > 0 && !isLoading;

  return (
    <div className="fixed bottom-20 right-3 z-20 md:bottom-4 md:right-4">
      {isOpen && (
        <aside
          aria-label="Navigation chat"
          className={cn(
            "mb-3 w-[calc(100vw-24px)] max-w-sm",
            "bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl shadow-xl",
            "flex flex-col overflow-hidden",
            "animate-chat-scale-in",
            "max-h-[min(480px,70dvh)]"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                <Navigation className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold">Navigation</span>
            </div>
            <div className="flex items-center gap-1">
              {conversationHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/60 active:scale-90 transition-all duration-200"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <Trash2 size={14} className="text-muted-foreground" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/60 active:scale-90 transition-all duration-200"
                title="Close"
                aria-label="Close navigation chat"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 min-h-0"
          >
            {conversationHistory.length === 0 && (
              <div className="text-center py-8 px-4 animate-chat-fade-in">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3">
                  <Navigation className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm">
                  Where do you need to go?
                </p>
                <p className="mt-1 text-muted-foreground text-xs leading-relaxed max-w-[200px] mx-auto">
                  Ask about nearby AACs, polyclinics, food, or places to visit.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {[
                    "Nearest polyclinic?",
                    "Where can I eat?",
                    "Find the library",
                  ].map((q, i) => (
                    <button
                      type="button"
                      key={q}
                      onClick={() => sendQuery(q)}
                      className="text-xs px-3 py-2 min-h-[36px] rounded-full border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all duration-200 font-medium animate-chip-enter"
                      style={{ animationDelay: `${200 + i * 80}ms` }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {conversationHistory.map((msg: NavChatMessage) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onNavigate={handleNavigate}
              />
            ))}

            {isLoading && (
              <div className="flex justify-start mb-3 animate-chat-fade-in">
                <div className="bg-secondary rounded-[20px] rounded-bl-[6px] px-4 py-3">
                  <span className="inline-flex items-center gap-2.5">
                    <span className="inline-flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary/70 animate-typing-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </span>
                    <span className="text-xs text-muted-foreground/80 font-medium">
                      Finding places...
                    </span>
                  </span>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div
            className={cn(
              "flex items-center gap-2 px-3 pt-2 pb-3 pb-safe",
              "border-t border-border/60 bg-background/90 backdrop-blur-lg shrink-0"
            )}
          >
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full shrink-0",
                "transition-all duration-250 ease-out",
                isListening
                  ? "bg-surface-danger text-surface-danger-foreground shadow-[0_0_0_4px_oklch(0.55_0.22_27/0.15)] animate-pulse"
                  : "bg-secondary/70 hover:bg-secondary text-muted-foreground active:scale-90"
              )}
              title={isListening ? "Stop recording" : "Voice input"}
              aria-label={isListening ? "Stop recording" : "Voice input"}
            >
              <Mic size={16} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a place..."
              disabled={isLoading}
              className={cn(
                "flex-1 min-w-0 rounded-full border bg-secondary/40 px-4 py-2.5",
                "text-sm leading-snug placeholder:text-muted-foreground/50",
                "focus:outline-none focus:bg-background focus:border-primary/30",
                "transition-all duration-300 ease-out",
                "min-h-[40px]",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Navigation query"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full shrink-0",
                "transition-all duration-250 ease-out",
                canSend
                  ? "bg-surface-brand text-surface-brand-foreground shadow-sm active:scale-90"
                  : "bg-muted/60 text-muted-foreground/40"
              )}
              aria-label="Send navigation query"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </aside>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full ml-auto",
          "bg-surface-brand text-surface-brand-foreground shadow-lg",
          "hover:bg-surface-brand-hover active:scale-90",
          "transition-all duration-250 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        title={isOpen ? "Close navigation chat" : "Open navigation chat"}
        aria-label={isOpen ? "Close navigation chat" : "Open navigation chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown size={24} />
        ) : (
          <MessageSquare size={24} />
        )}
      </button>
    </div>
  );
}
