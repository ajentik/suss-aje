import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechRecognition, getSttLang } from "@/lib/voice/speech-recognition";

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

function getInstance(mock: ReturnType<typeof createMockSpeechRecognition>, index = 0): MockRecognitionInstance {
  return mock.mock.instances[index] as unknown as MockRecognitionInstance;
}

describe("useSpeechRecognition", () => {
  let MockSpeechRecognition: ReturnType<typeof createMockSpeechRecognition>;

  beforeEach(() => {
    MockSpeechRecognition = createMockSpeechRecognition();
    vi.stubGlobal("SpeechRecognition", MockSpeechRecognition);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initialises with isListening false and empty transcript", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe("");
  });

  it("sets lang, interimResults, continuous on the recognition instance", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const onResult = vi.fn();

    act(() => {
      result.current.startListening(onResult);
    });

    const inst = getInstance(MockSpeechRecognition);
    expect(inst.lang).toBe("en-SG");
    expect(inst.interimResults).toBe(false);
    expect(inst.continuous).toBe(false);
  });

  it("uses the provided lang parameter", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const onResult = vi.fn();

    act(() => {
      result.current.startListening(onResult, undefined, "zh");
    });

    const inst = getInstance(MockSpeechRecognition);
    expect(inst.lang).toBe("zh");
  });

  it("calls recognition.start() and sets isListening to true", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const onResult = vi.fn();

    act(() => {
      result.current.startListening(onResult);
    });

    const inst = getInstance(MockSpeechRecognition);
    expect(inst.start).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(true);
  });

  it("fires onResult callback with transcript text on recognition result", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const onResult = vi.fn();

    act(() => {
      result.current.startListening(onResult);
    });

    const inst = getInstance(MockSpeechRecognition);

    act(() => {
      inst.onresult!({
        results: [[{ transcript: "Where is the library?" }]],
      });
    });

    expect(onResult).toHaveBeenCalledWith("Where is the library?");
    expect(result.current.transcript).toBe("Where is the library?");
  });

  it("sets isListening to false when recognition ends", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening(vi.fn());
    });

    expect(result.current.isListening).toBe(true);

    const inst = getInstance(MockSpeechRecognition);
    act(() => {
      inst.onend!();
    });

    expect(result.current.isListening).toBe(false);
  });

  it("calls onError with friendly message for 'not-allowed' error", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const onError = vi.fn();

    act(() => {
      result.current.startListening(vi.fn(), onError);
    });

    const inst = getInstance(MockSpeechRecognition);
    act(() => {
      inst.onerror!({ error: "not-allowed" });
    });

    expect(onError).toHaveBeenCalledWith(
      "Microphone access denied. Please allow microphone permissions."
    );
    expect(result.current.isListening).toBe(false);
  });

  it("calls onError with friendly message for 'no-speech' error", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const onError = vi.fn();

    act(() => {
      result.current.startListening(vi.fn(), onError);
    });

    const inst = getInstance(MockSpeechRecognition);
    act(() => {
      inst.onerror!({ error: "no-speech" });
    });

    expect(onError).toHaveBeenCalledWith(
      "No speech detected. Please try again."
    );
  });

  it("calls onError with generic message for unknown errors", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const onError = vi.fn();

    act(() => {
      result.current.startListening(vi.fn(), onError);
    });

    const inst = getInstance(MockSpeechRecognition);
    act(() => {
      inst.onerror!({ error: "network" });
    });

    expect(onError).toHaveBeenCalledWith(
      "Voice input failed. Please try again."
    );
  });

  it("stopListening calls recognition.stop() and sets isListening to false", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening(vi.fn());
    });

    const inst = getInstance(MockSpeechRecognition);

    act(() => {
      result.current.stopListening();
    });

    expect(inst.stop).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(false);
  });

  it("does not throw when SpeechRecognition is unavailable", () => {
    vi.stubGlobal("SpeechRecognition", undefined);
    vi.stubGlobal("webkitSpeechRecognition", undefined);

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening(vi.fn());
    });

    expect(result.current.isListening).toBe(false);
  });
});

describe("getSttLang", () => {
  it("returns en-US for english", () => {
    expect(getSttLang("english")).toBe("en-US");
  });

  it("returns en-SG for singlish", () => {
    expect(getSttLang("singlish")).toBe("en-SG");
  });

  it("returns zh for mandarin-mix", () => {
    expect(getSttLang("mandarin-mix")).toBe("zh");
  });
});
