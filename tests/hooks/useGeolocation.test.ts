import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useGeolocation } from "@/hooks/useGeolocation";

function mockGeolocation(overrides: Partial<Geolocation> = {}) {
  const geo: Geolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
    ...overrides,
  };
  Object.defineProperty(navigator, "geolocation", {
    value: geo,
    writable: true,
    configurable: true,
  });
  return geo;
}

describe("useGeolocation", () => {
  beforeEach(() => {
    mockGeolocation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.status).toBe("idle");
    expect(result.current.lat).toBeNull();
    expect(result.current.lng).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("transitions to loading then success on granted permission", () => {
    const geo = mockGeolocation({
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: { latitude: 1.314, longitude: 103.765 },
          timestamp: Date.now(),
        } as GeolocationPosition);
      }),
    });

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());

    expect(geo.getCurrentPosition).toHaveBeenCalledOnce();
    expect(geo.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true }),
    );
    expect(result.current.status).toBe("success");
    expect(result.current.lat).toBe(1.314);
    expect(result.current.lng).toBe(103.765);
    expect(result.current.error).toBeNull();
  });

  it("handles permission denied", () => {
    mockGeolocation({
      getCurrentPosition: vi.fn((_success, error) => {
        error!({
          code: 1,
          message: "User denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      }),
    });

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());

    expect(result.current.status).toBe("denied");
    expect(result.current.error).toContain("denied");
  });

  it("handles position unavailable", () => {
    mockGeolocation({
      getCurrentPosition: vi.fn((_success, error) => {
        error!({
          code: 2,
          message: "Position unavailable",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      }),
    });

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());

    expect(result.current.status).toBe("unavailable");
    expect(result.current.error).toContain("unavailable");
  });

  it("handles timeout error", () => {
    mockGeolocation({
      getCurrentPosition: vi.fn((_success, error) => {
        error!({
          code: 3,
          message: "Timeout",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      }),
    });

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("try again");
  });

  it("handles missing geolocation API", () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());

    expect(result.current.status).toBe("unavailable");
    expect(result.current.error).toContain("not supported");
  });
});
