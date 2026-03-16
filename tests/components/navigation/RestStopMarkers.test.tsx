import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
}));

import type { RouteInfo } from "@/types";
import { useAppStore } from "@/store/app-store";

const mockRouteInfo: RouteInfo = {
  polyline: [
    { lat: 1.33, lng: 103.776 },
    { lat: 1.331, lng: 103.777 },
  ],
  distanceMeters: 600,
  duration: "8 min",
  steps: [
    {
      instruction: "Head north",
      distanceMeters: 250,
      durationText: "4 min",
      maneuver: "STRAIGHT",
    },
    {
      instruction: "Turn left",
      distanceMeters: 200,
      durationText: "3 min",
      maneuver: "TURN_LEFT",
    },
    {
      instruction: "Continue straight",
      distanceMeters: 150,
      durationText: "2 min",
    },
  ],
};

async function renderRestStopMarkers() {
  const { default: RestStopMarkers } = await import(
    "@/components/navigation/RestStopMarkers"
  );
  return render(<RestStopMarkers />);
}

describe("RestStopMarkers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      routeInfo: null,
      mobilityLevel: "normal",
      userLocation: null,
    });
  });

  it("renders nothing when no route info", async () => {
    const { container } = await renderRestStopMarkers();
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for normal mobility even with route", async () => {
    useAppStore.setState({ routeInfo: mockRouteInfo, mobilityLevel: "normal" });
    const { container } = await renderRestStopMarkers();
    expect(container.innerHTML).toBe("");
  });

  it("renders rest stops for slow mobility", async () => {
    useAppStore.setState({ routeInfo: mockRouteInfo, mobilityLevel: "slow" });
    await renderRestStopMarkers();

    const list = screen.getByRole("list", { name: "Suggested rest stops" });
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
  });

  it("shows 'Rest here' text for each stop", async () => {
    useAppStore.setState({ routeInfo: mockRouteInfo, mobilityLevel: "slow" });
    await renderRestStopMarkers();

    const restLabels = screen.getAllByText("Rest here");
    expect(restLabels.length).toBeGreaterThan(0);
  });

  it("shows distance from start when no user location", async () => {
    useAppStore.setState({ routeInfo: mockRouteInfo, mobilityLevel: "walker" });
    await renderRestStopMarkers();

    expect(screen.getAllByText(/from start/).length).toBeGreaterThan(0);
  });

  it("shows distance from user coordinates when location is set", async () => {
    useAppStore.setState({
      routeInfo: mockRouteInfo,
      mobilityLevel: "slow",
      userLocation: { lat: 1.33, lng: 103.776 },
    });
    await renderRestStopMarkers();

    expect(screen.getAllByText(/from 1\.3300/).length).toBeGreaterThan(0);
  });
});
