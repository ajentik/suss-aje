import { describe, expect, it } from "vitest";
import {
  decodePolyline,
  encodePolyline,
  distanceBetween,
  isOnRoute,
  findNearestStep,
} from "@/utils/polylineDecode";
import type { NavigationStep } from "@/types/navigation";

describe("decodePolyline / encodePolyline", () => {
  it("decodes the Google polyline algorithm example correctly", () => {
    const encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    const points = decodePolyline(encoded);

    expect(points).toHaveLength(3);
    expect(points[0].lat).toBeCloseTo(38.5, 1);
    expect(points[0].lng).toBeCloseTo(-120.2, 1);
    expect(points[1].lat).toBeCloseTo(40.7, 1);
    expect(points[1].lng).toBeCloseTo(-120.95, 1);
    expect(points[2].lat).toBeCloseTo(43.252, 1);
    expect(points[2].lng).toBeCloseTo(-126.453, 1);
  });

  it("returns an empty array for an empty string", () => {
    expect(decodePolyline("")).toEqual([]);
  });

  it("roundtrips encode then decode", () => {
    const original = [
      { lat: 1.3521, lng: 103.8198 },
      { lat: 1.2966, lng: 103.7764 },
      { lat: 1.3, lng: 103.85 },
    ];

    const encoded = encodePolyline(original);
    const decoded = decodePolyline(encoded);

    expect(decoded).toHaveLength(original.length);
    for (let i = 0; i < original.length; i++) {
      expect(decoded[i].lat).toBeCloseTo(original[i].lat, 4);
      expect(decoded[i].lng).toBeCloseTo(original[i].lng, 4);
    }
  });

  it("roundtrips decode then encode", () => {
    const encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    const decoded = decodePolyline(encoded);
    const reEncoded = encodePolyline(decoded);
    const reDecoded = decodePolyline(reEncoded);

    expect(reDecoded).toHaveLength(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      expect(reDecoded[i].lat).toBeCloseTo(decoded[i].lat, 5);
      expect(reDecoded[i].lng).toBeCloseTo(decoded[i].lng, 5);
    }
  });
});

describe("distanceBetween (Haversine)", () => {
  it("returns 0 for the same point", () => {
    const p = { lat: 1.3521, lng: 103.8198 };
    expect(distanceBetween(p, p)).toBe(0);
  });

  it("calculates distance between SUSS campus and Clementi MRT (~1.2 km)", () => {
    const suss = { lat: 1.3299, lng: 103.7764 };
    const clementiMRT = { lat: 1.3151, lng: 103.7652 };
    const distance = distanceBetween(suss, clementiMRT);

    expect(distance).toBeGreaterThan(1_800);
    expect(distance).toBeLessThan(2_200);
  });

  it("calculates distance between Marina Bay Sands and Sentosa (~3.5 km)", () => {
    const mbs = { lat: 1.2834, lng: 103.8607 };
    const sentosa = { lat: 1.2494, lng: 103.8303 };
    const distance = distanceBetween(mbs, sentosa);

    expect(distance).toBeGreaterThan(4_600);
    expect(distance).toBeLessThan(5_200);
  });

  it("calculates distance between Changi Airport and Jurong East (~25 km)", () => {
    const changi = { lat: 1.3644, lng: 103.9915 };
    const jurongEast = { lat: 1.3329, lng: 103.7436 };
    const distance = distanceBetween(changi, jurongEast);

    expect(distance).toBeGreaterThan(27_000);
    expect(distance).toBeLessThan(28_000);
  });
});

describe("isOnRoute", () => {
  const routePath = [
    { lat: 1.3299, lng: 103.7764 },
    { lat: 1.3250, lng: 103.7720 },
    { lat: 1.3200, lng: 103.7680 },
    { lat: 1.3151, lng: 103.7652 },
  ];

  it("returns true for a position directly on the route", () => {
    expect(isOnRoute({ lat: 1.3250, lng: 103.7720 }, routePath, 50)).toBe(true);
  });

  it("returns true for a position within threshold", () => {
    const nearRoute = { lat: 1.3251, lng: 103.7721 };
    expect(isOnRoute(nearRoute, routePath, 50)).toBe(true);
  });

  it("returns false for a position far from the route", () => {
    const farAway = { lat: 1.3521, lng: 103.8198 };
    expect(isOnRoute(farAway, routePath, 50)).toBe(false);
  });

  it("returns false for an empty route", () => {
    expect(isOnRoute({ lat: 1.3299, lng: 103.7764 }, [], 50)).toBe(false);
  });
});

describe("findNearestStep", () => {
  const steps: NavigationStep[] = [
    {
      instruction: "Head south",
      distance: 500,
      duration: 360,
      maneuver: "DEPART",
      startLocation: { lat: 1.3299, lng: 103.7764 },
      endLocation: { lat: 1.3250, lng: 103.7720 },
    },
    {
      instruction: "Turn left",
      distance: 800,
      duration: 600,
      maneuver: "TURN_LEFT",
      startLocation: { lat: 1.3250, lng: 103.7720 },
      endLocation: { lat: 1.3200, lng: 103.7680 },
    },
    {
      instruction: "Continue straight",
      distance: 550,
      duration: 420,
      maneuver: "STRAIGHT",
      startLocation: { lat: 1.3200, lng: 103.7680 },
      endLocation: { lat: 1.3151, lng: 103.7652 },
    },
  ];

  it("finds the nearest step when position is at a step start", () => {
    const result = findNearestStep({ lat: 1.3250, lng: 103.7720 }, steps);
    expect(result.stepIndex).toBe(1);
    expect(result.distance).toBeCloseTo(0, 0);
  });

  it("finds the nearest step when position is between steps", () => {
    const between = { lat: 1.3225, lng: 103.7700 };
    const result = findNearestStep(between, steps);
    expect(result.stepIndex).toBe(1);
    expect(result.distance).toBeGreaterThan(0);
  });

  it("returns index 0 for a single-step array", () => {
    const result = findNearestStep({ lat: 1.35, lng: 103.8 }, [steps[0]]);
    expect(result.stepIndex).toBe(0);
  });
});
