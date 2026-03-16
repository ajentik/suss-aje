import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  classifyAACEvent,
  isOffSiteEvent,
  getAACEventsForPOI,
} from "@/lib/maps/aac-events";
import type { CampusEvent } from "@/types";

function makeEvent(overrides: Partial<CampusEvent> = {}): CampusEvent {
  return {
    id: "test-1",
    title: "Tai Chi",
    date: "2026-04-01",
    time: "09:00",
    location: "Test Centre",
    category: "Active Ageing Centre",
    description: "Morning exercise",
    type: "On-Campus",
    school: "SUSS",
    lat: 1.314,
    lng: 103.764,
    ...overrides,
  };
}

describe("classifyAACEvent", () => {
  it("classifies regular activities as regular", () => {
    const event = makeEvent({ title: "Tai Chi", description: "Morning exercise" });
    expect(classifyAACEvent(event)).toBe("regular");
  });

  it("classifies workshop events as special", () => {
    const event = makeEvent({ title: "Digital Workshop", description: "Learn mobile basics" });
    expect(classifyAACEvent(event)).toBe("special");
  });

  it("classifies events with special keywords in description", () => {
    const event = makeEvent({ title: "Fun Day", description: "A cooking session" });
    expect(classifyAACEvent(event)).toBe("special");
  });

  it("classifies outing events as special", () => {
    const event = makeEvent({ title: "Garden Outing", description: "Visit to park" });
    expect(classifyAACEvent(event)).toBe("special");
  });

  it("classifies festival events as special", () => {
    const event = makeEvent({ title: "Hari Raya Festival", description: "Celebration" });
    expect(classifyAACEvent(event)).toBe("special");
  });

  it("is case insensitive", () => {
    const event = makeEvent({ title: "WORKSHOP on Health", description: "" });
    expect(classifyAACEvent(event)).toBe("special");
  });
});

describe("isOffSiteEvent", () => {
  it("returns false for events at the same location", () => {
    const event = makeEvent({ lat: 1.314, lng: 103.764 });
    expect(isOffSiteEvent(event, 1.314, 103.764)).toBe(false);
  });

  it("returns false for events within 200m", () => {
    const event = makeEvent({ lat: 1.3141, lng: 103.7641 });
    expect(isOffSiteEvent(event, 1.314, 103.764)).toBe(false);
  });

  it("returns true for events more than 200m away", () => {
    const event = makeEvent({ lat: 1.320, lng: 103.770 });
    expect(isOffSiteEvent(event, 1.314, 103.764)).toBe(true);
  });

  it("returns true for large lat difference alone", () => {
    const event = makeEvent({ lat: 1.320, lng: 103.764 });
    expect(isOffSiteEvent(event, 1.314, 103.764)).toBe(true);
  });
});

describe("getAACEventsForPOI", () => {
  const regularEvent = makeEvent({
    id: "reg-1",
    title: "Tai Chi",
    description: "Morning exercise",
    location: "Test Centre",
    date: "2026-03-15",
    endDate: "2026-06-30",
  });

  const specialEvent = makeEvent({
    id: "sp-1",
    title: "Cooking Workshop",
    description: "Community cooking session",
    location: "Test Centre",
    date: "2026-03-16",
    endDate: "2026-06-30",
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T12:00:00Z"));

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [regularEvent, specialEvent],
            total: 2,
            limit: 200,
            offset: 0,
          }),
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns events grouped by kind", async () => {
    const result = await getAACEventsForPOI("Test Centre");
    expect(result).toHaveProperty("regular");
    expect(result).toHaveProperty("special");
    expect(Array.isArray(result.regular)).toBe(true);
    expect(Array.isArray(result.special)).toBe(true);
  });

  it("returns empty arrays when API returns no events", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], total: 0, limit: 200, offset: 0 }),
      }),
    );
    const result = await getAACEventsForPOI("Nonexistent Centre");
    expect(result.regular).toHaveLength(0);
    expect(result.special).toHaveLength(0);
  });

  it("sorts events by date and time", async () => {
    const result = await getAACEventsForPOI("Test Centre");
    for (const kind of ["regular", "special"] as const) {
      const events = result[kind];
      for (let i = 1; i < events.length; i++) {
        const prev = `${events[i - 1].date}T${events[i - 1].time}`;
        const curr = `${events[i].date}T${events[i].time}`;
        expect(prev <= curr).toBe(true);
      }
    }
  });

  it("classifies events correctly into regular and special", async () => {
    const result = await getAACEventsForPOI("Test Centre");
    expect(result.regular).toHaveLength(1);
    expect(result.special).toHaveLength(1);
    expect(result.regular[0].id).toBe("reg-1");
    expect(result.special[0].id).toBe("sp-1");
  });
});
