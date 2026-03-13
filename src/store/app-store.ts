"use client";

import { create } from "zustand";
import type { POI, RouteInfo, CampusEvent, DateRangePreset } from "@/types";

interface AppState {
  // Map
  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;
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
  eventDateFilter: DateRangePreset;
  setEventDateFilter: (preset: DateRangePreset) => void;
  eventCategoryFilter: string;
  setEventCategoryFilter: (category: string) => void;
  mapEventMarkers: CampusEvent[];
  setMapEventMarkers: (events: CampusEvent[]) => void;
  highlightedEventIds: string[];
  setHighlightedEventIds: (ids: string[]) => void;
  selectedEvent: CampusEvent | null;
  setSelectedEvent: (event: CampusEvent | null) => void;
  streetViewEvent: CampusEvent | null;
  setStreetViewEvent: (event: CampusEvent | null) => void;

  // Voice
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedPOI: null,
  setSelectedPOI: (poi) => set({ selectedPOI: poi, selectedEvent: null }),
  selectedDestination: null,
  setSelectedDestination: (poi) => set({ selectedDestination: poi }),
  routeInfo: null,
  setRouteInfo: (route) => set({ routeInfo: route }),
  flyToTarget: null,
  setFlyToTarget: (target) => set({ flyToTarget: target }),

  activePanel: "chat",
  setActivePanel: (panel) => set({ activePanel: panel }),

  eventDateFilter: "all",
  setEventDateFilter: (preset) => set({ eventDateFilter: preset }),
  eventCategoryFilter: "",
  setEventCategoryFilter: (category) => set({ eventCategoryFilter: category }),
  mapEventMarkers: [],
  setMapEventMarkers: (events) => set({ mapEventMarkers: events }),
  highlightedEventIds: [],
  setHighlightedEventIds: (ids) => set({ highlightedEventIds: ids }),
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event, selectedPOI: null }),
  streetViewEvent: null,
  setStreetViewEvent: (event) => set({ streetViewEvent: event }),

  isSpeaking: false,
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  ttsEnabled: false,
  setTtsEnabled: (enabled) => set({ ttsEnabled: enabled }),
}));
