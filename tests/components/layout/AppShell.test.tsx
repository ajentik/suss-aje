import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

let currentMobileSheetState: MockStoreState["mobileSheetState"] = "expanded";

type MockStoreState = {
  activePanel: "chat" | "events" | "aac-search";
  ttsEnabled: boolean;
  mobileSheetState: "collapsed" | "peek" | "expanded";
  sheetContentMode: "default" | "poi-detail" | "event-detail";
  selectedPOI: null;
  selectedEvent: null;
  setActivePanel: (panel: MockStoreState["activePanel"]) => void;
  setTtsEnabled: (enabled: boolean) => void;
  newChat: () => void;
  setMobileSheetState: (state: MockStoreState["mobileSheetState"]) => void;
  setSheetContentMode: (mode: MockStoreState["sheetContentMode"]) => void;
  setSelectedPOI: (poi: null) => void;
  setSelectedEvent: (event: null) => void;
  setSelectedDestination: (destination: unknown) => void;
  setStreetViewEvent: (event: unknown) => void;
};

const mockStoreState: MockStoreState = {
  activePanel: "chat",
  ttsEnabled: false,
  mobileSheetState: "expanded",
  sheetContentMode: "default",
  selectedPOI: null,
  selectedEvent: null,
  setActivePanel: (panel) => {
    mockStoreState.activePanel = panel;
  },
  setTtsEnabled: (enabled) => {
    mockStoreState.ttsEnabled = enabled;
  },
  newChat: vi.fn(),
  setMobileSheetState: (state) => {
    mockStoreState.mobileSheetState = state;
  },
  setSheetContentMode: (mode) => {
    mockStoreState.sheetContentMode = mode;
  },
  setSelectedPOI: (poi) => {
    mockStoreState.selectedPOI = poi;
  },
  setSelectedEvent: (event) => {
    mockStoreState.selectedEvent = event;
  },
  setSelectedDestination: vi.fn(),
  setStreetViewEvent: vi.fn(),
};

const useAppStore = Object.assign(
  <T,>(selector: (state: MockStoreState) => T) => selector(mockStoreState),
  {
    getState: () => mockStoreState,
    setState: (partial: Partial<MockStoreState>) => {
      Object.assign(mockStoreState, partial);
      if (partial.mobileSheetState) {
        currentMobileSheetState = partial.mobileSheetState;
      }
    },
  },
);

vi.mock("@/store/app-store", () => ({ useAppStore }));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  Map3D: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-3d">{children}</div>
  ),
  Marker3DInteractive: () => <div data-testid="marker" />,
  AdvancedMarker: () => <div data-testid="adv-marker" />,
  APIProvider: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="api-provider">{children}</div>
  ),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const Component = () => <div data-testid="map-view">MapView</div>;
    Component.displayName = "DynamicMapView";
    return Component;
  },
}));

vi.mock("next/image", () => ({
  default: ({ alt, priority: _priority, ...props }: { alt: string; priority?: boolean; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock("@/components/chat/ChatPanel", () => ({
  default: () => <div data-testid="chat-panel">ChatPanel</div>,
}));

vi.mock("@/components/events/EventsPanel", () => ({
  default: () => <div data-testid="events-panel">EventsPanel</div>,
}));

vi.mock("@/components/aac/AACSearchPanel", () => ({
  default: () => <div data-testid="aac-panel">AACSearchPanel</div>,
}));

vi.mock("@/components/map/RouteOverlay", () => ({
  default: () => <div data-testid="route-overlay" />,
}));

vi.mock("@/components/map/AerialViewButton", () => ({
  default: () => <div data-testid="aerial-view-button" />,
}));

vi.mock("@/components/map/POIPopup", () => ({
  default: () => <div data-testid="poi-popup" />,
  POIDetailCard: ({ poi, onClose, onNavigate }: {
    poi: { name: string };
    onClose: () => void;
    onNavigate: () => void;
    compact?: boolean;
  }) => (
    <div data-testid="poi-detail-card">
      <span>{poi.name}</span>
      <button type="button" onClick={onClose}>Close Detail</button>
      <button type="button" onClick={onNavigate}>Navigate</button>
    </div>
  ),
}));

vi.mock("@/components/map/EventPopup", () => ({
  default: () => <div data-testid="event-popup" />,
  EventDetailCard: ({ event, onClose, onNavigate }: {
    event: { title: string };
    onClose: () => void;
    onNavigate: () => void;
    compact?: boolean;
  }) => (
    <div data-testid="event-detail-card">
      <span>{event.title}</span>
      <button type="button" onClick={onClose}>Close Detail</button>
      <button type="button" onClick={onNavigate}>Navigate</button>
    </div>
  ),
}));

vi.mock("@/components/layout/Onboarding", () => ({
  default: () => <div data-testid="onboarding" />,
}));

vi.mock("@/components/layout/MobileSheet", () => ({
  MobileSheet: ({ children, miniContent }: { children?: React.ReactNode; miniContent?: React.ReactNode }) => (
    <div data-testid="mobile-sheet">
      <button
        type="button"
        aria-label={currentMobileSheetState === "collapsed" ? "Expand panel" : "Collapse panel"}
      >
        Handle
      </button>
      {currentMobileSheetState === "collapsed" ? miniContent : children}
    </div>
  ),
}));

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      writable: true,
      configurable: true,
    });
    useAppStore.setState({
      activePanel: "chat",
      ttsEnabled: false,
      mobileSheetState: "expanded",
      sheetContentMode: "default",
      selectedPOI: null,
      selectedEvent: null,
    });
    currentMobileSheetState = "expanded";
    Object.defineProperty(window, "speechSynthesis", {
      value: { cancel: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  async function renderAppShell() {
    const { default: AppShell } = await import(
      "@/components/layout/AppShell"
    );
    return render(<AppShell />);
  }

  it("renders without crashing", async () => {
    const { container } = await renderAppShell();
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the map view area", async () => {
    await renderAppShell();
    expect(screen.getByTestId("map-view")).toBeInTheDocument();
  });

  it("shows ChatPanel when activePanel is chat", async () => {
    useAppStore.setState({ activePanel: "chat" });
    await renderAppShell();

    const chatPanels = screen.getAllByTestId("chat-panel");
    expect(chatPanels.length).toBeGreaterThanOrEqual(1);
  });

  it("shows EventsPanel when activePanel is events", async () => {
    useAppStore.setState({ activePanel: "events" });
    await renderAppShell();

    const eventsPanels = screen.getAllByTestId("events-panel");
    expect(eventsPanels.length).toBeGreaterThanOrEqual(1);
  });

  it("shows AACSearchPanel when activePanel is aac-search", async () => {
    useAppStore.setState({ activePanel: "aac-search" });
    await renderAppShell();

    const aacPanels = screen.getAllByTestId("aac-panel");
    expect(aacPanels.length).toBeGreaterThanOrEqual(1);
  });

  it("tab buttons call setActivePanel when clicked", async () => {
    useAppStore.setState({ activePanel: "chat" });
    await renderAppShell();

    const eventsTabs = screen.getAllByRole("tab", { name: /events/i });
    fireEvent.click(eventsTabs[0]);

    expect(useAppStore.getState().activePanel).toBe("events");
  });

  it("switches from chat to aac-search tab", async () => {
    useAppStore.setState({ activePanel: "chat" });
    await renderAppShell();

    const aacTabs = screen.getAllByRole("tab", { name: /aac/i });
    fireEvent.click(aacTabs[0]);

    expect(useAppStore.getState().activePanel).toBe("aac-search");
  });

  it("renders brand header with AskSUSSi text", async () => {
    await renderAppShell();
    const brandTexts = screen.getAllByText("AskSUSSi");
    expect(brandTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders TTS toggle button", async () => {
    await renderAppShell();
    const ttsButtons = screen.getAllByRole("button", { name: /voice/i });
    expect(ttsButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("toggles TTS when voice button clicked", async () => {
    useAppStore.setState({ ttsEnabled: false });
    await renderAppShell();

    const ttsButtons = screen.getAllByRole("button", { name: /enable voice/i });
    fireEvent.click(ttsButtons[0]);

    expect(useAppStore.getState().ttsEnabled).toBe(true);
  });

  it("renders mobile bottom sheet with drag handle", async () => {
    useAppStore.setState({ mobileSheetState: "expanded" });
    await renderAppShell();

    const expandButtons = screen.getAllByRole("button", { name: /collapse panel|expand panel/i });
    expect(expandButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows collapsed status with 'Swipe up to chat' in collapsed state", async () => {
    useAppStore.setState({ mobileSheetState: "collapsed" });
    await renderAppShell();

    expect(screen.getByText("Swipe up to chat")).toBeInTheDocument();
  });

  it("renders route overlay and aerial view button", async () => {
    await renderAppShell();
    expect(screen.getByTestId("route-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("aerial-view-button")).toBeInTheDocument();
  });

  it("renders onboarding component", async () => {
    await renderAppShell();
    expect(screen.getByTestId("onboarding")).toBeInTheDocument();
  });
});
