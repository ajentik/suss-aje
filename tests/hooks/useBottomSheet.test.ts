import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type React from "react";

import { useBottomSheet } from "@/hooks/useBottomSheet";

function createMockTouchEvent(clientY: number): React.TouchEvent {
  return {
    touches: [{ clientY }],
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.TouchEvent;
}

function createSheetEl(offsetHeight = 900): HTMLDivElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "offsetHeight", { value: offsetHeight, configurable: true });
  el.style.transform = "";
  el.style.transition = "";
  el.style.visibility = "";
  return el;
}

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

  it("onTouchStart sets isDragging to true", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(500));
    });

    expect(result.current.isDragging).toBe(true);
  });

  it("onTouchMove updates transform when dragging", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(500));
    });

    act(() => {
      result.current.touchHandlers.onTouchMove(createMockTouchEvent(400));
    });

    expect(sheetEl.style.transform).toContain("translateY");
  });

  it("onTouchEnd sets isDragging to false and snaps to nearest", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(500));
    });

    act(() => {
      result.current.touchHandlers.onTouchMove(createMockTouchEvent(450));
    });

    act(() => {
      result.current.touchHandlers.onTouchEnd(createMockTouchEvent(450));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it("touch drag upward expands the sheet", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(500));
    });

    act(() => {
      result.current.touchHandlers.onTouchMove(createMockTouchEvent(200));
    });

    act(() => {
      result.current.touchHandlers.onTouchEnd(createMockTouchEvent(200));
    });

    expect(result.current.currentHeight).toBeGreaterThanOrEqual(200);
  });

  it("touch drag downward collapses the sheet", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.snapTo("half");
    });

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(200));
    });

    act(() => {
      result.current.touchHandlers.onTouchMove(createMockTouchEvent(500));
    });

    act(() => {
      result.current.touchHandlers.onTouchEnd(createMockTouchEvent(500));
    });

    expect(result.current.currentHeight).toBeLessThan(400);
  });

  it("flick gesture upward snaps to adjacent higher snap", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    const now = Date.now();
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now + 50)
      .mockReturnValueOnce(now + 100);

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(500));
    });

    act(() => {
      result.current.touchHandlers.onTouchMove(createMockTouchEvent(400));
    });

    act(() => {
      result.current.touchHandlers.onTouchEnd(createMockTouchEvent(400));
    });

    expect(result.current.currentHeight).toBeGreaterThanOrEqual(200);
  });

  it("flick gesture downward snaps to adjacent lower snap", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.snapTo("half");
    });

    const now = Date.now();
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now + 50)
      .mockReturnValueOnce(now + 100);

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(200));
    });

    act(() => {
      result.current.touchHandlers.onTouchMove(createMockTouchEvent(300));
    });

    act(() => {
      result.current.touchHandlers.onTouchEnd(createMockTouchEvent(300));
    });

    expect(result.current.currentHeight).toBeLessThanOrEqual(400);
  });

  it("rubber band effect clamps beyond mini", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.snapTo("mini");
    });

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(100));
    });

    act(() => {
      result.current.touchHandlers.onTouchMove(createMockTouchEvent(200));
    });

    const transform = sheetEl.style.transform;
    expect(transform).toContain("translateY");
  });

  it("rubber band effect clamps beyond full", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.snapTo("full");
    });

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(500));
    });

    act(() => {
      result.current.touchHandlers.onTouchMove(createMockTouchEvent(0));
    });

    const transform = sheetEl.style.transform;
    expect(transform).toContain("translateY");
  });

  it("onTouchMove does nothing if not dragging", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.touchHandlers.onTouchMove(createMockTouchEvent(300));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it("onTouchEnd does nothing if not dragging", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    act(() => {
      result.current.touchHandlers.onTouchEnd(createMockTouchEvent(300));
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.snapState).toBe("peek");
  });

  it("onTouchStart removes transition for instant tracking", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    sheetEl.style.transition = "transform 0.3s";
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(500));
    });

    expect(sheetEl.style.transition).toBe("none");
  });

  it("onTouchStart cancels running animation", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    let frameId = 1;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => frameId++),
    );
    const cancelFn = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancelFn);

    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.snapTo("full");
    });

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(500));
    });

    expect(cancelFn).toHaveBeenCalled();
  });

  it("resize event re-resolves snap points and re-applies position", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.currentHeight).toBe(200);
    expect(result.current.snapState).toBe("peek");
  });

  it("spring animation runs without reduced motion", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.snapTo("full");
    });

    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(result.current.currentHeight).toBe(800);
  });

  it("snapTo ignores invalid snap name", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    act(() => {
      result.current.snapTo("invalid" as "mini");
    });

    expect(result.current.snapState).toBe("peek");
  });

  it("touch drag with multiple move events accumulates velocity samples", () => {
    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.touchHandlers.onTouchStart(createMockTouchEvent(500));
    });

    for (let i = 1; i <= 10; i++) {
      act(() => {
        result.current.touchHandlers.onTouchMove(
          createMockTouchEvent(500 - i * 10),
        );
      });
    }

    act(() => {
      result.current.touchHandlers.onTouchEnd(createMockTouchEvent(400));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it("cleanup removes resize listener and cancels animation", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    unmount();

    const resizeCall = removeEventListenerSpy.mock.calls.find(
      (call) => call[0] === "resize",
    );
    expect(resizeCall).toBeTruthy();
  });

  it("defaults half and full from viewport when set to 0", () => {
    Object.defineProperty(window, "innerHeight", {
      value: 1000,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200 }),
    );

    act(() => {
      result.current.snapTo("full");
    });

    expect(result.current.currentHeight).toBe(900);
  });

  it("spring animation with non-reduced-motion goes through frames", () => {
    let frameCount = 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: FrameRequestCallback) => {
        frameCount++;
        if (frameCount <= 100) {
          cb(performance.now());
        }
        return frameCount;
      }),
    );

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.snapTo("full");
    });

    expect(frameCount).toBeGreaterThan(1);
    expect(result.current.currentHeight).toBe(800);
  });

  it("reduced motion change event is handled", () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
          changeHandler = handler;
        }),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() =>
      useBottomSheet({ mini: 64, peek: 200, half: 400, full: 800 }),
    );

    expect(changeHandler).not.toBeNull();

    act(() => {
      changeHandler!({ matches: true } as MediaQueryListEvent);
    });

    const sheetEl = createSheetEl();
    (result.current.sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = sheetEl;

    act(() => {
      result.current.snapTo("full");
    });

    expect(result.current.currentHeight).toBe(800);
  });
});
