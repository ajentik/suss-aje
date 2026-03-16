"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { AlertCircle, RotateCcw, ChevronDown } from "lucide-react";
import type { TextUIPart, DynamicToolUIPart } from "ai";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import QuickActions from "./QuickActions";
import ToolResultCard from "./ToolResultCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useSpeechSynthesis } from "@/lib/voice/speech-synthesis";
import { useGeolocation } from "@/hooks/useGeolocation";
import { findPOI } from "@/lib/maps/campus-pois";
import type { DateRangePreset } from "@/types";

function isToolPart(p: { type: string }): p is DynamicToolUIPart {
  return p.type === "dynamic-tool" || p.type.startsWith("tool-");
}

function extractTextContent(parts: Array<{ type: string; [key: string]: unknown }>): {
  text: string;
  isStreaming: boolean;
} {
  const textParts = parts.filter(
    (p): p is TextUIPart => p.type === "text"
  );
  if (textParts.length === 0) return { text: "", isStreaming: false };
  return {
    text: textParts.map((p) => p.text).join(""),
    isStreaming: textParts.some((p) => p.state === "streaming"),
  };
}

function getActiveToolLabel(parts: Array<{ type: string; [key: string]: unknown }>): string | null {
  for (const p of parts) {
    if (!isToolPart(p)) continue;
    const tp = p as DynamicToolUIPart;
    if (tp.state === "input-streaming" || tp.state === "input-available") {
      if (tp.toolName === "navigate_to") return "Finding location...";
      if (tp.toolName === "show_events") return "Searching events...";
      if (tp.toolName === "campus_info") return "Looking up info...";
      return "Thinking...";
    }
  }
  return null;
}

function renderAssistantParts(
  parts: Array<{ type: string; [key: string]: unknown }>,
  messageId: string,
  timestamp?: Date
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let textAccumulator: TextUIPart[] = [];

  const flushText = () => {
    if (textAccumulator.length === 0) return;
    const text = textAccumulator.map((p) => p.text).join("");
    const isStreaming = textAccumulator.some((p) => p.state === "streaming");
    if (text) {
      nodes.push(
        <ChatMessage
          key={`${messageId}-text-${nodes.length}`}
          role={"assistant" as const}
          content={text}
          isStreaming={isStreaming}
          timestamp={timestamp}
        />
      );
    }
    textAccumulator = [];
  };

  for (const part of parts) {
    if (part.type === "text") {
      textAccumulator.push(part as TextUIPart);
      continue;
    }

    if (isToolPart(part)) {
      flushText();
      const tp = part as DynamicToolUIPart;
      const output = (tp.output ?? {}) as Record<string, unknown>;
      nodes.push(
        <div key={`${messageId}-tool-${tp.toolCallId}`} className="flex justify-start mb-3">
          <div className="max-w-[88%]">
            <ToolResultCard
              toolName={tp.toolName}
              output={output}
              state={tp.state}
            />
          </div>
        </div>
      );
    }
  }

  flushText();
  return nodes;
}

export default function ChatPanel() {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const processedToolsRef = useRef<Set<string>>(new Set());
  const messageTimestamps = useRef<Map<string, Date>>(new Map());
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setSelectedDestination = useAppStore((s) => s.setSelectedDestination);
  const setRouteInfo = useAppStore((s) => s.setRouteInfo);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const setEventDateFilter = useAppStore((s) => s.setEventDateFilter);
  const setEventCategoryFilter = useAppStore((s) => s.setEventCategoryFilter);
  const activePanel = useAppStore((s) => s.activePanel);
  const mapEventMarkers = useAppStore((s) => s.mapEventMarkers);
  const setHighlightedEventIds = useAppStore((s) => s.setHighlightedEventIds);
  const ttsEnabled = useAppStore((s) => s.ttsEnabled);
  const pendingChatMessage = useAppStore((s) => s.pendingChatMessage);
  const setPendingChatMessage = useAppStore((s) => s.setPendingChatMessage);
  const { speak } = useSpeechSynthesis();
  const { lat: geoLat, lng: geoLng, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const { messages, sendMessage, status, error } = useChat({
    onError: (err) => {
      console.error("[AskSUSSi chat error]", err);
    },
    onFinish: ({ message }) => {
      setLastFailedInput(null);
      if (ttsEnabled && message.role === "assistant") {
        const { text } = extractTextContent(message.parts ?? []);
        if (text) speak(text);
      }
    },
  });

  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const parts = msg.parts ?? [];
      for (const part of parts) {
        if (!isToolPart(part)) continue;
        const tp = part as DynamicToolUIPart;
        if (tp.state !== "output-available") continue;
        const key = tp.toolCallId;
        if (processedToolsRef.current.has(key)) continue;
        processedToolsRef.current.add(key);

        const output = tp.output as Record<string, unknown> | undefined;
        if (!output) continue;

        if (tp.toolName === "navigate_to" && output.success && output.poi) {
          const poi = output.poi as {
            lat: number;
            lng: number;
            name: string;
            id: string;
            address?: string;
            category: string;
            description: string;
          };
          const localPoi = findPOI(poi.name) ?? poi;
          setSelectedDestination(
            localPoi as ReturnType<typeof findPOI> & object
          );
          setFlyToTarget({ lat: poi.lat, lng: poi.lng });

          const origin = geoLat && geoLng
              ? { lat: geoLat, lng: geoLng }
              : { lat: 1.3299, lng: 103.7764 };
            import("@/lib/maps/route-utils")
              .then(({ computeWalkingRoute }) =>
                computeWalkingRoute(
                  origin,
                  { lat: poi.lat, lng: poi.lng },
                ).then((route) => {
                  if (route) {
                    setRouteInfo({
                      polyline: route.polyline,
                      distanceMeters: route.distanceMeters,
                      duration: route.durationText,
                    });
                  }
                })
              )
              .catch(() => toast.error("Could not compute walking route."));
        }

        if (tp.toolName === "show_events") {
          const input = tp.input as Record<string, unknown>;
          const range = input?.range as DateRangePreset | undefined;
          const date = input?.date as string | undefined;
          const category = input?.category as string | undefined;
          if (range) {
            setEventDateFilter(range);
          } else if (date) {
            setEventDateFilter("1d");
          }
          if (category) setEventCategoryFilter(category);
          setActivePanel("events");
          toast.info("Showing matching events.");
        }
      }
    }
  }, [
    messages,
    setFlyToTarget,
    setSelectedDestination,
    setRouteInfo,
    setActivePanel,
    setEventDateFilter,
    setEventCategoryFilter,
    geoLat,
    geoLng,
  ]);

  useEffect(() => {
    if (pendingChatMessage) {
      sendMessage({ text: pendingChatMessage });
      setPendingChatMessage(null);
    }
  }, [pendingChatMessage, sendMessage, setPendingChatMessage]);

  const isWaiting = status === "submitted";
  const isStreaming = status === "streaming";
  const isActive = isStreaming || isWaiting;

  // Get contextual label for tool-in-progress
  let thinkingLabel: string | null = null;
  if (isActive) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      const label = getActiveToolLabel(msg.parts ?? []);
      if (label) {
        thinkingLabel = label;
        break;
      }
    }
  }

  const hasToolInProgress = thinkingLabel !== null;

  useEffect(() => {
    for (const msg of messages) {
      if (!messageTimestamps.current.has(msg.id)) {
        messageTimestamps.current.set(msg.id, new Date());
      }
    }
  }, [messages]);

  useEffect(() => {
    if (userScrolledUpRef.current) {
      if (messages.length > 0) setHasNewMessages(true);
    } else {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewMessages(false);
    }
  }, [messages.length]);

  useEffect(() => {
    if (activePanel === "events" && mapEventMarkers.length > 0) {
      setHighlightedEventIds(mapEventMarkers.map((e) => e.id));
    } else {
      setHighlightedEventIds([]);
    }
  }, [activePanel, mapEventMarkers, setHighlightedEventIds]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    userScrolledUpRef.current = !atBottom;
    if (atBottom) setHasNewMessages(false);
  };

  const scrollToBottom = () => {
    userScrolledUpRef.current = false;
    setHasNewMessages(false);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = (text: string) => {
    setLastFailedInput(text);
    userScrolledUpRef.current = false;
    sendMessage({ text });
  };

  const handleRetry = () => {
    if (!lastFailedInput) return;
    handleSend(lastFailedInput);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full relative">
      <div
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        {isEmpty && (
          <div className="text-center py-10 px-4 animate-chat-fade-in">
            <Image
              src="/suss-logo.png"
              alt="SUSS — Singapore University of Social Sciences"
              width={160}
              height={56}
              className="mx-auto mb-5 h-16 w-auto animate-welcome-float"
              priority
            />
            <p className="font-bold text-foreground text-xl tracking-tight">
              Hi there!
            </p>
            <p className="mt-1 text-muted-foreground text-sm leading-relaxed max-w-[260px] mx-auto">
              I&apos;m your SUSS campus assistant. Ask me about directions, events, services, or anything campus-related.
            </p>
            <section
              aria-label="Suggested questions"
              className="mt-6 flex flex-wrap justify-center gap-2.5"
            >
              {[
                "Where is the library?",
                "What events are today?",
                "How to get to the canteen?",
              ].map((q, i) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-sm px-4 py-2.5 min-h-[44px] rounded-full border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all duration-200 font-medium animate-chip-enter"
                  style={{ animationDelay: `${200 + i * 80}ms` }}
                >
                  {q}
                </button>
              ))}
            </section>
          </div>
        )}

        {messages.map((msg) => {
          const ts = messageTimestamps.current.get(msg.id);
          if (msg.role === "user") {
            const { text } = extractTextContent(msg.parts ?? []);
            if (!text) return null;
            return (
              <ChatMessage
                key={msg.id}
                role={"user" as const}
                content={text}
                timestamp={ts}
              />
            );
          }

          const parts = msg.parts ?? [];
          const rendered = renderAssistantParts(parts, msg.id, ts);
          if (rendered.length === 0) return null;
          return <div key={msg.id}>{rendered}</div>;
        })}

        {error && (
          <div className="mx-2 mb-3 p-3.5 rounded-2xl bg-destructive/8 border border-destructive/15 text-sm animate-error-shake">
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg bg-destructive/10">
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-destructive">
                  Oops, something went wrong
                </p>
                <p className="mt-1 text-destructive/70 text-[0.8125rem] leading-relaxed">{error.message}</p>
              </div>
            </div>
            {lastFailedInput && (
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isActive}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}

        {(isWaiting || hasToolInProgress) && (
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
                {(thinkingLabel || isWaiting) && (
                  <span className="text-xs text-muted-foreground/80 font-medium">
                    {thinkingLabel ?? "Thinking..."}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {hasNewMessages && (
        <button
          type="button"
          onClick={scrollToBottom}
          className={cn(
            "absolute left-1/2 z-10 bg-primary text-primary-foreground text-xs font-medium",
            "px-3.5 py-2 min-h-[36px] rounded-full shadow-lg",
            "hover:bg-primary/90 active:scale-95",
            "transition-all duration-200 animate-scroll-bounce-in",
            "inline-flex items-center gap-1",
            isEmpty ? "bottom-28" : "bottom-20"
          )}
        >
          New messages
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {isEmpty && (
        <div className="border-t border-border/40">
          <QuickActions onSend={handleSend} disabled={isActive} />
        </div>
      )}
      <ChatInput onSend={handleSend} isLoading={isActive} />
    </div>
  );
}
