"use client";

import { useState, useCallback, useRef } from "react";
import type { POI } from "@/types";

export interface NavChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  place?: NavChatPlace;
  timestamp: Date;
}

export interface NavChatPlace {
  placeId: string;
  name: string;
  distance?: string;
  poi?: POI;
}

interface GeminiNavigationResponse {
  reply: string;
  placeId?: string;
  placeName?: string;
  placeDistance?: string;
}

const MAX_HISTORY = 10;
const API_ENDPOINT = "/api/gemini-navigation";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useNavigationChat() {
  const [conversationHistory, setConversationHistory] = useState<NavChatMessage[]>([]);
  const [response, setResponse] = useState<string | null>(null);
  const [places, setPlaces] = useState<NavChatPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const clearHistory = useCallback(() => {
    abortRef.current?.abort();
    setConversationHistory([]);
    setResponse(null);
    setPlaces([]);
    setIsLoading(false);
  }, []);

  const sendQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: NavChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setConversationHistory((prev: NavChatMessage[]) => {
        const next = [...prev, userMessage];
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      });

      setIsLoading(true);
      setResponse(null);

      try {
        const historyForApi = [...conversationHistory, userMessage].slice(-MAX_HISTORY).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyForApi }),
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 404) {
            const fallback =
              "Navigation AI is not available yet. Please use the main chat to ask for directions.";
            const assistantMessage: NavChatMessage = {
              id: generateId(),
              role: "assistant",
              content: fallback,
              timestamp: new Date(),
            };
            setResponse(fallback);
            setConversationHistory((prev: NavChatMessage[]) => {
              const next = [...prev, assistantMessage];
              return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
            });
            return;
          }
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data: GeminiNavigationResponse = await res.json();

        let place: NavChatPlace | undefined;
        if (data.placeId && data.placeName) {
          place = {
            placeId: data.placeId,
            name: data.placeName,
            distance: data.placeDistance,
          };
          setPlaces((prev: NavChatPlace[]) => {
            const existing = prev.find((p: NavChatPlace) => p.placeId === place!.placeId);
            if (existing) return prev;
            return [...prev, place!];
          });
        }

        const assistantMessage: NavChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.reply,
          place,
          timestamp: new Date(),
        };

        setResponse(data.reply);
        setConversationHistory((prev: NavChatMessage[]) => {
          const next = [...prev, assistantMessage];
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
        });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        const errorMsg = "Sorry, I couldn\u2019t process your navigation query. Please try again.";
        const errorMessage: NavChatMessage = {
          id: generateId(),
          role: "assistant",
          content: errorMsg,
          timestamp: new Date(),
        };

        setResponse(errorMsg);
        setConversationHistory((prev: NavChatMessage[]) => {
          const next = [...prev, errorMessage];
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [conversationHistory],
  );

  return {
    sendQuery,
    response,
    places,
    isLoading,
    conversationHistory,
    clearHistory,
  };
}
