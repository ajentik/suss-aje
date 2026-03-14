import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { computeWalkingRoute } from "@/lib/maps/route-utils";
import type { LatLng } from "@/lib/maps/route-utils";

const ORIGIN: LatLng = { lat: 1.3299, lng: 103.7764 };
const DESTINATION: LatLng = { lat: 1.3148, lng: 103.7649 };
const API_KEY = "test-api-key";

const MOCK_ROUTE_RESPONSE = {
  routes: [
    {
      polyline: {
        // Encodes roughly (1.33, 103.78) -> (1.31, 103.76)
        encodedPolyline: "_p~iF~ps|U_ulLnnqC",
      },
      distanceMeters: 1850,
      duration: "1380s",
      legs: [
        {
          steps: [
            {
              navigationInstruction: {
                instructions: "Head south on Clementi Road",
                maneuver: "DEPART",
              },
              distanceMeters: 500,
              staticDuration: "360s",
            },
            {
              navigationInstruction: {
                instructions: "Turn left onto Commonwealth Ave",
                maneuver: "TURN_LEFT",
              },
              distanceMeters: 800,
              staticDuration: "600s",
            },
            {
              // Step without navigationInstruction to test fallback
              distanceMeters: 550,
              staticDuration: "420s",
            },
          ],
        },
      ],
    },
  ],
};

describe("computeWalkingRoute", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends correct headers including X-Goog-Api-Key and X-Goog-FieldMask", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_ROUTE_RESPONSE),
    });

    await computeWalkingRoute(ORIGIN, DESTINATION, API_KEY);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://routes.googleapis.com/directions/v2:computeRoutes"
    );
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers["X-Goog-Api-Key"]).toBe(API_KEY);
    expect(options.headers["X-Goog-FieldMask"]).toContain(
      "routes.duration"
    );
    expect(options.headers["X-Goog-FieldMask"]).toContain(
      "routes.distanceMeters"
    );
    expect(options.headers["X-Goog-FieldMask"]).toContain(
      "routes.polyline.encodedPolyline"
    );
    expect(options.headers["X-Goog-FieldMask"]).toContain(
      "routes.legs.steps"
    );
  });

  it("sends correct request body with origin, destination, and travelMode WALK", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_ROUTE_RESPONSE),
    });

    await computeWalkingRoute(ORIGIN, DESTINATION, API_KEY);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.origin.location.latLng.latitude).toBe(ORIGIN.lat);
    expect(body.origin.location.latLng.longitude).toBe(ORIGIN.lng);
    expect(body.destination.location.latLng.latitude).toBe(DESTINATION.lat);
    expect(body.destination.location.latLng.longitude).toBe(DESTINATION.lng);
    expect(body.travelMode).toBe("WALK");
  });

  it("parses successful response into RouteResult with correct fields", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_ROUTE_RESPONSE),
    });

    const result = await computeWalkingRoute(ORIGIN, DESTINATION, API_KEY);

    expect(result).not.toBeNull();
    expect(result!.distanceMeters).toBe(1850);
    // 1380s / 60 = 23 min
    expect(result!.durationText).toBe("23 min walk");
    expect(Array.isArray(result!.polyline)).toBe(true);
    expect(result!.polyline.length).toBeGreaterThan(0);
    // Each polyline point should have lat/lng
    for (const point of result!.polyline) {
      expect(typeof point.lat).toBe("number");
      expect(typeof point.lng).toBe("number");
    }
  });

  it("parses RouteStep[] correctly from legs[0].steps", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_ROUTE_RESPONSE),
    });

    const result = await computeWalkingRoute(ORIGIN, DESTINATION, API_KEY);

    expect(result).not.toBeNull();
    expect(result!.steps).toHaveLength(3);

    // First step
    expect(result!.steps[0].instruction).toBe(
      "Head south on Clementi Road"
    );
    expect(result!.steps[0].distanceMeters).toBe(500);
    expect(result!.steps[0].durationText).toBe("6 min");
    expect(result!.steps[0].maneuver).toBe("DEPART");

    // Second step
    expect(result!.steps[1].instruction).toBe(
      "Turn left onto Commonwealth Ave"
    );
    expect(result!.steps[1].distanceMeters).toBe(800);
    expect(result!.steps[1].durationText).toBe("10 min");
    expect(result!.steps[1].maneuver).toBe("TURN_LEFT");

    // Third step — no navigationInstruction, should fallback
    expect(result!.steps[2].instruction).toBe("Continue walking");
    expect(result!.steps[2].distanceMeters).toBe(550);
    expect(result!.steps[2].durationText).toBe("7 min");
    expect(result!.steps[2].maneuver).toBeUndefined();
  });

  it("returns null when fetch response is not ok", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    const result = await computeWalkingRoute(ORIGIN, DESTINATION, API_KEY);
    expect(result).toBeNull();
  });

  it("returns null when routes array is empty", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ routes: [] }),
    });

    const result = await computeWalkingRoute(ORIGIN, DESTINATION, API_KEY);
    expect(result).toBeNull();
  });

  it("returns null when routes is undefined", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await computeWalkingRoute(ORIGIN, DESTINATION, API_KEY);
    expect(result).toBeNull();
  });

  it("returns null when fetch throws a network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const result = await computeWalkingRoute(ORIGIN, DESTINATION, API_KEY);
    expect(result).toBeNull();
  });

  it("handles steps with missing legs gracefully", async () => {
    const responseNoLegs = {
      routes: [
        {
          polyline: { encodedPolyline: "_p~iF~ps|U" },
          distanceMeters: 100,
          duration: "60s",
          // no legs field
        },
      ],
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseNoLegs),
    });

    const result = await computeWalkingRoute(ORIGIN, DESTINATION, API_KEY);
    expect(result).not.toBeNull();
    expect(result!.steps).toEqual([]);
  });
});
