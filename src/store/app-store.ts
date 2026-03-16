"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StateCreator } from "zustand";
import type { POI, RouteInfo, CampusEvent, ChatMessage, DateRangePreset, MobilityLevel, LanguageCode } from "@/types";

type SheetContentMode = "default" | "poi-detail" | "event-detail";
type MobileSheetState = "collapsed" | "peek" | "expanded";
export type PanelId = "chat" | "events" | "aac-search";

export interface AppState {
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

  introDismissed: boolean;
  setIntroDismissed: (dismissed: boolean) => void;

  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  conversationId: string;
  newChat: () => void;

  pendingChatMessage: string | null;
  setPendingChatMessage: (message: string | null) => void;

  mobilityLevel: MobilityLevel;
  setMobilityLevel: (level: MobilityLevel) => void;

  preferredLanguage: LanguageCode;
  setPreferredLanguage: (lang: LanguageCode) => void;
}

type MapSlice = Pick<
  AppState,
  | "selectedPOI"
  | "setSelectedPOI"
  | "selectedDestination"
  | "setSelectedDestination"
  | "routeInfo"
  | "setRouteInfo"
  | "flyToTarget"
  | "setFlyToTarget"
  | "userLocation"
  | "setUserLocation"
  | "mobilityLevel"
  | "setMobilityLevel"
  | "preferredLanguage"
  | "setPreferredLanguage"
>;

type UiSlice = Pick<
  AppState,
  | "activePanel"
  | "setActivePanel"
  | "sheetContentMode"
  | "setSheetContentMode"
  | "mobileSheetState"
  | "setMobileSheetState"
  | "onboardingDismissed"
  | "setOnboardingDismissed"
  | "introDismissed"
  | "setIntroDismissed"
>;

type EventsSlice = Pick<
  AppState,
  | "eventDateFilter"
  | "setEventDateFilter"
  | "eventCategoryFilter"
  | "setEventCategoryFilter"
  | "mapEventMarkers"
  | "setMapEventMarkers"
  | "highlightedEventIds"
  | "setHighlightedEventIds"
  | "selectedEvent"
  | "setSelectedEvent"
  | "streetViewEvent"
  | "setStreetViewEvent"
>;

type ChatSlice = Pick<
  AppState,
  | "chatMessages"
  | "setChatMessages"
  | "conversationId"
  | "newChat"
  | "pendingChatMessage"
  | "setPendingChatMessage"
  | "isSpeaking"
  | "setIsSpeaking"
  | "ttsEnabled"
  | "setTtsEnabled"
>;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const createMapSlice: StateCreator<AppState, [], [], MapSlice> = (set) => ({
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
  mobilityLevel: "normal",
  setMobilityLevel: (level) => set({ mobilityLevel: level }),
  preferredLanguage: "en",
  setPreferredLanguage: (lang) => {
    set({ preferredLanguage: lang });
    try {
      localStorage.setItem("preferred-language", lang);
    } catch {
    }
  },
});

const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set) => ({
  activePanel: "chat",
  setActivePanel: (panel) => set({ activePanel: panel }),
  sheetContentMode: "default",
  setSheetContentMode: (mode) => set({ sheetContentMode: mode }),
  mobileSheetState: "expanded",
  setMobileSheetState: (state) => set({ mobileSheetState: state }),
  onboardingDismissed: false,
  setOnboardingDismissed: (dismissed) => set({ onboardingDismissed: dismissed }),
  introDismissed: false,
  setIntroDismissed: (dismissed) => set({ introDismissed: dismissed }),
});

const createEventsSlice: StateCreator<AppState, [], [], EventsSlice> = (set) => ({
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
});

const createChatSlice: StateCreator<AppState, [], [], ChatSlice> = (set) => ({
  isSpeaking: false,
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  ttsEnabled: false,
  setTtsEnabled: (enabled) => set({ ttsEnabled: enabled }),
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
      selectedEvent: null,
      streetViewEvent: null,
      sheetContentMode: "default",
      mobileSheetState: "expanded",
      pendingChatMessage: null,
    }),
  pendingChatMessage: null,
  setPendingChatMessage: (message) => set({ pendingChatMessage: message }),
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get, api) => ({
      ...createMapSlice(set, get, api),
      ...createUiSlice(set, get, api),
      ...createEventsSlice(set, get, api),
      ...createChatSlice(set, get, api),
    }),
    {
      name: "asksussi-prefs",
      // Security: chat messages are intentionally excluded from persistence.
      // They may contain sensitive user input that must not survive browser sessions.
      // Only non-sensitive UI preferences are persisted here.
      partialize: (state) => ({
        ttsEnabled: state.ttsEnabled,
        activePanel: state.activePanel,
        onboardingDismissed: state.onboardingDismissed,
        introDismissed: state.introDismissed,
        mobilityLevel: state.mobilityLevel,
        preferredLanguage: state.preferredLanguage,
      }),
    }
  )
);
