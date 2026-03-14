"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { POI, RouteInfo, CampusEvent, ChatMessage, DateRangePreset } from "@/types";

type SheetContentMode = "default" | "poi-detail" | "event-detail";
type MobileSheetState = "collapsed" | "peek" | "expanded";
export type PanelId = "chat" | "events" | "aac-search";

interface AppState {
  selectedPOI: POI | null;
  setSelectedPOI: (poi: POI | null) => void;
  selectedDestination: POI | null;
  setSelectedDestination: (poi: POI | null) => void;
  routeInfo: RouteInfo | null;
  setRouteInfo: (route: RouteInfo | null) => void;
  flyToTarget: { lat: number; lng: number; altitude?: number } | null;
  setFlyToTarget: (target: { lat: number; lng: number; altitude?: number } | null) => void;

  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;

  activePanel: PanelId;
  setActivePanel: (panel: PanelId) => void;

  sheetContentMode: SheetContentMode;
  setSheetContentMode: (mode: SheetContentMode) => void;
  mobileSheetState: MobileSheetState;
  setMobileSheetState: (state: MobileSheetState) => void;

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

  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;

  onboardingDismissed: boolean;
  setOnboardingDismissed: (dismissed: boolean) => void;

  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  conversationId: string;
  newChat: () => void;

  pendingChatMessage: string | null;
  setPendingChatMessage: (message: string | null) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedPOI: null,
      setSelectedPOI: (poi) =>
        set({
          selectedPOI: poi,
          selectedEvent: null,
          ...(poi
            ? { sheetContentMode: "poi-detail" as const, mobileSheetState: "peek" as const }
            : { sheetContentMode: "default" as const }),
        }),
      selectedDestination: null,
      setSelectedDestination: (poi) => set({ selectedDestination: poi }),
      routeInfo: null,
      setRouteInfo: (route) => set({ routeInfo: route }),
      flyToTarget: null,
      setFlyToTarget: (target) => set({ flyToTarget: target }),

      userLocation: null,
      setUserLocation: (loc) => set({ userLocation: loc }),

      activePanel: "chat",
      setActivePanel: (panel) => set({ activePanel: panel }),

      sheetContentMode: "default",
      setSheetContentMode: (mode) => set({ sheetContentMode: mode }),
      mobileSheetState: "expanded",
      setMobileSheetState: (state) => set({ mobileSheetState: state }),

      eventDateFilter: "all",
      setEventDateFilter: (preset) => set({ eventDateFilter: preset }),
      eventCategoryFilter: "",
      setEventCategoryFilter: (category) => set({ eventCategoryFilter: category }),
      mapEventMarkers: [],
      setMapEventMarkers: (events) => set({ mapEventMarkers: events }),
      highlightedEventIds: [],
      setHighlightedEventIds: (ids) => set({ highlightedEventIds: ids }),
      selectedEvent: null,
      setSelectedEvent: (event) =>
        set({
          selectedEvent: event,
          selectedPOI: null,
          ...(event
            ? { sheetContentMode: "event-detail" as const, mobileSheetState: "peek" as const }
            : { sheetContentMode: "default" as const }),
        }),
      streetViewEvent: null,
      setStreetViewEvent: (event) => set({ streetViewEvent: event }),

      isSpeaking: false,
      setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
      ttsEnabled: false,
      setTtsEnabled: (enabled) => set({ ttsEnabled: enabled }),

      onboardingDismissed: false,
      setOnboardingDismissed: (dismissed) => set({ onboardingDismissed: dismissed }),

      chatMessages: [],
      setChatMessages: (messages) => set({ chatMessages: messages }),
      conversationId: generateId(),
      newChat: () =>
        set({
          chatMessages: [],
          conversationId: generateId(),
          routeInfo: null,
          selectedDestination: null,
          selectedPOI: null,
        }),

      pendingChatMessage: null,
      setPendingChatMessage: (message) => set({ pendingChatMessage: message }),
    }),
    {
      name: "asksussi-prefs",
      partialize: (state) => ({
        ttsEnabled: state.ttsEnabled,
        activePanel: state.activePanel,
        onboardingDismissed: state.onboardingDismissed,
        chatMessages: state.chatMessages,
        conversationId: state.conversationId,
      }),
    }
  )
);
