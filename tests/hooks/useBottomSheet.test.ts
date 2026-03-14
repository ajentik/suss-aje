import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useBottomSheet } from "@/hooks/useBottomSheet";

beforeEach(() => {
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("useBottomSheet", () => {
  it("returns correct initial state with default config", () => {
    const { result } = renderHook(() => useBottomSheet());

    expect(result.current.snapState).toBe("peek");
    expect(result.current.currentHeight).toBe(200);
    expect(result.current.isDragging).toBe(false);
    expect(result.current.sheetRef).toBeDefined();
    expect(result.current.handleRef).toBeDefined();
    expect(typeof result.current.snapTo).toBe("function");
    expect(result.current.touchHandlers).toBeDefined();
    expect(typeof result.current.touchHandlers.onTouchStart).toBe("function");
    expect(typeof result.current.touchHandlers.onTouchMove).toBe("function");
    expect(typeof result.current.touchHandlers.onTouchEnd).toBe("function");
  });

  it("accepts custom snap config", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 40, peek: 150, half: 300, full: 600 }),
    );

    expect(result.current.snapState).toBe("peek");
    expect(result.current.currentHeight).toBe(150);
  });

  it("snapTo updates snapState when reduced-motion is preferred", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    act(() => {
      result.current.snapTo("mini");
    });

    expect(result.current.snapState).toBe("mini");
    expect(result.current.currentHeight).toBe(64);
  });

  it("snapTo to full updates state immediately with reduced motion", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    act(() => {
      result.current.snapTo("full");
    });

    expect(result.current.snapState).toBe("full");
    expect(result.current.currentHeight).toBe(800);
  });

  it("snapTo half then back to peek", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    act(() => result.current.snapTo("half"));
    expect(result.current.snapState).toBe("half");
    expect(result.current.currentHeight).toBe(400);

    act(() => result.current.snapTo("peek"));
    expect(result.current.snapState).toBe("peek");
    expect(result.current.currentHeight).toBe(200);
  });

  it("isDragging remains false when no touch interactions occur", () => {
    const { result } = renderHook(() => useBottomSheet());
    expect(result.current.isDragging).toBe(false);
  });
});
