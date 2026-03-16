import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockMapInstance = {
  getZoom: vi.fn(() => 17),
  setZoom: vi.fn(),
  panTo: vi.fn(),
};

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => mockMapInstance),
  useMapsLibrary: vi.fn(() => null),
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-2d">{children}</div>
  ),
  AdvancedMarker: () => <div data-testid="advanced-marker" />,
}));

const mockPolylineInstance = {
  setMap: vi.fn(),
};

const MockPolylineConstructor = vi.fn().mockImplementation(() => mockPolylineInstance);

Object.defineProperty(globalThis, "google", {
  value: {
    maps: {
      Polyline: MockPolylineConstructor,
    },
  },
  writable: true,
  configurable: true,
});

import { useAppStore } from "@/store/app-store";

describe("RoutePolyline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      routeInfo: null,
    });
    mockPolylineInstance.setMap.mockClear();
    MockPolylineConstructor.mockClear();
  });

  async function renderRoutePolyline() {
    const { default: RoutePolyline } = await import(
      "@/components/map/RoutePolyline"
    );
    return render(<RoutePolyline />);
  }

  it("creates a google.maps.Polyline when routeInfo has polyline points", async () => {
    useAppStore.setState({
      routeInfo: {
        polyline: [
          { lat: 1.3299, lng: 103.7764 },
          { lat: 1.3302, lng: 103.7758 },
          { lat: 1.3305, lng: 103.7762 },
        ],
        distanceMeters: 350,
        duration: "4 mins",
        steps: [],
      },
    });

    await renderRoutePolyline();

    expect(MockPolylineConstructor).toHaveBeenCalledOnce();
    const callArgs = MockPolylineConstructor.mock.calls[0][0];
    expect(callArgs.strokeColor).toBe("#4285F4");
    expect(callArgs.strokeWeight).toBe(6);
    expect(callArgs.path).toHaveLength(3);
    expect(callArgs.map).toBe(mockMapInstance);
  });

  it("does not create polyline when routeInfo is null", async () => {
    useAppStore.setState({ routeInfo: null });

    const { container } = await renderRoutePolyline();

    expect(container.innerHTML).toBe("");
    expect(MockPolylineConstructor).not.toHaveBeenCalled();
  });

  it("does not create polyline when routeInfo has empty polyline array", async () => {
    useAppStore.setState({
      routeInfo: {
        polyline: [],
        distanceMeters: 0,
        duration: "0 mins",
        steps: [],
      },
    });

    await renderRoutePolyline();

    expect(MockPolylineConstructor).not.toHaveBeenCalled();
  });

  it("cleans up polyline when unmounted", async () => {
    useAppStore.setState({
      routeInfo: {
        polyline: [
          { lat: 1.33, lng: 103.77 },
          { lat: 1.331, lng: 103.771 },
        ],
        distanceMeters: 200,
        duration: "2 mins",
        steps: [],
      },
    });

    const { unmount } = await renderRoutePolyline();

    expect(MockPolylineConstructor).toHaveBeenCalledOnce();

    unmount();

    expect(mockPolylineInstance.setMap).toHaveBeenCalledWith(null);
  });
});
