import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-2d">{children}</div>
  ),
  AdvancedMarker: () => <div data-testid="advanced-marker" />,
  InfoWindow: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="info-window">{children}</div>
  ),
}));

vi.mock("@/lib/maps/solar-utils", () => ({
  getBuildingInsights: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

import type { POI, RouteInfo } from "@/types";
import { useAppStore } from "@/store/app-store";

const mockDestination: POI = {
  id: "lib-1",
  name: "SUSS Library",
  lat: 1.33,
  lng: 103.776,
  category: "Building",
  description: "Main campus library",
  address: "463 Clementi Rd",
};

const mockRouteInfo: RouteInfo = {
  polyline: [
    { lat: 1.33, lng: 103.776 },
    { lat: 1.331, lng: 103.777 },
  ],
  distanceMeters: 450,
  duration: "6 min",
  steps: [
    {
      instruction: "Head north on Clementi Road",
      distanceMeters: 200,
      durationText: "3 min",
      maneuver: "STRAIGHT",
    },
    {
      instruction: "Turn left at the entrance",
      distanceMeters: 250,
      durationText: "3 min",
      maneuver: "TURN_LEFT",
    },
  ],
};

function setStoreState(overrides: {
  routeInfo?: RouteInfo | null;
  selectedDestination?: POI | null;
}) {
  useAppStore.setState({
    routeInfo: overrides.routeInfo ?? null,
    selectedDestination: overrides.selectedDestination ?? null,
  });
}

async function renderRouteOverlay() {
  const { default: RouteOverlay } = await import(
    "@/components/map/RouteOverlay"
  );
  return render(<RouteOverlay />);
}

describe("RouteOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      routeInfo: null,
      selectedDestination: null,
    });
  });

  it("renders nothing when routeInfo is null", async () => {
    const { container } = await renderRouteOverlay();
    expect(container.innerHTML).toBe("");
  });

  it("renders duration and distance", async () => {
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    expect(screen.getByText(/6 min/)).toBeInTheDocument();
    expect(screen.getByText(/450m/)).toBeInTheDocument();
  });

  it("renders destination name", async () => {
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    expect(screen.getByText("SUSS Library")).toBeInTheDocument();
  });

  it("expand/collapse itinerary toggle works", async () => {
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    const expandBtn = screen.getByRole("button", {
      name: "Expand itinerary",
    });
    expect(expandBtn).toBeInTheDocument();

    fireEvent.click(expandBtn);

    expect(
      screen.getByRole("button", { name: "Collapse itinerary" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse itinerary" }),
    );

    expect(
      screen.getByRole("button", { name: "Expand itinerary" }),
    ).toBeInTheDocument();
  });

  it("renders step instructions when expanded", async () => {
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    fireEvent.click(
      screen.getByRole("button", { name: "Expand itinerary" }),
    );

    expect(
      screen.getByText("Head north on Clementi Road"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Turn left at the entrance"),
    ).toBeInTheDocument();
  });

  it("dismiss button hides the overlay on click", async () => {
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    const { container } = await renderRouteOverlay();

    expect(screen.getByText("SUSS Library")).toBeInTheDocument();

    const dismissBtn = screen.getByRole("button", {
      name: "Dismiss route",
    });
    fireEvent.click(dismissBtn);

    expect(container.querySelector("aside")).toBeNull();
  });
});
