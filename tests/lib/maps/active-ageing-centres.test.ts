import { describe, expect, it } from "vitest";
import { ACTIVE_AGEING_CENTRES } from "@/lib/maps/active-ageing-centres";

describe("ACTIVE_AGEING_CENTRES", () => {
  it("is a non-empty array with 80+ entries", () => {
    expect(Array.isArray(ACTIVE_AGEING_CENTRES)).toBe(true);
    expect(ACTIVE_AGEING_CENTRES.length).toBeGreaterThan(80);
  });

  it("every entry has required fields", () => {
    for (const aac of ACTIVE_AGEING_CENTRES) {
      expect(typeof aac.id).toBe("string");
      expect(aac.id.length).toBeGreaterThan(0);
      expect(typeof aac.name).toBe("string");
      expect(aac.name.length).toBeGreaterThan(0);
      expect(typeof aac.lat).toBe("number");
      expect(typeof aac.lng).toBe("number");
      expect(typeof aac.category).toBe("string");
      expect(typeof aac.description).toBe("string");
    }
  });

  it("all ids are unique and start with 'aac-'", () => {
    const ids = ACTIVE_AGEING_CENTRES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.startsWith("aac-")).toBe(true);
    }
  });

  it("all entries have category 'Active Ageing Centre'", () => {
    for (const aac of ACTIVE_AGEING_CENTRES) {
      expect(aac.category).toBe("Active Ageing Centre");
    }
  });

  it("all coordinates are within Singapore bounds", () => {
    for (const aac of ACTIVE_AGEING_CENTRES) {
      expect(aac.lat).toBeGreaterThan(1.15);
      expect(aac.lat).toBeLessThan(1.47);
      expect(aac.lng).toBeGreaterThan(103.6);
      expect(aac.lng).toBeLessThan(104.1);
    }
  });

  it("all entries have address and hours fields", () => {
    for (const aac of ACTIVE_AGEING_CENTRES) {
      expect(typeof aac.address).toBe("string");
      expect(aac.address!.length).toBeGreaterThan(0);
      expect(typeof aac.hours).toBe("string");
      expect(aac.hours!.length).toBeGreaterThan(0);
    }
  });
});
