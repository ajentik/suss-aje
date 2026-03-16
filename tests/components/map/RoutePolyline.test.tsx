import { describe, expect, it, vi, beforeEach, beforeAll } from "vitest";
import { render } from "@testing-library/react";

beforeAll(() => {
  if (!customElements.get("gmp-polyline-3d")) {
    customElements.define(
      "gmp-polyline-3d",
      class extends HTMLElement {},
    );
  }
});

const mockMap3dElement = document.createElement("div");

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  useMap3D: vi.fn(() => mockMap3dElement),
  Map3D: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-3d">{children}</div>
  ),
  Marker3DInteractive: () => <div data-testid="marker" />,
  AdvancedMarker: () => <div data-testid="adv-marker" />,
}));

import { useAppStore } from "@/store/app-store";
import { useMap3D } from "@vis.gl/react-google-maps";

const mockedUseMap3D = vi.mocked(useMap3D);

describe("RoutePolyline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      routeInfo: null,
    });
    mockMap3dElement.innerHTML = "";
    mockedUseMap3D.mockReturnValue(mockMap3dElement as unknown as ReturnType<typeof useMap3D>);
  });

  async function renderRoutePolyline() {
    const { default: RoutePolyline } = await import(
      "@/components/map/RoutePolyline"
    );
    return render(<RoutePolyline />);
  }

  it("renders the polyline element when routeInfo has polyline points", async () => {
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

    const polyline = mockMap3dElement.querySelector("gmp-polyline-3d");
    expect(polyline).toBeTruthy();
    expect(polyline?.getAttribute("altitude-mode")).toBe("CLAMP_TO_GROUND");
    expect(polyline?.getAttribute("stroke-color")).toBe("#4285F4");
    expect(polyline?.getAttribute("stroke-width")).toBe("8");

    const coords = polyline?.getAttribute("coordinates");
    expect(coords).toContain("1.3299,103.7764,0");
    expect(coords).toContain("1.3302,103.7758,0");
    expect(coords).toContain("1.3305,103.7762,0");
  });

  it("does not append polyline when routeInfo is null", async () => {
    useAppStore.setState({ routeInfo: null });

    const { container } = await renderRoutePolyline();

    expect(container.innerHTML).toBe("");
    expect(mockMap3dElement.querySelector("gmp-polyline-3d")).toBeNull();
  });

  it("does not append polyline when routeInfo has empty polyline array", async () => {
    useAppStore.setState({
      routeInfo: {
        polyline: [],
        distanceMeters: 0,
        duration: "0 mins",
        steps: [],
      },
    });

    await renderRoutePolyline();

    expect(mockMap3dElement.querySelector("gmp-polyline-3d")).toBeNull();
  });

  it("does not append polyline to map when map3d is null", async () => {
    mockedUseMap3D.mockReturnValue(null as unknown as ReturnType<typeof useMap3D>);

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

    await renderRoutePolyline();
    expect(mockMap3dElement.querySelector("gmp-polyline-3d")).toBeNull();
  });

  it("cleans up previous polyline when routeInfo changes", async () => {
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

    const { rerender } = await renderRoutePolyline();

    expect(mockMap3dElement.querySelectorAll("gmp-polyline-3d").length).toBe(1);

    useAppStore.setState({ routeInfo: null });

    const { default: RoutePolyline } = await import(
      "@/components/map/RoutePolyline"
    );
    rerender(<RoutePolyline />);

    expect(mockMap3dElement.querySelectorAll("gmp-polyline-3d").length).toBe(0);
  });
});
