import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGIN = { lat: 1.3299, lng: 103.7764 };
const DESTINATION_LATLNG = { lat: 1.3148, lng: 103.7649 };
const DESTINATION_PLACE_ID = { placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4" };

const MOCK_ROUTE = {
  polyline: { encodedPolyline: "_p~iF~ps|U_ulLnnqC" },
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
            instructions: "Take the stairs to level 2",
            maneuver: "TURN_LEFT",
          },
          distanceMeters: 50,
          staticDuration: "60s",
        },
        {
          distanceMeters: 300,
          staticDuration: "240s",
        },
      ],
    },
  ],
};

const MOCK_ALT_ROUTE = {
  polyline: { encodedPolyline: "_p~iF~ps|U" },
  distanceMeters: 2100,
  duration: "1560s",
  legs: [
    {
      steps: [
        {
          navigationInstruction: {
            instructions: "Head north via ramp",
            maneuver: "DEPART",
          },
          distanceMeters: 2100,
          staticDuration: "1560s",
        },
      ],
    },
  ],
};

const MOCK_RESPONSE_SINGLE = { routes: [MOCK_ROUTE] };
const MOCK_RESPONSE_ALTERNATIVES = { routes: [MOCK_ROUTE, MOCK_ALT_ROUTE] };

let fetchMock: ReturnType<typeof vi.fn>;

function mockFetchOk(data: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status: number, text: string) {
  fetchMock.mockResolvedValueOnce({
    ok: false,
    status,
    text: () => Promise.resolve(text),
  });
}

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
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-api-key");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validation", () => {
    it("returns 500 when API key is missing", async () => {
      vi.stubEnv("GOOGLE_MAPS_API_KEY", "");

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toMatch(/GOOGLE_MAPS_API_KEY/);
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
      const json = await res.json();
      expect(json.error).toMatch(/Invalid JSON/);
    });

    it("returns 400 when origin has non-numeric lat", async () => {
      const res = await callPOST({
        origin: { lat: "bad", lng: 103.77 },
        destination: DESTINATION_LATLNG,
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/origin/);
    });

    it("returns 400 when origin is missing", async () => {
      const res = await callPOST({ destination: DESTINATION_LATLNG });
      expect(res.status).toBe(400);
    });

    it("returns 400 when destination is missing", async () => {
      const res = await callPOST({ origin: ORIGIN });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/destination is required/);
    });

    it("returns 400 when destination has neither lat/lng nor placeId", async () => {
      const res = await callPOST({
        origin: ORIGIN,
        destination: { foo: "bar" },
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/placeId/);
    });

    it("returns 400 when destination lat is NaN", async () => {
      const res = await callPOST({
        origin: ORIGIN,
        destination: { lat: NaN, lng: 103.77 },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("destination types", () => {
    it("accepts lat/lng destination and builds correct waypoint", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      expect(res.status).toBe(200);

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.destination.location.latLng).toEqual({
        latitude: DESTINATION_LATLNG.lat,
        longitude: DESTINATION_LATLNG.lng,
      });
    });

    it("accepts placeId destination and builds correct waypoint", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_PLACE_ID,
      });
      expect(res.status).toBe(200);

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.destination.placeId).toBe(DESTINATION_PLACE_ID.placeId);
      expect(requestBody.destination.location).toBeUndefined();
    });
  });

  describe("alternative routes", () => {
    it("sends computeAlternativeRoutes: true to Google API", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.computeAlternativeRoutes).toBe(true);
    });

    it("returns multiple routes when alternatives are available", async () => {
      mockFetchOk(MOCK_RESPONSE_ALTERNATIVES);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      expect(json.routes).toHaveLength(2);
    });
  });

  describe("mobility levels", () => {
    it("defaults to normal when mobilityLevel is not provided", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      expect(json.mobilityLevel).toBe("normal");
      expect(json.routes[0].mobilityAdjustedDurationSeconds).toBe(
        json.routes[0].totalDurationSeconds,
      );
    });

    it("applies 1.8x multiplier for slow mobility", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
        mobilityLevel: "slow",
      });
      const json = await res.json();
      expect(json.mobilityLevel).toBe("slow");
      expect(json.routes[0].mobilityAdjustedDurationSeconds).toBe(
        Math.ceil(1380 * 1.8),
      );
    });

    it("applies 3x multiplier for walker mobility", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
        mobilityLevel: "walker",
      });
      const json = await res.json();
      expect(json.mobilityLevel).toBe("walker");
      expect(json.routes[0].mobilityAdjustedDurationSeconds).toBe(
        Math.ceil(1380 * 3),
      );
    });

    it("applies 1.5x multiplier for wheelchair mobility", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
        mobilityLevel: "wheelchair",
      });
      const json = await res.json();
      expect(json.mobilityLevel).toBe("wheelchair");
      expect(json.routes[0].mobilityAdjustedDurationSeconds).toBe(
        Math.ceil(1380 * 1.5),
      );
    });

    it("falls back to normal for invalid mobilityLevel", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
        mobilityLevel: "flying",
      });
      const json = await res.json();
      expect(json.mobilityLevel).toBe("normal");
    });
  });

  describe("wheelchair route modifiers", () => {
    it("sends avoidStairs route modifier for wheelchair", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
        mobilityLevel: "wheelchair",
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.routeModifiers).toEqual({ avoidStairs: true });
    });

    it("does not send routeModifiers for non-wheelchair mobility", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
        mobilityLevel: "slow",
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.routeModifiers).toBeUndefined();
    });
  });

  describe("response parsing", () => {
    it("parses route with correct structure", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      const route = json.routes[0];

      expect(route.polyline).toBe("_p~iF~ps|U_ulLnnqC");
      expect(route.totalDistanceMeters).toBe(1850);
      expect(route.totalDurationSeconds).toBe(1380);
      expect(route.steps).toHaveLength(3);
    });

    it("parses steps with instruction, distance, duration, and maneuver", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      const steps = json.routes[0].steps;

      expect(steps[0].instruction).toBe("Head south on Clementi Road");
      expect(steps[0].distanceMeters).toBe(500);
      expect(steps[0].durationSeconds).toBe(360);
      expect(steps[0].maneuver).toBe("DEPART");
      expect(steps[0].hasStairs).toBe(false);
    });

    it("defaults instruction to 'Continue walking' when missing", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      const lastStep = json.routes[0].steps[2];

      expect(lastStep.instruction).toBe("Continue walking");
      expect(lastStep.maneuver).toBeUndefined();
    });

    it("handles empty routes array", async () => {
      mockFetchOk({ routes: [] });

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      expect(json.routes).toEqual([]);
    });

    it("handles missing routes key", async () => {
      mockFetchOk({});

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      expect(json.routes).toEqual([]);
    });

    it("handles route without legs", async () => {
      mockFetchOk({
        routes: [
          {
            polyline: { encodedPolyline: "_p~iF~ps|U" },
            distanceMeters: 100,
            duration: "60s",
          },
        ],
      });

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      expect(json.routes[0].steps).toEqual([]);
      expect(json.routes[0].totalDistanceMeters).toBe(100);
    });
  });

  describe("stairs detection", () => {
    it("flags route with stairs based on instruction text", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      const route = json.routes[0];

      expect(route.hasStairs).toBe(true);
      expect(route.steps[1].hasStairs).toBe(true);
      expect(route.steps[0].hasStairs).toBe(false);
    });

    it("flags route without stairs as hasStairs: false", async () => {
      mockFetchOk(MOCK_RESPONSE_ALTERNATIVES);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();

      expect(json.routes[1].hasStairs).toBe(false);
    });

    it("detects stairs from travelAdvisory", async () => {
      const routeWithAdvisory = {
        routes: [
          {
            polyline: { encodedPolyline: "_p~iF~ps|U" },
            distanceMeters: 200,
            duration: "120s",
            legs: [
              {
                steps: [
                  {
                    navigationInstruction: { instructions: "Walk straight" },
                    distanceMeters: 200,
                    staticDuration: "120s",
                    travelAdvisory: { note: "Use staircase B" },
                  },
                ],
              },
            ],
          },
        ],
      };

      mockFetchOk(routeWithAdvisory);

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      const json = await res.json();
      expect(json.routes[0].hasStairs).toBe(true);
    });
  });

  describe("no campus bounds restriction", () => {
    it("accepts coordinates outside the old SUSS campus bounds", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      const res = await callPOST({
        origin: { lat: 1.29, lng: 103.85 },
        destination: { lat: 1.40, lng: 103.90 },
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Google API errors", () => {
    it("forwards Google API error status", async () => {
      mockFetchError(403, "Forbidden");

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Routes API error/);
      expect(json.detail).toBe("Forbidden");
    });

    it("returns 502 when fetch throws", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const res = await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });
      expect(res.status).toBe(502);
    });
  });

  describe("request construction", () => {
    it("sends correct headers with API key", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
      );
      expect(options.headers["X-Goog-Api-Key"]).toBe("test-api-key");
      expect(options.headers["X-Goog-FieldMask"]).toContain("routes.duration");
    });

    it("sets travelMode to WALK", async () => {
      mockFetchOk(MOCK_RESPONSE_SINGLE);

      await callPOST({
        origin: ORIGIN,
        destination: DESTINATION_LATLNG,
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.travelMode).toBe("WALK");
    });
  });
});
