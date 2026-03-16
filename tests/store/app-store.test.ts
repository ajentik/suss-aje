import { describe, expect, it, beforeEach } from "vitest";
import type { POI, CampusEvent } from "@/types";

const { useAppStore } = await import("@/store/app-store");

const mockPOI: POI = {
  id: "test-poi",
  name: "Test POI",
  lat: 1.33,
  lng: 103.77,
  category: "Building",
  description: "A test POI",
};

const mockEvent: CampusEvent = {
  id: "test-event",
  title: "Test Event",
  date: "2025-03-15",
  time: "10:00",
  location: "Block A",
  category: "Lecture",
  description: "A test event",
  type: "On-Campus",
  school: "SUSS",
  lat: 1.33,
  lng: 103.77,
};

function resetStore() {
  useAppStore.setState({
    selectedPOI: null,
    selectedDestination: null,
    routeInfo: null,
    flyToTarget: null,
    activePanel: "chat",
    sheetContentMode: "default",
    mobileSheetState: "expanded",
    eventDateFilter: "all",
    eventCategoryFilter: "",
    mapEventMarkers: [],
    highlightedEventIds: [],
    selectedEvent: null,
    streetViewEvent: null,
    isSpeaking: false,
    ttsEnabled: false,
    onboardingDismissed: false,
    chatMessages: [],
    pendingChatMessage: null,
  });
}

describe("app-store", () => {
  beforeEach(() => {
    resetStore();
  });

  it("initializes with correct default values", () => {
    const state = useAppStore.getState();
    expect(state.selectedPOI).toBeNull();
    expect(state.selectedDestination).toBeNull();
    expect(state.routeInfo).toBeNull();
    expect(state.flyToTarget).toBeNull();
    expect(state.activePanel).toBe("chat");
    expect(state.sheetContentMode).toBe("default");
    expect(state.mobileSheetState).toBe("expanded");
    expect(state.eventDateFilter).toBe("all");
    expect(state.eventCategoryFilter).toBe("");
    expect(state.mapEventMarkers).toEqual([]);
    expect(state.highlightedEventIds).toEqual([]);
    expect(state.selectedEvent).toBeNull();
    expect(state.isSpeaking).toBe(false);
    expect(state.ttsEnabled).toBe(false);
    expect(state.onboardingDismissed).toBe(false);
    expect(state.chatMessages).toEqual([]);
    expect(state.pendingChatMessage).toBeNull();
  });

  it("setSelectedPOI sets POI, clears selectedEvent, sets sheetContentMode", () => {
    useAppStore.getState().setSelectedPOI(mockPOI);
    const state = useAppStore.getState();
    expect(state.selectedPOI).toEqual(mockPOI);
    expect(state.selectedEvent).toBeNull();
    expect(state.sheetContentMode).toBe("poi-detail");
    expect(state.mobileSheetState).toBe("peek");
  });

  it("setSelectedPOI(null) clears POI and resets sheetContentMode", () => {
    useAppStore.getState().setSelectedPOI(mockPOI);
    useAppStore.getState().setSelectedPOI(null);
    const state = useAppStore.getState();
    expect(state.selectedPOI).toBeNull();
    expect(state.sheetContentMode).toBe("default");
  });

  it("setSelectedEvent sets event, clears selectedPOI, sets sheetContentMode", () => {
    useAppStore.getState().setSelectedPOI(mockPOI);
    useAppStore.getState().setSelectedEvent(mockEvent);
    const state = useAppStore.getState();
    expect(state.selectedEvent).toEqual(mockEvent);
    expect(state.selectedPOI).toBeNull();
    expect(state.sheetContentMode).toBe("event-detail");
    expect(state.mobileSheetState).toBe("peek");
  });

  it("setSelectedEvent(null) clears event and resets sheetContentMode", () => {
    useAppStore.getState().setSelectedEvent(mockEvent);
    useAppStore.getState().setSelectedEvent(null);
    const state = useAppStore.getState();
    expect(state.selectedEvent).toBeNull();
    expect(state.sheetContentMode).toBe("default");
  });

  it("setActivePanel changes active panel", () => {
    useAppStore.getState().setActivePanel("events");
    expect(useAppStore.getState().activePanel).toBe("events");
    useAppStore.getState().setActivePanel("aac-search");
    expect(useAppStore.getState().activePanel).toBe("aac-search");
  });

  it("setFlyToTarget sets and clears fly target", () => {
    const target = { lat: 1.33, lng: 103.77, altitude: 500 };
    useAppStore.getState().setFlyToTarget(target);
    expect(useAppStore.getState().flyToTarget).toEqual(target);
    useAppStore.getState().setFlyToTarget(null);
    expect(useAppStore.getState().flyToTarget).toBeNull();
  });

  it("setRouteInfo sets and clears route info", () => {
    const route = {
      polyline: [{ lat: 1.33, lng: 103.77 }],
      distanceMeters: 500,
      duration: "5 mins",
      steps: [],
    };
    useAppStore.getState().setRouteInfo(route);
    expect(useAppStore.getState().routeInfo).toEqual(route);
    useAppStore.getState().setRouteInfo(null);
    expect(useAppStore.getState().routeInfo).toBeNull();
  });

  it("setEventDateFilter updates date filter", () => {
    useAppStore.getState().setEventDateFilter("3d");
    expect(useAppStore.getState().eventDateFilter).toBe("3d");
  });

  it("setEventCategoryFilter updates category filter", () => {
    useAppStore.getState().setEventCategoryFilter("Lecture");
    expect(useAppStore.getState().eventCategoryFilter).toBe("Lecture");
  });

  it("setTtsEnabled toggles TTS", () => {
    useAppStore.getState().setTtsEnabled(true);
    expect(useAppStore.getState().ttsEnabled).toBe(true);
    useAppStore.getState().setTtsEnabled(false);
    expect(useAppStore.getState().ttsEnabled).toBe(false);
  });

  it("setOnboardingDismissed works", () => {
    useAppStore.getState().setOnboardingDismissed(true);
    expect(useAppStore.getState().onboardingDismissed).toBe(true);
  });

  it("setChatMessages sets messages", () => {
    const messages = [
      { id: "1", role: "user" as const, content: "Hello" },
      { id: "2", role: "assistant" as const, content: "Hi there" },
    ];
    useAppStore.getState().setChatMessages(messages);
    expect(useAppStore.getState().chatMessages).toEqual(messages);
  });

  it("newChat resets messages, generates new conversationId, clears routing state", () => {
    useAppStore.getState().setChatMessages([
      { id: "1", role: "user", content: "Hello" },
    ]);
    useAppStore.getState().setSelectedPOI(mockPOI);
    useAppStore.getState().setSelectedDestination(mockPOI);
    useAppStore.getState().setRouteInfo({
      polyline: [{ lat: 1.33, lng: 103.77 }],
      distanceMeters: 100,
      duration: "1 min",
      steps: [],
    });
    const oldId = useAppStore.getState().conversationId;

    useAppStore.getState().newChat();

    const state = useAppStore.getState();
    expect(state.chatMessages).toEqual([]);
    expect(state.conversationId).not.toBe(oldId);
    expect(state.conversationId.length).toBeGreaterThan(0);
    expect(state.routeInfo).toBeNull();
    expect(state.selectedDestination).toBeNull();
    expect(state.selectedPOI).toBeNull();
  });
});
