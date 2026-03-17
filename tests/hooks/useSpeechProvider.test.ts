import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

interface MockRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: unknown }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

function createMockSpeechRecognition() {
  return vi.fn().mockImplementation(function (this: MockRecognitionInstance) {
    this.lang = "";
    this.interimResults = false;
    this.continuous = false;
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
    this.start = vi.fn();
    this.stop = vi.fn();
  });
}

function getInstance(
  mock: ReturnType<typeof createMockSpeechRecognition>,
  index = 0,
): MockRecognitionInstance {
  return mock.mock.instances[index] as unknown as MockRecognitionInstance;
}

describe("useSpeechProvider", () => {
  let MockSpeechRecognition: ReturnType<typeof createMockSpeechRecognition>;

  beforeEach(() => {
    MockSpeechRecognition = createMockSpeechRecognition();
    vi.stubGlobal("SpeechRecognition", MockSpeechRecognition);
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initialises with default state", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe("");
    expect(result.current.confidence).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.provider).toBe("browser");
  });

  it("defaults to browser provider when no locale match", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    expect(result.current.provider).toBe("browser");
  });

  it('selects google provider when locale contains "sg"', async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-SG");
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    await vi.waitFor(() => {
      expect(result.current.provider).toBe("google");
    });
  });

  it('selects google provider when accent is "singlish"', async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() =>
      useSpeechProvider(undefined, "singlish"),
    );

    await vi.waitFor(() => {
      expect(result.current.provider).toBe("google");
    });
  });

  it("persists provider preference to localStorage", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-SG");
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    renderHook(() => useSpeechProvider());

    await vi.waitFor(() => {
      expect(localStorage.getItem("asksussi-stt-provider")).toBe("google");
    });
  });

  it("reads persisted provider from localStorage", async () => {
    localStorage.setItem("asksussi-stt-provider", "google");
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    await vi.waitFor(() => {
      expect(result.current.provider).toBe("google");
    });
  });

  it("starts browser recognition and sets isListening", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });

    const inst = getInstance(MockSpeechRecognition);
    expect(inst.start).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(true);
  });

  it("configures browser recognition with en-SG locale", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });

    const inst = getInstance(MockSpeechRecognition);
    expect(inst.lang).toBe("en-SG");
    expect(inst.interimResults).toBe(false);
    expect(inst.continuous).toBe(false);
  });

  it("updates transcript and confidence on browser recognition result", async () => {
    const onResult = vi.fn();
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider(onResult));

    act(() => {
      result.current.startListening();
    });

    const inst = getInstance(MockSpeechRecognition);

    act(() => {
      inst.onresult!({
        results: [[{ transcript: "hello campus", confidence: 0.95 }]],
      });
    });

    expect(result.current.transcript).toBe("hello campus");
    expect(result.current.confidence).toBe(0.95);
    expect(onResult).toHaveBeenCalledWith("hello campus");
  });

  it("sets confidence to 1 when browser result has no confidence", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });

    const inst = getInstance(MockSpeechRecognition);

    act(() => {
      inst.onresult!({
        results: [[{ transcript: "test" }]],
      });
    });

    expect(result.current.confidence).toBe(1);
  });

  it("stops browser recognition and sets isListening false", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });
    expect(result.current.isListening).toBe(true);

    const inst = getInstance(MockSpeechRecognition);

    act(() => {
      result.current.stopListening();
    });

    expect(inst.stop).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(false);
  });

  it("sets isListening false when browser recognition ends", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });
    expect(result.current.isListening).toBe(true);

    const inst = getInstance(MockSpeechRecognition);
    act(() => {
      inst.onend!();
    });

    expect(result.current.isListening).toBe(false);
  });

  it("sets error for not-allowed browser error", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });

    const inst = getInstance(MockSpeechRecognition);
    act(() => {
      inst.onerror!({ error: "not-allowed" });
    });

    expect(result.current.error).toBe(
      "Microphone access denied. Please allow microphone permissions.",
    );
    expect(result.current.isListening).toBe(false);
  });

  it("sets error for no-speech browser error", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });

    const inst = getInstance(MockSpeechRecognition);
    act(() => {
      inst.onerror!({ error: "no-speech" });
    });

    expect(result.current.error).toBe(
      "No speech detected. Please try again.",
    );
  });

  it("sets generic error for unknown browser errors", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });

    const inst = getInstance(MockSpeechRecognition);
    act(() => {
      inst.onerror!({ error: "network" });
    });

    expect(result.current.error).toBe("Voice input failed. Please try again.");
  });

  it("sets error when SpeechRecognition is unavailable", async () => {
    vi.stubGlobal("SpeechRecognition", undefined);
    vi.stubGlobal("webkitSpeechRecognition", undefined);

    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });

    expect(result.current.error).toBe(
      "Speech recognition is not supported in this browser.",
    );
    expect(result.current.isListening).toBe(false);
  });

  it("resets transcript and confidence on new startListening call", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });

    const inst = getInstance(MockSpeechRecognition);
    act(() => {
      inst.onresult!({
        results: [[{ transcript: "first", confidence: 0.8 }]],
      });
    });

    expect(result.current.transcript).toBe("first");

    act(() => {
      result.current.startListening();
    });

    expect(result.current.transcript).toBe("");
    expect(result.current.confidence).toBe(0);
  });

  it("clears error on startListening", async () => {
    vi.stubGlobal("SpeechRecognition", undefined);
    vi.stubGlobal("webkitSpeechRecognition", undefined);

    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    act(() => {
      result.current.startListening();
    });
    expect(result.current.error).not.toBeNull();

    vi.stubGlobal("SpeechRecognition", MockSpeechRecognition);

    act(() => {
      result.current.startListening();
    });

    expect(result.current.error).toBeNull();
  });

  it("returns correct interface shape", async () => {
    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    expect(result.current).toEqual(
      expect.objectContaining({
        isListening: expect.any(Boolean),
        transcript: expect.any(String),
        confidence: expect.any(Number),
        error: null,
        provider: expect.stringMatching(/^(browser|google)$/),
        startListening: expect.any(Function),
        stopListening: expect.any(Function),
      }),
    );
  });

  it("starts google recognition with MediaRecorder", async () => {
    localStorage.setItem("asksussi-stt-provider", "google");
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
    };
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });

    const startFn = vi.fn();
    const stopFn = vi.fn();

    function MockMediaRecorder(this: Record<string, unknown>) {
      this.ondataavailable = null;
      this.onstop = null;
      this.start = startFn;
      this.stop = stopFn;
    }
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);

    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    await act(async () => {
      result.current.startListening();
    });

    await vi.waitFor(() => {
      expect(startFn).toHaveBeenCalled();
    });

    expect(result.current.isListening).toBe(true);
  });

  it("stops google recognition by stopping MediaRecorder", async () => {
    localStorage.setItem("asksussi-stt-provider", "google");
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
    };
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });

    const startFn = vi.fn();
    const stopFn = vi.fn();

    function MockMediaRecorder(this: Record<string, unknown>) {
      this.ondataavailable = null;
      this.onstop = null;
      this.start = startFn;
      this.stop = stopFn;
    }
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);

    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    await act(async () => {
      result.current.startListening();
    });

    await vi.waitFor(() => {
      expect(startFn).toHaveBeenCalled();
    });

    act(() => {
      result.current.stopListening();
    });

    expect(stopFn).toHaveBeenCalled();
  });

  it("handles google mic permission denied", async () => {
    localStorage.setItem("asksussi-stt-provider", "google");
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
      writable: true,
      configurable: true,
    });

    const { useSpeechProvider } = await import("@/hooks/useSpeechProvider");
    const { result } = renderHook(() => useSpeechProvider());

    await act(async () => {
      result.current.startListening();
    });

    await vi.waitFor(() => {
      expect(result.current.error).toBe(
        "Microphone access denied. Please allow microphone permissions.",
      );
      expect(result.current.isListening).toBe(false);
    });
  });
});
