import { describe, it, expect, vi, beforeEach } from "vitest";

const VALID_CREDENTIALS = JSON.stringify({
  type: "service_account",
  project_id: "test-project",
  client_email: "test@test.iam.gserviceaccount.com",
  private_key:
    "-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----\n",
});

const mockRecognize = vi.fn();

vi.mock("@google-cloud/speech", () => ({
  v2: {
    SpeechClient: function MockSpeechClient() {
      return { recognize: mockRecognize };
    },
  },
}));

async function callPOST(body: unknown): Promise<Response> {
  const { POST } = await import("@/app/api/speech/route");
  return POST(
    new Request("http://localhost/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/speech", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockRecognize.mockReset();
    vi.stubEnv("GOOGLE_CLOUD_STT_CREDENTIALS", VALID_CREDENTIALS);
  });

  it("returns 500 when no credentials are configured", async () => {
    vi.stubEnv("GOOGLE_CLOUD_STT_CREDENTIALS", "");
    vi.stubEnv("GOOGLE_APPLICATION_CREDENTIALS", "");

    const res = await callPOST({ audio: "dGVzdA==" });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/credentials/i);
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/speech/route");
    const res = await POST(
      new Request("http://localhost/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it("returns 400 when audio field is missing", async () => {
    const res = await callPOST({});
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/audio/i);
  });

  it("returns 400 when audio field is not a string", async () => {
    const res = await callPOST({ audio: 123 });
    expect(res.status).toBe(400);
  });

  it("returns 413 when audio exceeds size limit", async () => {
    const hugeAudio = "A".repeat(10 * 1024 * 1024 + 1);
    const res = await callPOST({ audio: hugeAudio });
    expect(res.status).toBe(413);
  });

  it("returns transcript from successful recognition", async () => {
    mockRecognize.mockResolvedValueOnce([
      {
        results: [
          {
            alternatives: [{ transcript: "Hello lah", confidence: 0.95 }],
            languageCode: "en-SG",
          },
        ],
      },
    ]);

    const res = await callPOST({ audio: "dGVzdA==" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      transcript: "Hello lah",
      confidence: 0.95,
      languageCode: "en-SG",
    });
  });

  it("returns empty transcript when no results", async () => {
    mockRecognize.mockResolvedValueOnce([{ results: [] }]);

    const res = await callPOST({ audio: "dGVzdA==" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      transcript: "",
      confidence: 0,
      languageCode: "en-SG",
    });
  });

  it("passes chirp_2 model and en-SG in config", async () => {
    mockRecognize.mockResolvedValueOnce([{ results: [] }]);

    await callPOST({ audio: "dGVzdA==" });

    expect(mockRecognize).toHaveBeenCalledOnce();
    const arg = mockRecognize.mock.calls[0][0];
    expect(arg.config.model).toBe("chirp_2");
    expect(arg.config.languageCodes).toContain("en-SG");
    expect(arg.config.languageCodes).toContain("en-US");
    expect(arg.config.languageCodes).toContain("zh");
  });

  it("enables automatic punctuation and disables spoken punctuation", async () => {
    mockRecognize.mockResolvedValueOnce([{ results: [] }]);

    await callPOST({ audio: "dGVzdA==" });

    const arg = mockRecognize.mock.calls[0][0];
    expect(arg.config.features.enableAutomaticPunctuation).toBe(true);
    expect(arg.config.features.enableSpokenPunctuation).toBe(false);
  });

  it("uses custom languageCode when provided", async () => {
    mockRecognize.mockResolvedValueOnce([{ results: [] }]);

    await callPOST({ audio: "dGVzdA==", languageCode: "ms-MY" });

    const arg = mockRecognize.mock.calls[0][0];
    expect(arg.config.languageCodes).toContain("ms-MY");
  });

  it("deduplicates language codes", async () => {
    mockRecognize.mockResolvedValueOnce([{ results: [] }]);

    await callPOST({ audio: "dGVzdA==", languageCode: "en-US" });

    const arg = mockRecognize.mock.calls[0][0];
    const enUSCount = arg.config.languageCodes.filter(
      (c: string) => c === "en-US",
    ).length;
    expect(enUSCount).toBe(1);
  });

  it("maps gRPC INVALID_ARGUMENT (3) to HTTP 400", async () => {
    const err = new Error("bad request");
    (err as Error & { code: number }).code = 3;
    mockRecognize.mockRejectedValueOnce(err);

    const res = await callPOST({ audio: "dGVzdA==" });
    expect(res.status).toBe(400);
  });

  it("maps gRPC PERMISSION_DENIED (7) to HTTP 403", async () => {
    const err = new Error("forbidden");
    (err as Error & { code: number }).code = 7;
    mockRecognize.mockRejectedValueOnce(err);

    const res = await callPOST({ audio: "dGVzdA==" });
    expect(res.status).toBe(403);
  });

  it("maps gRPC RESOURCE_EXHAUSTED (8) to HTTP 429", async () => {
    const err = new Error("quota");
    (err as Error & { code: number }).code = 8;
    mockRecognize.mockRejectedValueOnce(err);

    const res = await callPOST({ audio: "dGVzdA==" });
    expect(res.status).toBe(429);
  });

  it("returns 500 for unknown errors", async () => {
    mockRecognize.mockRejectedValueOnce(new Error("unexpected"));

    const res = await callPOST({ audio: "dGVzdA==" });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("unexpected");
  });

  it("sets recognizer path from project ID", async () => {
    mockRecognize.mockResolvedValueOnce([{ results: [] }]);

    await callPOST({ audio: "dGVzdA==" });

    const arg = mockRecognize.mock.calls[0][0];
    expect(arg.recognizer).toBe(
      "projects/test-project/locations/global/recognizers/_",
    );
  });
});
