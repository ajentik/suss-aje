"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import Image from "next/image";
import type { TextUIPart } from "ai";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useAppStore } from "@/store/app-store";
import { useSpeechSynthesis } from "@/lib/voice/speech-synthesis";
import { findPOI } from "@/lib/maps/campus-pois";
import type { DateRangePreset } from "@/types";

export default function ChatPanel() {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
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

  const { messages, sendMessage, status } = useChat({
    onToolCall: async ({ toolCall }) => {
      const { toolName } = toolCall;
      const args = ("args" in toolCall ? toolCall.args : {}) as Record<string, unknown>;

      if (toolName === "navigate_to") {
        const poi = findPOI(args.destination as string);
        if (poi) {
          setSelectedDestination(poi);
          setFlyToTarget({ lat: poi.lat, lng: poi.lng });

          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
          if (apiKey) {
            try {
              const { computeWalkingRoute } = await import("@/lib/maps/route-utils");
              const result = await computeWalkingRoute(
                { lat: 1.3299, lng: 103.7764 },
                { lat: poi.lat, lng: poi.lng },
                apiKey
              );
              if (result) {
                setRouteInfo({
                  polyline: result.polyline,
                  distanceMeters: result.distanceMeters,
                  duration: result.durationText,
                });
              }
            } catch {
            }
          }
        }
      }

      if (toolName === "show_events") {
        const { date, category, range } = args as {
          date?: string;
          category?: string;
          range?: DateRangePreset;
        };
        if (range) {
          setEventDateFilter(range);
        } else if (date) {
          setEventDateFilter("1d");
        }
        if (category) setEventCategoryFilter(category);
        setActivePanel("events");
      }
    },
    onFinish: ({ message }) => {
      if (ttsEnabled && message.role === "assistant") {
        const textContent = message.parts
          ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ");
        if (textContent) speak(textContent);
      }
    },
  });

  const isWaiting = status === "submitted";
  const isActive = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
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
  };

  const handleSend = (text: string) => {
    userScrolledUpRef.current = false;
    sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-full">
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
            <p className="font-bold text-foreground text-lg">Welcome to AskSUSSi</p>
            <p className="mt-1.5 text-muted-foreground text-sm">
              Your campus intelligent assistant. Ask me about directions, events,
              or campus services.
            </p>
            <section aria-label="Suggested questions" className="mt-6 flex flex-wrap justify-center gap-2.5">
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
          const textParts = (msg.parts ?? []).filter(
            (p): p is TextUIPart => p.type === "text"
          );
          if (textParts.length === 0) return null;
          const text = textParts.map((p) => p.text).join("");
          const isStreaming = textParts.some((p) => p.state === "streaming");
          return (
            <ChatMessage
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              content={text}
              isStreaming={isStreaming}
            />
          );
        })}
        <div ref={endRef} />
        {isWaiting && (
          <div className="flex justify-start mb-3">
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 text-base">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
                  ·
                </span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                  ·
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
      <ChatInput onSend={handleSend} isLoading={isActive} />
    </div>
  );
}
