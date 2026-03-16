import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  Map3D: vi.fn(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="map-3d" data-mode={props.mode}>
      {children}
    </div>
  )),
  Marker3D: vi.fn(({ children, label, onClick }: { children?: React.ReactNode; label?: string; onClick?: () => void }) => (
    <button type="button" data-testid="marker-3d" data-label={label} onClick={onClick}>
      {children}
    </button>
  )),
  Pin: vi.fn(() => <span data-testid="pin" />),
  useMap3D: vi.fn(() => null),
  APIProvider: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/error-state", () => ({
  ErrorState: ({ message }: { message: string }) => (
    <div data-testid="error-state">{message}</div>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock("@/components/map/StreetViewPanel", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="street-view-panel">
      <button type="button" onClick={onClose}>Close Street View</button>
    </div>
  ),
}));

vi.mock("@/components/map/RoutePolyline", () => ({
  default: () => <div data-testid="route-polyline" />,
}));

import { useAppStore } from "@/store/app-store";
import { CAMPUS_POIS } from "@/lib/maps/campus-pois";

function setupGoogleMaps() {
  const mockImportLibrary = vi.fn().mockResolvedValue({});
  Object.defineProperty(window, "google", {
    value: {
      maps: {
        importLibrary: mockImportLibrary,
      },
    },
    writable: true,
    configurable: true,
  });
}

function cleanupGoogleMaps() {
  Object.defineProperty(window, "google", {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

async function renderMapView() {
  const { default: MapView } = await import("@/components/map/MapView");
  return render(<MapView />);
}

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      routeInfo: null,
      selectedPOI: null,
      selectedDestination: null,
      flyToTarget: null,
      mapEventMarkers: [],
      highlightedEventIds: [],
      streetViewEvent: null,
    });
    setupGoogleMaps();
    Object.defineProperty(window, "speechSynthesis", {
      value: { cancel: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanupGoogleMaps();
  });

  it("renders the Map3D wrapper once loaded", async () => {
    await act(async () => {
      await renderMapView();
    });

    expect(screen.getByTestId("map-3d")).toBeInTheDocument();
  });

  it("renders Map3D in SATELLITE mode", async () => {
    await act(async () => {
      await renderMapView();
    });

    expect(screen.getByTestId("map-3d")).toHaveAttribute("data-mode", "SATELLITE");
  });

  it("shows markers for CAMPUS_POIS", async () => {
    await act(async () => {
      await renderMapView();
    });

    const markers = screen.getAllByTestId("marker-3d");
    expect(markers.length).toBeGreaterThanOrEqual(CAMPUS_POIS.length);

    const libraryMarker = markers.find((m) => m.getAttribute("data-label") === "SUSS Library");
    expect(libraryMarker).toBeTruthy();
  });

  it("renders RoutePolyline when routeInfo has polyline points", async () => {
    useAppStore.setState({
      routeInfo: {
        polyline: [
          { lat: 1.33, lng: 103.77 },
          { lat: 1.331, lng: 103.771 },
        ],
        distanceMeters: 500,
        duration: "6 mins",
        steps: [],
      },
    });

    await act(async () => {
      await renderMapView();
    });

    expect(screen.getByTestId("route-polyline")).toBeInTheDocument();
  });

  it("does not render RoutePolyline when routeInfo is null", async () => {
    useAppStore.setState({ routeInfo: null });

    await act(async () => {
      await renderMapView();
    });

    expect(screen.queryByTestId("route-polyline")).not.toBeInTheDocument();
  });

  it("calls setSelectedPOI when a marker is clicked", async () => {
    await act(async () => {
      await renderMapView();
    });

    const markers = screen.getAllByTestId("marker-3d");
    fireEvent.click(markers[0]);

    const state = useAppStore.getState();
    expect(state.selectedPOI).not.toBeNull();
  });

  it("does not render the Street View hint text", async () => {
    await act(async () => {
      await renderMapView();
    });

    expect(
      screen.queryByText("Double-click to enter Street View"),
    ).not.toBeInTheDocument();
  });

  it("renders event markers when mapEventMarkers are set", async () => {
    useAppStore.setState({
      mapEventMarkers: [
        {
          id: "evt-1",
          title: "Test Event",
          date: "2025-01-01",
          time: "10:00",
          location: "Block A",
          category: "Workshop",
          description: "A test event",
          type: "On-Campus",
          school: "SUSS",
          lat: 1.33,
          lng: 103.77,
        },
      ],
    });

    await act(async () => {
      await renderMapView();
    });

    const markers = screen.getAllByTestId("marker-3d");
    const eventMarker = markers.find((m) => m.getAttribute("data-label") === "Test Event");
    expect(eventMarker).toBeTruthy();
  });
});
