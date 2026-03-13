"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { AlertCircle, RotateCcw } from "lucide-react";
import type { TextUIPart, DynamicToolUIPart } from "ai";
import { toast } from "sonner";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ToolResultCard from "./ToolResultCard";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { useSpeechSynthesis } from "@/lib/voice/speech-synthesis";
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

function renderAssistantParts(
  parts: Array<{ type: string; [key: string]: unknown }>,
  messageId: string
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
          <div className="max-w-[85%]">
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
  const { speak } = useSpeechSynthesis();

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

          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
          if (apiKey) {
            import("@/lib/maps/route-utils")
              .then(({ computeWalkingRoute }) =>
                computeWalkingRoute(
                  { lat: 1.3299, lng: 103.7764 },
                  { lat: poi.lat, lng: poi.lng },
                  apiKey
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
  ]);

  const isWaiting = status === "submitted";
  const isStreaming = status === "streaming";
  const isActive = isStreaming || isWaiting;

  const hasToolInProgress = isActive && messages.some((msg) => {
    if (msg.role !== "assistant") return false;
    return (msg.parts ?? []).some((p) => {
      if (!isToolPart(p)) return false;
      const state = (p as DynamicToolUIPart).state;
      return state === "input-streaming" || state === "input-available";
    });
  });

  useEffect(() => {
    if (userScrolledUpRef.current) {
      if (messages.length > 0) setHasNewMessages(true);
    } else {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewMessages(false);
    }
  });

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
        {messages.length === 0 && (
          <div className="text-center py-10 px-4">
            <Image
              src="/suss-logo.png"
              alt="SUSS — Singapore University of Social Sciences"
              width={160}
              height={56}
              className="mx-auto mb-5 h-16 w-auto"
              priority
            />
            <p className="font-bold text-foreground text-lg">
              Welcome to AskSUSSi
            </p>
            <p className="mt-1.5 text-muted-foreground text-sm">
              Your campus intelligent assistant. Ask me about directions, events,
              or campus services.
            </p>
            <section
              aria-label="Suggested questions"
              className="mt-6 flex flex-wrap justify-center gap-2.5"
            >
              {[
                "Where is the library?",
                "What events are today?",
                "How to get to the canteen?",
              ].map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-sm px-4 py-2.5 rounded-full border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </section>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === "user") {
            const { text } = extractTextContent(msg.parts ?? []);
            if (!text) return null;
            return (
              <ChatMessage key={msg.id} role={"user" as const} content={text} />
            );
          }

          const parts = msg.parts ?? [];
          const rendered = renderAssistantParts(parts, msg.id);
          if (rendered.length === 0) return null;
          return <div key={msg.id}>{rendered}</div>;
        })}

        {error && (
          <div className="mx-2 mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-destructive">
                  Something went wrong
                </p>
                <p className="mt-1 text-destructive/80">{error.message}</p>
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

        <div ref={endRef} />

        {(isWaiting || hasToolInProgress) && (
          <div className="flex justify-start mb-3">
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 text-base">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">&middot;</span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  >
                    &middot;
                  </span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  >
                    &middot;
                  </span>
                </span>
                {hasToolInProgress && (
                  <span className="text-xs text-muted-foreground italic">
                    Thinking...
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {hasNewMessages && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          New messages &darr;
        </button>
      )}

      <ChatInput onSend={handleSend} isLoading={isActive} />
    </div>
  );
}
