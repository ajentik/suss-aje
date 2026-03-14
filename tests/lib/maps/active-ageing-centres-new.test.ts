import { describe, expect, it } from "vitest";
import { ACTIVE_AGEING_CENTRES_NEW } from "@/lib/maps/active-ageing-centres-new";

describe("ACTIVE_AGEING_CENTRES_NEW", () => {
  it("contains more than 100 entries", () => {
    expect(ACTIVE_AGEING_CENTRES_NEW.length).toBeGreaterThan(100);
  });

  it("every entry has required fields: id, name, lat, lng, address", () => {
    for (const entry of ACTIVE_AGEING_CENTRES_NEW) {
      expect(typeof entry.id).toBe("string");
      expect(entry.id.length).toBeGreaterThan(0);
      expect(typeof entry.name).toBe("string");
      expect(entry.name.length).toBeGreaterThan(0);
      expect(typeof entry.lat).toBe("number");
      expect(typeof entry.lng).toBe("number");
      expect(typeof entry.address).toBe("string");
      expect(entry.address!.length).toBeGreaterThan(0);
    }
  });

  it("all lat/lng are valid Singapore coordinates (lat 1.2-1.5, lng 103.6-104.0)", () => {
    for (const entry of ACTIVE_AGEING_CENTRES_NEW) {
      expect(entry.lat).toBeGreaterThanOrEqual(1.2);
      expect(entry.lat).toBeLessThanOrEqual(1.5);
      expect(entry.lng).toBeGreaterThanOrEqual(103.6);
      expect(entry.lng).toBeLessThanOrEqual(104.0);
    }
  });

  it("has no duplicate IDs", () => {
    const ids = ACTIVE_AGEING_CENTRES_NEW.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all IDs start with 'aac-'", () => {
    for (const entry of ACTIVE_AGEING_CENTRES_NEW) {
      expect(entry.id.startsWith("aac-")).toBe(true);
    }
  });

  it("all entries have category 'Active Ageing Centre'", () => {
    for (const entry of ACTIVE_AGEING_CENTRES_NEW) {
      expect(entry.category).toBe("Active Ageing Centre");
    }
  });

  it("all entries have a description", () => {
    for (const entry of ACTIVE_AGEING_CENTRES_NEW) {
      expect(typeof entry.description).toBe("string");
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });
});
