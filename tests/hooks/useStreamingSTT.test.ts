import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

interface MockMediaRecorder {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
}

interface MockMediaStreamTrack {
  stop: ReturnType<typeof vi.fn>;
}

let capturedRecorder: MockMediaRecorder | null = null;
let mockGetUserMedia: ReturnType<typeof vi.fn>;
const mockTracks: MockMediaStreamTrack[] = [];

function setupBrowserMocks(getUserMediaResult?: Promise<unknown>) {
  mockTracks.length = 0;
  mockTracks.push({ stop: vi.fn() });

  const mockStream = {
    getTracks: () => mockTracks as unknown as MediaStreamTrack[],
  };

  mockGetUserMedia = vi.fn().mockReturnValue(
    getUserMediaResult ?? Promise.resolve(mockStream),
  );

  Object.defineProperty(globalThis, "navigator", {
    value: {
      mediaDevices: { getUserMedia: mockGetUserMedia },
    },
    writable: true,
    configurable: true,
  });

  /* eslint-disable @typescript-eslint/no-this-alias */
  const MockMediaRecorderCtor = vi.fn(function (this: MockMediaRecorder) {
    this.start = vi.fn();
    this.stop = vi.fn();
    this.ondataavailable = null;
    this.onstop = null;
    capturedRecorder = this;
  });
  /* eslint-enable @typescript-eslint/no-this-alias */

  (MockMediaRecorderCtor as unknown as { isTypeSupported: (t: string) => boolean }).isTypeSupported =
    () => true;

  Object.defineProperty(globalThis, "MediaRecorder", {
    value: MockMediaRecorderCtor,
    writable: true,
    configurable: true,
  });
}

function createSSEResponse(events: Array<{ event: string; data: string }>) {
  const text = events
    .map((e) => `event: ${e.event}\ndata: ${e.data}\n\n`)
    .join("");
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("useStreamingSTT", () => {
  beforeEach(() => {
    vi.resetModules();
    capturedRecorder = null;
    setupBrowserMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initialises with default state", async () => {
    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.interimText).toBe("");
    expect(result.current.finalText).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("sets isStreaming to true when start() is called", async () => {
    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    expect(result.current.isStreaming).toBe(true);
  });

  it("sets error when mediaDevices is not available", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      writable: true,
      configurable: true,
    });

    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    expect(result.current.error).toBe(
      "Microphone access is not available in this browser.",
    );
    expect(result.current.isStreaming).toBe(false);
  });

  it("sets error when getUserMedia rejects", async () => {
    setupBrowserMocks(Promise.reject(new Error("Permission denied")));

    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Permission denied");
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it("creates MediaRecorder and starts recording after getUserMedia", async () => {
    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(capturedRecorder).not.toBeNull();
    });

    expect(capturedRecorder!.start).toHaveBeenCalled();
  });

  it("stop() stops the media recorder and tracks", async () => {
    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(capturedRecorder).not.toBeNull();
    });

    act(() => {
      result.current.stop();
    });

    expect(capturedRecorder!.stop).toHaveBeenCalled();
    expect(mockTracks[0].stop).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it("sends audio blob to /api/speech/stream on recorder stop", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createSSEResponse([
        {
          event: "transcript",
          data: JSON.stringify({
            transcript: "test",
            isFinal: true,
            stability: 1.0,
          }),
        },
        { event: "done", data: "{}" },
      ]),
    );

    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(capturedRecorder).not.toBeNull();
    });

    await act(async () => {
      capturedRecorder!.ondataavailable?.({
        data: new Blob(["fake-audio"], { type: "audio/webm" }),
      });
      capturedRecorder!.onstop?.();
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/speech/stream");
    expect((options as RequestInit).method).toBe("POST");

    fetchSpy.mockRestore();
  });

  it("parses final transcript events into finalText", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createSSEResponse([
        {
          event: "transcript",
          data: JSON.stringify({
            transcript: "hello world",
            isFinal: true,
            stability: 1.0,
          }),
        },
        { event: "done", data: "{}" },
      ]),
    );

    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(capturedRecorder).not.toBeNull();
    });

    await act(async () => {
      capturedRecorder!.onstop?.();
    });

    await waitFor(() => {
      expect(result.current.finalText).toBe("hello world");
    });

    expect(result.current.interimText).toBe("");

    vi.restoreAllMocks();
  });

  it("accumulates multiple final transcripts", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createSSEResponse([
        {
          event: "transcript",
          data: JSON.stringify({
            transcript: "hello",
            isFinal: true,
            stability: 1.0,
          }),
        },
        {
          event: "transcript",
          data: JSON.stringify({
            transcript: "world",
            isFinal: true,
            stability: 1.0,
          }),
        },
        { event: "done", data: "{}" },
      ]),
    );

    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(capturedRecorder).not.toBeNull();
    });

    await act(async () => {
      capturedRecorder!.onstop?.();
    });

    await waitFor(() => {
      expect(result.current.finalText).toBe("hello world");
    });

    vi.restoreAllMocks();
  });

  it("handles server error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Server failure" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(capturedRecorder).not.toBeNull();
    });

    await act(async () => {
      capturedRecorder!.onstop?.();
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Server failure");
    });

    expect(result.current.isStreaming).toBe(false);

    vi.restoreAllMocks();
  });

  it("handles SSE error events from the stream", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createSSEResponse([
        {
          event: "error",
          data: JSON.stringify({ error: "Recognition failed" }),
        },
      ]),
    );

    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(capturedRecorder).not.toBeNull();
    });

    await act(async () => {
      capturedRecorder!.onstop?.();
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Recognition failed");
    });

    vi.restoreAllMocks();
  });

  it("resets state when start() is called again", async () => {
    const { useStreamingSTT } = await import("@/hooks/useStreamingSTT");
    const { result } = renderHook(() => useStreamingSTT());

    act(() => {
      result.current.start();
    });

    expect(result.current.interimText).toBe("");
    expect(result.current.finalText).toBe("");
    expect(result.current.error).toBeNull();
  });
});
