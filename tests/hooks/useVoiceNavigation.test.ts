import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockSetRouteInfo = vi.fn();
let mockRouteInfo: ReturnType<typeof makeMockRouteInfo> | null = null;

function makeMockRouteInfo() {
  return {
    polyline: [
      { lat: 1.330, lng: 103.776 },
      { lat: 1.331, lng: 103.777 },
      { lat: 1.332, lng: 103.778 },
    ],
    distanceMeters: 300,
    duration: "4 min",
    steps: [
      {
        instruction: "Head north on Clementi Road",
        distanceMeters: 150,
        durationText: "2 min",
        maneuver: "STRAIGHT",
      },
      {
        instruction: "Turn left at the entrance",
        distanceMeters: 150,
        durationText: "2 min",
        maneuver: "TURN_LEFT",
      },
    ],
  };
}

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      routeInfo: mockRouteInfo,
      setRouteInfo: mockSetRouteInfo,
    }),
  ),
}));

interface MockUtterance {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";

describe("useVoiceNavigation", () => {
  let mockWatchPosition: ReturnType<typeof vi.fn>;
  let mockClearWatch: ReturnType<typeof vi.fn>;
  let mockSpeechCancel: ReturnType<typeof vi.fn>;
  let mockSpeechSpeak: ReturnType<typeof vi.fn>;
  let capturedUtterance: MockUtterance | null;
  let capturedPositionCallback: ((pos: GeolocationPosition) => void) | null;

  beforeEach(() => {
    mockRouteInfo = makeMockRouteInfo();
    capturedUtterance = null;
    capturedPositionCallback = null;

    mockWatchPosition = vi.fn((success) => {
      capturedPositionCallback = success;
      return 42;
    });
    mockClearWatch = vi.fn();

    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn(),
        watchPosition: mockWatchPosition,
        clearWatch: mockClearWatch,
      },
      writable: true,
      configurable: true,
    });

    mockSpeechCancel = vi.fn();
    mockSpeechSpeak = vi.fn((u: MockUtterance) => {
      capturedUtterance = u;
    });

    vi.stubGlobal("speechSynthesis", {
      cancel: mockSpeechCancel,
      speak: mockSpeechSpeak,
    });

    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn().mockImplementation(function (this: MockUtterance, text: string) {
        this.text = text;
        this.lang = "";
        this.rate = 1;
        this.pitch = 1;
        this.onstart = null;
        this.onend = null;
        this.onerror = null;
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useVoiceNavigation());
    expect(result.current.isNavigating).toBe(false);
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.distanceToNextMeters).toBe(0);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isOffRoute).toBe(false);
    expect(result.current.voiceMuted).toBe(false);
  });

  it("start() begins navigation and watches position", () => {
    const { result } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());

    expect(result.current.isNavigating).toBe(true);
    expect(mockWatchPosition).toHaveBeenCalledOnce();
    expect(mockWatchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true }),
    );
  });

  it("start() announces the first step instruction", () => {
    const { result } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());

    expect(mockSpeechSpeak).toHaveBeenCalledOnce();
    expect(capturedUtterance).not.toBeNull();
    expect(capturedUtterance!.text).toContain("Navigation started");
    expect(capturedUtterance!.text).toContain("Head north on Clementi Road");
    expect(capturedUtterance!.lang).toBe("en-SG");
  });

  it("start() does nothing without routeInfo", () => {
    mockRouteInfo = null;
    const { result } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());

    expect(result.current.isNavigating).toBe(false);
    expect(mockWatchPosition).not.toHaveBeenCalled();
  });

  it("stop() ends navigation and clears watch", () => {
    const { result } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());
    act(() => result.current.stop());

    expect(result.current.isNavigating).toBe(false);
    expect(result.current.currentStepIndex).toBe(0);
    expect(mockClearWatch).toHaveBeenCalledWith(42);
    expect(mockSpeechCancel).toHaveBeenCalled();
  });

  it("toggleMute() toggles voiceMuted state", () => {
    const { result } = renderHook(() => useVoiceNavigation());

    expect(result.current.voiceMuted).toBe(false);

    act(() => result.current.toggleMute());
    expect(result.current.voiceMuted).toBe(true);

    act(() => result.current.toggleMute());
    expect(result.current.voiceMuted).toBe(false);
  });

  it("toggleMute() cancels speech when muting", () => {
    const { result } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());
    mockSpeechCancel.mockClear();

    act(() => result.current.toggleMute());

    expect(result.current.voiceMuted).toBe(true);
    expect(mockSpeechCancel).toHaveBeenCalled();
  });

  it("updates distanceToNextMeters on position change", () => {
    const { result } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());

    expect(capturedPositionCallback).not.toBeNull();

    act(() => {
      capturedPositionCallback!({
        coords: { latitude: 1.3305, longitude: 103.7765 },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    expect(result.current.distanceToNextMeters).toBeGreaterThan(0);
  });

  it("cleans up geolocation watch on unmount", () => {
    const { result, unmount } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());
    unmount();

    expect(mockClearWatch).toHaveBeenCalledWith(42);
  });

  it("cancels speech synthesis on unmount", () => {
    const { result, unmount } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());
    mockSpeechCancel.mockClear();

    unmount();

    expect(mockSpeechCancel).toHaveBeenCalled();
  });

  it("sets isSpeaking true on utterance start", () => {
    const { result } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());

    expect(capturedUtterance).not.toBeNull();

    act(() => capturedUtterance!.onstart?.());

    expect(result.current.isSpeaking).toBe(true);
  });

  it("sets isSpeaking false on utterance end", () => {
    const { result } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());
    act(() => capturedUtterance!.onstart?.());
    act(() => capturedUtterance!.onend?.());

    expect(result.current.isSpeaking).toBe(false);
  });

  it("start() does nothing when geolocation API is unavailable", () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useVoiceNavigation());

    act(() => result.current.start());

    expect(result.current.isNavigating).toBe(false);
  });
});
