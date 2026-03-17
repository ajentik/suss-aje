import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

function createMockMediaRecorder(autoStop = true) {
  const recorder = {
    start: vi.fn(),
    stop: vi.fn(),
    state: "recording" as string,
    ondataavailable: null as ((e: { data: Blob }) => void) | null,
    onstop: null as (() => void) | null,
    onerror: null as (() => void) | null,
  };

  if (autoStop) {
    recorder.stop = vi.fn().mockImplementation(() => {
      recorder.state = "inactive";
      recorder.onstop?.();
    });
  }

  return recorder;
}

function setupMediaRecorderGlobal(recorder: ReturnType<typeof createMockMediaRecorder>) {
  function MockMediaRecorder() {
    return recorder;
  }
  MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);
  vi.stubGlobal("MediaRecorder", MockMediaRecorder);
}

function setupNavigatorWithMic(shouldReject = false, rejectError?: Error) {
  const mockStream = {
    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
  };

  vi.stubGlobal("navigator", {
    ...navigator,
    mediaDevices: {
      getUserMedia: shouldReject
        ? vi.fn().mockRejectedValue(rejectError ?? new Error("Denied"))
        : vi.fn().mockResolvedValue(mockStream),
    },
  });

  return mockStream;
}

describe("useGoogleSpeechToText", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts with default state", async () => {
    const recorder = createMockMediaRecorder();
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic();

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.transcript).toBe("");
    expect(result.current.confidence).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("startRecording sets isRecording to true", async () => {
    const recorder = createMockMediaRecorder(false);
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic();

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(recorder.start).toHaveBeenCalled();
  });

  it("stopRecording stops the media recorder", async () => {
    const recorder = createMockMediaRecorder(false);
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic();

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
  });

  it("handles microphone access denied (NotAllowedError)", async () => {
    const recorder = createMockMediaRecorder();
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic(true, new DOMException("Permission denied", "NotAllowedError"));

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).toMatch(/microphone access denied/i);
    expect(result.current.isRecording).toBe(false);
  });

  it("handles generic microphone error", async () => {
    const recorder = createMockMediaRecorder();
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic(true, new Error("Device busy"));

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).toMatch(/could not access microphone/i);
    expect(result.current.isRecording).toBe(false);
  });

  it("sends audio to API and updates transcript on success", async () => {
    vi.useRealTimers();
    const recorder = createMockMediaRecorder();
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ transcript: "Hello lah", confidence: 0.95 }),
      }),
    );

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      recorder.ondataavailable?.({ data: new Blob(["audio"], { type: "audio/webm" }) });
    });

    await act(async () => {
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.transcript).toBe("Hello lah");
      expect(result.current.confidence).toBe(0.95);
      expect(result.current.error).toBeNull();
    });
  });

  it("sets error when API returns failure", async () => {
    vi.useRealTimers();
    const recorder = createMockMediaRecorder();
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      }),
    );

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.error).toMatch(/server error/i);
    });
  });

  it("sets error when API fetch throws", async () => {
    vi.useRealTimers();
    const recorder = createMockMediaRecorder();
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network fail")));

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.error).toMatch(/network fail/i);
    });
  });

  it("handles recorder error event", async () => {
    const recorder = createMockMediaRecorder(false);
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic();

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      recorder.onerror?.();
    });

    expect(result.current.error).toMatch(/recording failed/i);
    expect(result.current.isRecording).toBe(false);
  });

  it("auto-stops after silence timeout", async () => {
    const recorder = createMockMediaRecorder(false);
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic();

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText({ silenceTimeout: 5000 }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(recorder.stop).toHaveBeenCalled();
  });

  it("does not stop if already inactive", async () => {
    const recorder = createMockMediaRecorder();
    setupMediaRecorderGlobal(recorder);
    setupNavigatorWithMic();

    const { useGoogleSpeechToText } = await import("@/hooks/useGoogleSpeechToText");
    const { result } = renderHook(() => useGoogleSpeechToText());

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
  });
});
