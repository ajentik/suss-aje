import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
  },
}));

async function callPOST(body: unknown): Promise<Response> {
  const { POST } = await import("@/app/api/route/route");
  return POST(
    new Request("http://localhost/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
  });

  it("returns 500 when GOOGLE_MAPS_API_KEY is not set", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");

    const res = await callPOST({
      origin: { lat: 1.33, lng: 103.77 },
      destination: { lat: 1.32, lng: 103.76 },
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/GOOGLE_MAPS_API_KEY/i);
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/route/route");
    const res = await POST(
      new Request("http://localhost/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when origin is missing", async () => {
    const res = await callPOST({
      destination: { lat: 1.33, lng: 103.77 },
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/lat|lng/i);
  });

  it("returns 400 when destination is missing", async () => {
    const res = await callPOST({
      origin: { lat: 1.33, lng: 103.77 },
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 when coordinates are NaN", async () => {
    const res = await callPOST({
      origin: { lat: NaN, lng: 103.77 },
      destination: { lat: 1.33, lng: 103.77 },
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 when coordinates are Infinity", async () => {
    const res = await callPOST({
      origin: { lat: Infinity, lng: 103.77 },
      destination: { lat: 1.33, lng: 103.77 },
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 when coordinates are outside campus bounds", async () => {
    const res = await callPOST({
      origin: { lat: 2.0, lng: 104.0 },
      destination: { lat: 1.33, lng: 103.77 },
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/campus area/i);
  });

  it("returns route data on success", async () => {
    const routeData = {
      routes: [
        {
          duration: "300s",
          distanceMeters: 500,
          polyline: { encodedPolyline: "test" },
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(routeData),
      }),
    );

    const res = await callPOST({
      origin: { lat: 1.33, lng: 103.77 },
      destination: { lat: 1.32, lng: 103.76 },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.routes).toHaveLength(1);
  });

  it("returns error status when Routes API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("Forbidden"),
      }),
    );

    const res = await callPOST({
      origin: { lat: 1.33, lng: 103.77 },
      destination: { lat: 1.32, lng: 103.76 },
    });

    expect(res.status).toBe(403);
  });

  it("returns 502 when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network down")));

    const res = await callPOST({
      origin: { lat: 1.33, lng: 103.77 },
      destination: { lat: 1.32, lng: 103.76 },
    });

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/failed to reach/i);
  });

  it("calls Routes API with correct parameters", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ routes: [] }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await callPOST({
      origin: { lat: 1.33, lng: 103.77 },
      destination: { lat: 1.32, lng: 103.76 },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Goog-Api-Key": "test-key",
        }),
      }),
    );

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.travelMode).toBe("WALK");
  });
});
