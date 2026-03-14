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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns events grouped by kind", () => {
    const result = getAACEventsForPOI("NTUC Health Active Ageing Hub (Jurong Point)");
    expect(result).toHaveProperty("regular");
    expect(result).toHaveProperty("special");
    expect(Array.isArray(result.regular)).toBe(true);
    expect(Array.isArray(result.special)).toBe(true);
  });

  it("returns empty arrays for unknown POI", () => {
    const result = getAACEventsForPOI("Nonexistent Centre");
    expect(result.regular).toHaveLength(0);
    expect(result.special).toHaveLength(0);
  });

  it("sorts events by date and time", () => {
    const result = getAACEventsForPOI("NTUC Health Active Ageing Hub (Jurong Point)");
    for (const kind of ["regular", "special"] as const) {
      const events = result[kind];
      for (let i = 1; i < events.length; i++) {
        const prev = `${events[i - 1].date}T${events[i - 1].time}`;
        const curr = `${events[i].date}T${events[i].time}`;
        expect(prev <= curr).toBe(true);
      }
    }
  });

  it("excludes past events", () => {
    const result = getAACEventsForPOI("NTUC Health Active Ageing Hub (Jurong Point)");
    const today = "2026-03-14";
    for (const events of [result.regular, result.special]) {
      for (const event of events) {
        const endDate = event.endDate || event.date;
        expect(endDate >= today).toBe(true);
      }
    }
  });
});
