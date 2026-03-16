import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import type { POI } from "@/types";

const mockSetRouteInfo = vi.fn();
const mockSetSelectedDestination = vi.fn();
const mockSetFlyToTarget = vi.fn();
const mockSetUserLocation = vi.fn();
let mockUserLocation: { lat: number; lng: number } | null = null;

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state: Record<string, unknown> = {
      setRouteInfo: mockSetRouteInfo,
      setSelectedDestination: mockSetSelectedDestination,
      setFlyToTarget: mockSetFlyToTarget,
      setUserLocation: mockSetUserLocation,
      userLocation: mockUserLocation,
    };
    return selector(state);
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const MOCK_ROUTE = {
  polyline: [{ lat: 1.33, lng: 103.77 }],
  distanceMeters: 500,
  durationText: "6 min walk",
  steps: [{ instruction: "Walk north", distanceMeters: 500, durationText: "6 min" }],
};

const DESTINATION: POI = {
  id: "lib",
  name: "Library",
  lat: 1.331,
  lng: 103.778,
  category: "Building",
  description: "Main library",
};

const mockComputeWalkingRoute = vi.fn().mockResolvedValue(MOCK_ROUTE);

vi.mock("@/lib/maps/route-utils", () => ({
  computeWalkingRoute: (...args: unknown[]) => mockComputeWalkingRoute(...args),
}));

describe("useWalkingRoute", () => {
  beforeEach(() => {
    mockUserLocation = null;
    mockComputeWalkingRoute.mockResolvedValue(MOCK_ROUTE);

    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn((success: PositionCallback) => {
          success({
            coords: { latitude: 1.314, longitude: 103.765 },
            timestamp: Date.now(),
          } as GeolocationPosition);
        }),
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockSetRouteInfo.mockReset();
    mockSetSelectedDestination.mockReset();
    mockSetFlyToTarget.mockReset();
    mockSetUserLocation.mockReset();
    mockComputeWalkingRoute.mockReset();
    mockComputeWalkingRoute.mockResolvedValue(MOCK_ROUTE);
  });

  it("returns walkTo function and isLoading=false initially", async () => {
    const { useWalkingRoute } = await import("@/hooks/useWalkingRoute");
    const { result } = renderHook(() => useWalkingRoute());

    expect(typeof result.current.walkTo).toBe("function");
    expect(result.current.isLoading).toBe(false);
  });

  it("walkTo sets destination, flyToTarget, calls geolocation and computeWalkingRoute", async () => {
    const { useWalkingRoute } = await import("@/hooks/useWalkingRoute");
    const { result } = renderHook(() => useWalkingRoute());

    await act(async () => {
      await result.current.walkTo(DESTINATION);
    });

    expect(mockSetSelectedDestination).toHaveBeenCalledWith(DESTINATION);
    expect(mockSetFlyToTarget).toHaveBeenCalledWith({
      lat: DESTINATION.lat,
      lng: DESTINATION.lng,
      altitude: 400,
    });
    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    expect(mockSetUserLocation).toHaveBeenCalledWith({
      lat: 1.314,
      lng: 103.765,
    });
    expect(mockComputeWalkingRoute).toHaveBeenCalledWith(
      { lat: 1.314, lng: 103.765 },
      DESTINATION,
    );
    expect(mockSetRouteInfo).toHaveBeenCalledWith({
      polyline: MOCK_ROUTE.polyline,
      distanceMeters: MOCK_ROUTE.distanceMeters,
      duration: MOCK_ROUTE.durationText,
      steps: MOCK_ROUTE.steps,
    });
  });

  it("falls back to SUSS campus when geolocation rejects", async () => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn(
          (_success: PositionCallback, error: PositionErrorCallback) => {
            error({
              code: 1,
              message: "User denied",
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            } as GeolocationPositionError);
          },
        ),
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    const { useWalkingRoute } = await import("@/hooks/useWalkingRoute");
    const { result } = renderHook(() => useWalkingRoute());

    await act(async () => {
      await result.current.walkTo(DESTINATION);
    });

    expect(mockComputeWalkingRoute).toHaveBeenCalledWith(
      { lat: 1.3299, lng: 103.7764 },
      DESTINATION,
    );
    expect(mockSetRouteInfo).toHaveBeenCalledWith({
      polyline: MOCK_ROUTE.polyline,
      distanceMeters: MOCK_ROUTE.distanceMeters,
      duration: MOCK_ROUTE.durationText,
      steps: MOCK_ROUTE.steps,
    });
  });

  it("uses existing userLocation from store instead of calling geolocation", async () => {
    mockUserLocation = { lat: 1.32, lng: 103.76 };

    const { useWalkingRoute } = await import("@/hooks/useWalkingRoute");
    const { result } = renderHook(() => useWalkingRoute());

    await act(async () => {
      await result.current.walkTo(DESTINATION);
    });

    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(mockComputeWalkingRoute).toHaveBeenCalledWith(
      { lat: 1.32, lng: 103.76 },
      DESTINATION,
    );
  });

  it("still computes route when browser API key is missing", async () => {
    const { useWalkingRoute } = await import("@/hooks/useWalkingRoute");
    const { result } = renderHook(() => useWalkingRoute());

    await act(async () => {
      await result.current.walkTo(DESTINATION);
    });

    expect(mockComputeWalkingRoute).toHaveBeenCalledOnce();
    expect(result.current.isLoading).toBe(false);
  });
});
