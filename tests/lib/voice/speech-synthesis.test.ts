import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockSetIsSpeaking = vi.fn();

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: { setIsSpeaking: typeof mockSetIsSpeaking }) => unknown) =>
    selector({ setIsSpeaking: mockSetIsSpeaking })
  ),
}));

import { useSpeechSynthesis } from "@/lib/voice/speech-synthesis";

interface MockUtterance {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

describe("useSpeechSynthesis", () => {
  let mockCancel: ReturnType<typeof vi.fn>;
  let mockSpeak: ReturnType<typeof vi.fn>;
  let capturedUtterance: MockUtterance | null;

  beforeEach(() => {
    mockCancel = vi.fn();
    mockSpeak = vi.fn().mockImplementation((u: MockUtterance) => {
      capturedUtterance = u;
    });
    capturedUtterance = null;

    vi.stubGlobal("speechSynthesis", {
      cancel: mockCancel,
      speak: mockSpeak,
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
      })
    );

    mockSetIsSpeaking.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("speak() cancels any current speech before speaking", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("Hello, welcome to SUSS");
    });

    expect(mockCancel).toHaveBeenCalledOnce();
    expect(mockSpeak).toHaveBeenCalledOnce();
  });

  it("speak() creates utterance with correct text and language", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("Navigate to the library");
    });

    expect(capturedUtterance).not.toBeNull();
    expect(capturedUtterance!.text).toBe("Navigate to the library");
    expect(capturedUtterance!.lang).toBe("en-SG");
    expect(capturedUtterance!.rate).toBe(1.0);
    expect(capturedUtterance!.pitch).toBe(1.0);
  });

  it("speak() sets isSpeaking true on utterance start", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("Test speech");
    });

    act(() => {
      capturedUtterance!.onstart?.();
    });

    expect(mockSetIsSpeaking).toHaveBeenCalledWith(true);
  });

  it("speak() sets isSpeaking false on utterance end", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("Test speech");
    });

    act(() => {
      capturedUtterance!.onend?.();
    });

    expect(mockSetIsSpeaking).toHaveBeenCalledWith(false);
  });

  it("speak() sets isSpeaking false on utterance error", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("Test speech");
    });

    act(() => {
      capturedUtterance!.onerror?.();
    });

    expect(mockSetIsSpeaking).toHaveBeenCalledWith(false);
  });

  it("stop() cancels synthesis and sets isSpeaking false", () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.stop();
    });

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSetIsSpeaking).toHaveBeenCalledWith(false);
  });

  it("speak() does nothing when window.speechSynthesis is unavailable", () => {
    vi.stubGlobal("speechSynthesis", undefined);

    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak("Hello");
    });

    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
