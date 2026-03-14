import { describe, expect, it } from "vitest";
import {
  CAMPUS_CENTER,
  CAMPUS_POIS,
  findPOI,
  findPOIs,
} from "@/lib/maps/campus-pois";

describe("CAMPUS_CENTER", () => {
  it("has valid lat/lng coordinates", () => {
    expect(CAMPUS_CENTER.lat).toBeGreaterThan(1);
    expect(CAMPUS_CENTER.lat).toBeLessThan(2);
    expect(CAMPUS_CENTER.lng).toBeGreaterThan(103);
    expect(CAMPUS_CENTER.lng).toBeLessThan(104);
  });
});

describe("CAMPUS_POIS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(CAMPUS_POIS)).toBe(true);
    expect(CAMPUS_POIS.length).toBeGreaterThan(30);
  });

  it("every POI has required fields", () => {
    for (const poi of CAMPUS_POIS) {
      expect(typeof poi.id).toBe("string");
      expect(poi.id.length).toBeGreaterThan(0);
      expect(typeof poi.name).toBe("string");
      expect(poi.name.length).toBeGreaterThan(0);
      expect(typeof poi.lat).toBe("number");
      expect(typeof poi.lng).toBe("number");
      expect(typeof poi.category).toBe("string");
      expect(typeof poi.description).toBe("string");
    }
  });

  it("all POI ids are unique", () => {
    const ids = CAMPUS_POIS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all coordinates are valid", () => {
    for (const poi of CAMPUS_POIS) {
      expect(poi.lat).toBeGreaterThanOrEqual(-90);
      expect(poi.lat).toBeLessThanOrEqual(90);
      expect(poi.lng).toBeGreaterThanOrEqual(-180);
      expect(poi.lng).toBeLessThanOrEqual(180);
    }
  });
});

describe("findPOI", () => {
  it("finds a POI by exact id", () => {
    const result = findPOI("block-a");
    expect(result).toBeDefined();
    expect(result!.id).toBe("block-a");
  });

  it("finds a POI by name substring (case-insensitive)", () => {
    const result = findPOI("Sports Complex");
    expect(result).toBeDefined();
    expect(result!.name.toLowerCase()).toContain("sports complex");
  });

  it("finds a POI by category substring", () => {
    const result = findPOI("Supermarket");
    expect(result).toBeDefined();
    expect(result!.category).toBe("Supermarket");
  });

  it("returns undefined for non-existent query", () => {
    expect(findPOI("nonexistent-place-xyz")).toBeUndefined();
  });
});

describe("findPOIs", () => {
  it("returns multiple POIs matching a category", () => {
    const results = findPOIs("Building");
    expect(results.length).toBeGreaterThan(1);
    for (const poi of results) {
      expect(poi.category).toBe("Building");
    }
  });

  it("returns empty array for non-existent query", () => {
    expect(findPOIs("nonexistent-place-xyz")).toEqual([]);
  });

  it("searches by cuisine field", () => {
    const results = findPOIs("Korean");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.cuisine?.toLowerCase().includes("korean"))).toBe(true);
  });
});
