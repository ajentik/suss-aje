import { describe, expect, it } from "vitest";

import { haversineDistance } from "@/lib/maps/geo-utils";

describe("haversineDistance", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistance(1.314, 103.764, 1.314, 103.764)).toBe(0);
  });

  it("calculates SUSS to Clementi MRT (~0.5 km)", () => {
    const d = haversineDistance(1.3147, 103.7653, 1.3151, 103.7654);
    expect(d).toBeGreaterThan(0.01);
    expect(d).toBeLessThan(1);
  });

  it("calculates Singapore CBD to JB Sentral (~21 km)", () => {
    const d = haversineDistance(1.2838, 103.8513, 1.4615, 103.7637);
    expect(d).toBeGreaterThan(18);
    expect(d).toBeLessThan(25);
  });

  it("is symmetric", () => {
    const d1 = haversineDistance(1.3, 103.8, 1.4, 103.9);
    const d2 = haversineDistance(1.4, 103.9, 1.3, 103.8);
    expect(d1).toBeCloseTo(d2, 10);
  });

  it("handles antipodal points (~20015 km)", () => {
    const d = haversineDistance(0, 0, 0, 180);
    expect(d).toBeGreaterThan(20000);
    expect(d).toBeLessThan(20100);
  });
});
