import { describe, expect, it } from "vitest";
import { AIC_HOTLINE, AIC_OFFICES } from "@/lib/maps/aic-offices";

describe("AIC_HOTLINE", () => {
  it("is the correct hotline number", () => {
    expect(AIC_HOTLINE).toBe("1800-650-6060");
  });
});

describe("AIC_OFFICES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(AIC_OFFICES)).toBe(true);
    expect(AIC_OFFICES.length).toBeGreaterThan(0);
  });

  it("every entry has required fields", () => {
    for (const office of AIC_OFFICES) {
      expect(typeof office.id).toBe("string");
      expect(office.id.length).toBeGreaterThan(0);
      expect(typeof office.name).toBe("string");
      expect(office.name.length).toBeGreaterThan(0);
      expect(typeof office.lat).toBe("number");
      expect(typeof office.lng).toBe("number");
      expect(typeof office.category).toBe("string");
      expect(typeof office.description).toBe("string");
    }
  });

  it("all ids are unique", () => {
    const ids = AIC_OFFICES.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all entries have category 'AIC Office'", () => {
    for (const office of AIC_OFFICES) {
      expect(office.category).toBe("AIC Office");
    }
  });

  it("all coordinates are within Singapore bounds", () => {
    for (const office of AIC_OFFICES) {
      expect(office.lat).toBeGreaterThan(1.15);
      expect(office.lat).toBeLessThan(1.47);
      expect(office.lng).toBeGreaterThan(103.6);
      expect(office.lng).toBeLessThan(104.1);
    }
  });

  it("all entries have address, hours, and contact fields", () => {
    for (const office of AIC_OFFICES) {
      expect(typeof office.address).toBe("string");
      expect(office.address!.length).toBeGreaterThan(0);
      expect(typeof office.hours).toBe("string");
      expect(office.hours!.length).toBeGreaterThan(0);
      expect(typeof office.contact).toBe("string");
      expect(office.contact!.length).toBeGreaterThan(0);
    }
  });
});
