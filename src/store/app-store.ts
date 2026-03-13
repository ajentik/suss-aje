"use client";

import { create } from "zustand";
import type { POI, RouteInfo } from "@/types";

interface AppState {
  // Map
  selectedDestination: POI | null;
  setSelectedDestination: (poi: POI | null) => void;
  routeInfo: RouteInfo | null;
  setRouteInfo: (route: RouteInfo | null) => void;
  flyToTarget: { lat: number; lng: number; altitude?: number } | null;
  setFlyToTarget: (target: { lat: number; lng: number; altitude?: number } | null) => void;

  // Panels
  activePanel: "chat" | "events";
  setActivePanel: (panel: "chat" | "events") => void;

  // Events
  eventDateFilter: string;
  setEventDateFilter: (date: string) => void;
  eventCategoryFilter: string;
  setEventCategoryFilter: (category: string) => void;

  // Voice
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedDestination: null,
  setSelectedDestination: (poi) => set({ selectedDestination: poi }),
  routeInfo: null,
  setRouteInfo: (route) => set({ routeInfo: route }),
  flyToTarget: null,
  setFlyToTarget: (target) => set({ flyToTarget: target }),

  activePanel: "chat",
  setActivePanel: (panel) => set({ activePanel: panel }),

  eventDateFilter: "",
  setEventDateFilter: (date) => set({ eventDateFilter: date }),
  eventCategoryFilter: "",
  setEventCategoryFilter: (category) => set({ eventCategoryFilter: category }),

  isSpeaking: false,
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  ttsEnabled: false,
  setTtsEnabled: (enabled) => set({ ttsEnabled: enabled }),
}));
