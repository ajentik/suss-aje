import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  Map: vi.fn(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="map-2d" data-map-type-id={props.mapTypeId}>
      {children}
    </div>
  )),
  AdvancedMarker: vi.fn(({ children, title, onClick }: { children?: React.ReactNode; title?: string; onClick?: () => void }) => (
    <button type="button" data-testid="advanced-marker" data-label={title} onClick={onClick}>
      {children}
    </button>
  )),
  Pin: vi.fn(() => <span data-testid="pin" />),
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

vi.mock("@/components/map/RoutePolyline", () => ({
  default: () => <div data-testid="route-polyline" />,
}));

import { useAppStore } from "@/store/app-store";
import { CAMPUS_POIS } from "@/lib/maps/campus-pois";

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
    });
  });

  it("renders the 2D map wrapper", async () => {
    await act(async () => {
      await renderMapView();
    });

    expect(screen.getByTestId("map-2d")).toBeInTheDocument();
  });

  it("renders map in roadmap mode", async () => {
    await act(async () => {
      await renderMapView();
    });

    expect(screen.getByTestId("map-2d")).toHaveAttribute("data-map-type-id", "roadmap");
  });

  it("shows markers for CAMPUS_POIS", async () => {
    await act(async () => {
      await renderMapView();
    });

    const markers = screen.getAllByTestId("advanced-marker");
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

    const markers = screen.getAllByTestId("advanced-marker");
    fireEvent.click(markers[0]);

    const state = useAppStore.getState();
    expect(state.selectedPOI).not.toBeNull();
  });

  it("renders zoom controls", async () => {
    await act(async () => {
      await renderMapView();
    });

    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument();
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

    const markers = screen.getAllByTestId("advanced-marker");
    const eventMarker = markers.find((m) => m.getAttribute("data-label") === "Test Event");
    expect(eventMarker).toBeTruthy();
  });
});
