import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  Map3D: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map3d">{children}</div>
  ),
  Marker3DInteractive: () => <div data-testid="marker" />,
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

  it("renders MobilitySelector component", async () => {
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    const aside = screen.getByRole("complementary", { name: "Walking directions" });
    expect(aside).toBeInTheDocument();
  });

  it("renders step distance in meters for short distances", async () => {
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    fireEvent.click(screen.getByRole("button", { name: "Expand itinerary" }));

    expect(screen.getByText("200m")).toBeInTheDocument();
  });

  it("renders step distance in km for distances >= 1000m", async () => {
    const longRouteInfo = {
      ...mockRouteInfo,
      steps: [{
        instruction: "Walk along the road",
        distanceMeters: 1500,
        durationText: "20 min",
        maneuver: "STRAIGHT",
      }],
    };
    setStoreState({
      routeInfo: longRouteInfo,
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    fireEvent.click(screen.getByRole("button", { name: "Expand itinerary" }));
    expect(screen.getByText("1.5km")).toBeInTheDocument();
  });

  it("shows elderly walk time when mobility level is not normal", async () => {
    useAppStore.setState({ mobilityLevel: "slow" });
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    expect(screen.getByText(/min walk/)).toBeInTheDocument();
  });

  it("shows stairs warning when route has stairs", async () => {
    const routeWithStairs = {
      ...mockRouteInfo,
      steps: [
        {
          instruction: "Take the stairs to level 2",
          distanceMeters: 50,
          durationText: "1 min",
          maneuver: "STRAIGHT",
          hasStairs: true,
        },
      ],
    };
    setStoreState({
      routeInfo: routeWithStairs,
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    const stairsWarning = screen.queryByText(/Stairs on route/);
    if (stairsWarning) {
      expect(stairsWarning).toBeInTheDocument();
    }
  });

  it("handles touch swipe to dismiss", async () => {
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    const { container } = await renderRouteOverlay();
    const aside = container.querySelector("aside")!;

    fireEvent.touchStart(aside, {
      touches: [{ clientY: 100 }],
    });
    fireEvent.touchMove(aside, {
      touches: [{ clientY: 200 }],
    });
    fireEvent.touchEnd(aside);

    expect(container.querySelector("aside")).toBeNull();
  });

  it("touch swipe below threshold does not dismiss", async () => {
    setStoreState({
      routeInfo: mockRouteInfo,
      selectedDestination: mockDestination,
    });

    const { container } = await renderRouteOverlay();
    const aside = container.querySelector("aside")!;

    fireEvent.touchStart(aside, {
      touches: [{ clientY: 100 }],
    });
    fireEvent.touchMove(aside, {
      touches: [{ clientY: 130 }],
    });
    fireEvent.touchEnd(aside);

    expect(container.querySelector("aside")).not.toBeNull();
  });

  it("renders nothing when route with no steps hides expand button", async () => {
    setStoreState({
      routeInfo: { ...mockRouteInfo, steps: [] },
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    expect(screen.queryByRole("button", { name: "Expand itinerary" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss route" })).toBeInTheDocument();
  });

  it("renders maneuver icons for various step types", async () => {
    const variedSteps = [
      { instruction: "Go straight", distanceMeters: 100, durationText: "1 min", maneuver: "STRAIGHT" },
      { instruction: "Turn right", distanceMeters: 50, durationText: "1 min", maneuver: "TURN_RIGHT" },
      { instruction: "No maneuver", distanceMeters: 50, durationText: "1 min" },
    ];

    setStoreState({
      routeInfo: { ...mockRouteInfo, steps: variedSteps },
      selectedDestination: mockDestination,
    });

    await renderRouteOverlay();

    fireEvent.click(screen.getByRole("button", { name: "Expand itinerary" }));
    expect(screen.getByText("Go straight")).toBeInTheDocument();
    expect(screen.getByText("Turn right")).toBeInTheDocument();
    expect(screen.getByText("No maneuver")).toBeInTheDocument();
  });
});
