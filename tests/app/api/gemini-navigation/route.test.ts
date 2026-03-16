import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerateText = vi.fn();

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

vi.mock("@ai-sdk/google", () => {
  const googleFn = (model: string) => ({ modelId: model });
  googleFn.tools = {
    googleMaps: () => ({ type: "google_maps" }),
  };
  return {
    google: googleFn,
    GoogleGenerativeAIProviderMetadata: {},
  };
});

async function callPOST(body: unknown): Promise<Response> {
  const { POST } = await import("@/app/api/gemini-navigation/route");
  return POST(
    new Request("http://localhost/api/gemini-navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/gemini-navigation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockGenerateText.mockReset();
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
  });

  it("returns 500 when GOOGLE_GENERATIVE_AI_API_KEY is not set", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");

    const res = await callPOST({
      query: "Where is the nearest polyclinic?",
      latitude: 1.3521,
      longitude: 103.8198,
    });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/GOOGLE_GENERATIVE_AI_API_KEY/);
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/gemini-navigation/route");
    const res = await POST(
      new Request("http://localhost/api/gemini-navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it("returns 400 when query is missing", async () => {
    const res = await callPOST({ latitude: 1.35, longitude: 103.82 });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/query/i);
  });

  it("returns 400 when query is not a string", async () => {
    const res = await callPOST({
      query: 123,
      latitude: 1.35,
      longitude: 103.82,
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when latitude is missing", async () => {
    const res = await callPOST({
      query: "Where is SGH?",
      longitude: 103.82,
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/latitude|longitude/i);
  });

  it("returns 400 when longitude is NaN", async () => {
    const res = await callPOST({
      query: "Find polyclinic",
      latitude: 1.35,
      longitude: NaN,
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when latitude is Infinity", async () => {
    const res = await callPOST({
      query: "Find polyclinic",
      latitude: Infinity,
      longitude: 103.82,
    });
    expect(res.status).toBe(400);
  });

  it("returns response with places from grounding metadata", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "The nearest polyclinic is Clementi Polyclinic.",
      providerMetadata: {
        google: {
          groundingMetadata: {
            groundingChunks: [
              {
                maps: {
                  placeId: "ChIJ_abc123",
                  title: "Clementi Polyclinic",
                  text: "451 Clementi Ave 3, Singapore 120451",
                  uri: "https://maps.google.com/maps?cid=123",
                },
              },
              {
                maps: {
                  placeId: "ChIJ_def456",
                  title: "Buona Vista Polyclinic",
                  text: "10 Buona Vista St, Singapore",
                  uri: "https://maps.google.com/maps?cid=456",
                },
              },
            ],
          },
          safetyRatings: null,
          urlContextMetadata: null,
        },
      },
    });

    const res = await callPOST({
      query: "Where is the nearest polyclinic?",
      latitude: 1.3148,
      longitude: 103.7654,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.response).toBe(
      "The nearest polyclinic is Clementi Polyclinic.",
    );
    expect(json.places).toHaveLength(2);
    expect(json.places[0]).toEqual({
      placeId: "ChIJ_abc123",
      name: "Clementi Polyclinic",
      address: "451 Clementi Ave 3, Singapore 120451",
      lat: null,
      lng: null,
    });
    expect(json.places[1]).toEqual({
      placeId: "ChIJ_def456",
      name: "Buona Vista Polyclinic",
      address: "10 Buona Vista St, Singapore",
      lat: null,
      lng: null,
    });
  });

  it("deduplicates places with the same placeId", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "SGH is nearby.",
      providerMetadata: {
        google: {
          groundingMetadata: {
            groundingChunks: [
              {
                maps: {
                  placeId: "ChIJ_sgh",
                  title: "Singapore General Hospital",
                  text: "Outram Road",
                },
              },
              {
                maps: {
                  placeId: "ChIJ_sgh",
                  title: "Singapore General Hospital",
                  text: "Outram Road",
                },
              },
            ],
          },
          safetyRatings: null,
          urlContextMetadata: null,
        },
      },
    });

    const res = await callPOST({
      query: "How to get to SGH?",
      latitude: 1.28,
      longitude: 103.84,
    });
    const json = await res.json();
    expect(json.places).toHaveLength(1);
  });

  it("returns empty places when no grounding chunks", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "I can help with directions.",
      providerMetadata: {
        google: {
          groundingMetadata: {
            groundingChunks: [],
          },
          safetyRatings: null,
          urlContextMetadata: null,
        },
      },
    });

    const res = await callPOST({
      query: "General question",
      latitude: 1.35,
      longitude: 103.82,
    });
    const json = await res.json();
    expect(json.places).toEqual([]);
  });

  it("returns empty places when grounding metadata is null", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "No grounding available.",
      providerMetadata: {
        google: {
          groundingMetadata: null,
          safetyRatings: null,
          urlContextMetadata: null,
        },
      },
    });

    const res = await callPOST({
      query: "Hello",
      latitude: 1.35,
      longitude: 103.82,
    });
    const json = await res.json();
    expect(json.places).toEqual([]);
  });

  it("skips web grounding chunks", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "Result with web chunk.",
      providerMetadata: {
        google: {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "https://example.com",
                  title: "A web result",
                },
              },
            ],
          },
          safetyRatings: null,
          urlContextMetadata: null,
        },
      },
    });

    const res = await callPOST({
      query: "Web query",
      latitude: 1.35,
      longitude: 103.82,
    });
    const json = await res.json();
    expect(json.places).toEqual([]);
  });

  it("passes system prompt and location to generateText", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "Response",
      providerMetadata: {},
    });

    await callPOST({
      query: "Find TTSH",
      latitude: 1.3215,
      longitude: 103.8456,
    });

    expect(mockGenerateText).toHaveBeenCalledOnce();
    const args = mockGenerateText.mock.calls[0][0];
    expect(args.system).toMatch(/elderly/i);
    expect(args.system).toMatch(/Singlish/i);
    expect(args.system).toMatch(/accessibility/i);
    expect(args.system).toMatch(/3 km\/h/);
    expect(args.system).toMatch(/polyclinic/i);
    expect(args.prompt).toBe("Find TTSH");
    expect(args.providerOptions.google.retrievalConfig.latLng).toEqual({
      latitude: 1.3215,
      longitude: 103.8456,
    });
    expect(args.tools).toHaveProperty("google_maps");
  });

  it("returns 502 when generateText throws", async () => {
    mockGenerateText.mockRejectedValueOnce(
      new Error("Gemini API quota exceeded"),
    );

    const res = await callPOST({
      query: "Find clinic",
      latitude: 1.35,
      longitude: 103.82,
    });
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Gemini API quota exceeded");
  });

  it("returns 502 with generic message for non-Error throws", async () => {
    mockGenerateText.mockRejectedValueOnce("string error");

    const res = await callPOST({
      query: "Find clinic",
      latitude: 1.35,
      longitude: 103.82,
    });
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Navigation request failed");
  });

  it("includes widgetContextToken when present", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "Found places.",
      providerMetadata: {
        google: {
          groundingMetadata: {
            groundingChunks: [],
            googleMapsWidgetContextToken: "ctx_token_123",
          },
          safetyRatings: null,
          urlContextMetadata: null,
        },
      },
    });

    const res = await callPOST({
      query: "Find nearby clinic",
      latitude: 1.35,
      longitude: 103.82,
    });
    const json = await res.json();
    expect(json.widgetContextToken).toBe("ctx_token_123");
  });

  it("omits widgetContextToken when not present", async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: "No token.",
      providerMetadata: {
        google: {
          groundingMetadata: {
            groundingChunks: [],
          },
          safetyRatings: null,
          urlContextMetadata: null,
        },
      },
    });

    const res = await callPOST({
      query: "General question",
      latitude: 1.35,
      longitude: 103.82,
    });
    const json = await res.json();
    expect(json).not.toHaveProperty("widgetContextToken");
  });
});
