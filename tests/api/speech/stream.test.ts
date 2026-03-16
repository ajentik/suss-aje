import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockWrite = vi.fn();
const mockEnd = vi.fn();
const mockClose = vi.fn().mockResolvedValue(undefined);

let preloadedResponses: unknown[] = [];

function createMockRecognizeStream() {
  const responses = [...preloadedResponses];
  let endCalled = false;
  let waitingResolve: ((val: IteratorResult<unknown>) => void) | null = null;

  const stream = {
    write: mockWrite,
    end: vi.fn(() => {
      mockEnd();
      endCalled = true;
      if (waitingResolve) {
        const r = waitingResolve;
        waitingResolve = null;
        r({ done: true, value: undefined });
      }
    }),
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<unknown>> {
          if (responses.length > 0) {
            return Promise.resolve({ done: false, value: responses.shift() });
          }
          if (endCalled) {
            return Promise.resolve({ done: true, value: undefined });
          }
          return new Promise((resolve) => {
            waitingResolve = resolve;
          });
        },
      };
    },
  };

  return stream;
}

vi.mock("@google-cloud/speech", () => ({
  SpeechClient: class MockSpeechClient {
    _streamingRecognize() {
      return createMockRecognizeStream();
    }
    close() {
      return mockClose();
    }
  },
}));

describe("POST /api/speech/stream", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GOOGLE_CLOUD_PROJECT = "test-project";
    process.env.SPEECH_REGION = "us-central1";
    mockWrite.mockClear();
    mockEnd.mockClear();
    mockClose.mockClear();
    preloadedResponses = [];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  async function importRoute() {
    vi.resetModules();
    return import("@/app/api/speech/stream/route");
  }

  async function drainResponse(res: Response): Promise<string> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    return text;
  }

  it("returns 500 when GOOGLE_CLOUD_PROJECT is not set", async () => {
    process.env.GOOGLE_CLOUD_PROJECT = "";
    const { POST } = await importRoute();

    const req = new Request("http://localhost/api/speech/stream", {
      method: "POST",
      body: new ArrayBuffer(100),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe("GOOGLE_CLOUD_PROJECT not configured");
  });

  it("returns 400 when audio body is empty", async () => {
    const { POST } = await importRoute();

    const req = new Request("http://localhost/api/speech/stream", {
      method: "POST",
      body: new ArrayBuffer(0),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe("Empty audio body");
  });

  it("returns SSE response with correct headers", async () => {
    const { POST } = await importRoute();

    const audio = new Uint8Array(100).buffer;
    const req = new Request("http://localhost/api/speech/stream", {
      method: "POST",
      body: audio,
    });

    const res = await POST(req);

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");

    await drainResponse(res);
  });

  it("writes config request with chirp_2 model and en-SG locale", async () => {
    const { POST } = await importRoute();

    const audio = new Uint8Array(10).buffer;
    const req = new Request("http://localhost/api/speech/stream", {
      method: "POST",
      body: audio,
    });

    const res = await POST(req);
    await drainResponse(res);

    expect(mockWrite).toHaveBeenCalled();

    const configCall = mockWrite.mock.calls[0][0];
    expect(configCall.recognizer).toContain("test-project");
    expect(configCall.recognizer).toContain("us-central1");
    expect(configCall.streamingConfig.config.model).toBe("chirp_2");
    expect(configCall.streamingConfig.config.languageCodes).toEqual(["en-SG"]);
    expect(
      configCall.streamingConfig.streamingFeatures.interimResults,
    ).toBe(true);
  });

  it("includes adaptation phrases in the config", async () => {
    const { POST } = await importRoute();

    const audio = new Uint8Array(10).buffer;
    const req = new Request("http://localhost/api/speech/stream", {
      method: "POST",
      body: audio,
    });

    const res = await POST(req);
    await drainResponse(res);

    const configCall = mockWrite.mock.calls[0][0];
    const phrases =
      configCall.streamingConfig.config.adaptation.phraseSets[0]
        .inlinePhraseSet.phrases;

    expect(phrases.length).toBeGreaterThan(0);

    const sussPhrase = phrases.find(
      (p: { value: string }) => p.value === "SUSS",
    );
    expect(sussPhrase).toBeDefined();
    expect(sussPhrase.boost).toBe(20);
  });

  it("chunks audio at 25KB boundaries", async () => {
    const { POST } = await importRoute();

    const audio = new Uint8Array(60_000).buffer;
    const req = new Request("http://localhost/api/speech/stream", {
      method: "POST",
      body: audio,
    });

    const res = await POST(req);
    await drainResponse(res);

    const audioWrites = mockWrite.mock.calls.slice(1);
    expect(audioWrites.length).toBe(3);
    expect(audioWrites[0][0].audio.length).toBe(25_000);
    expect(audioWrites[1][0].audio.length).toBe(25_000);
    expect(audioWrites[2][0].audio.length).toBe(10_000);
  });

  it("streams transcript events from gRPC responses", async () => {
    preloadedResponses = [
      {
        results: [
          {
            alternatives: [{ transcript: "hello world" }],
            isFinal: true,
            stability: 1.0,
          },
        ],
      },
    ];

    const { POST } = await importRoute();

    const audio = new Uint8Array(10).buffer;
    const req = new Request("http://localhost/api/speech/stream", {
      method: "POST",
      body: audio,
    });

    const res = await POST(req);
    const text = await drainResponse(res);

    expect(text).toContain("event: transcript");
    expect(text).toContain('"transcript":"hello world"');
    expect(text).toContain('"isFinal":true');
    expect(text).toContain("event: done");
  });

  it("calls client.close() after streaming completes", async () => {
    const { POST } = await importRoute();

    const audio = new Uint8Array(10).buffer;
    const req = new Request("http://localhost/api/speech/stream", {
      method: "POST",
      body: audio,
    });

    const res = await POST(req);
    await drainResponse(res);

    expect(mockClose).toHaveBeenCalled();
  });
});
