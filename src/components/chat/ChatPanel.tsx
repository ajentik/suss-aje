"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useAppStore } from "@/store/app-store";
import { useSpeechSynthesis } from "@/lib/voice/speech-synthesis";
import { findPOI } from "@/lib/maps/campus-pois";

export default function ChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setSelectedDestination = useAppStore((s) => s.setSelectedDestination);
  const setRouteInfo = useAppStore((s) => s.setRouteInfo);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const setEventDateFilter = useAppStore((s) => s.setEventDateFilter);
  const setEventCategoryFilter = useAppStore((s) => s.setEventCategoryFilter);
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
              // Route computation failed silently
            }
          }
        }
      }

      if (toolName === "show_events") {
        const { date, category } = args as { date?: string; category?: string };
        if (date) setEventDateFilter(date);
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

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  // Extract text content from message parts
  const getMessageText = (msg: (typeof messages)[0]): string => {
    if (!msg.parts) return "";
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(" ");
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-sm py-8 px-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#003B5C] mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6V2H8" />
                <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
                <path d="M2 12h2" />
                <path d="M9 11v2" />
                <path d="M15 11v2" />
                <path d="M20 12h2" />
              </svg>
            </div>
            <p className="font-semibold text-foreground">Welcome to SUSS AJE</p>
            <p className="mt-1 text-muted-foreground">Your campus intelligent assistant. Ask me about directions, events, or campus services.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                "Where is the library?",
                "What events are today?",
                "How to get to the canteen?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs px-3.5 py-2 rounded-full border border-[#003B5C]/20 text-[#003B5C] hover:bg-[#003B5C] hover:text-white transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => {
          const text = getMessageText(msg);
          if (!text) return null;
          return (
            <ChatMessage key={msg.id} role={msg.role as "user" | "assistant"} content={text} />
          );
        })}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>·</span>
              </span>
            </div>
          </div>
        )}
      </ScrollArea>
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
