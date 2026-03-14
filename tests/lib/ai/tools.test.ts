import { describe, expect, it } from "vitest";
import { navigateTo, showEvents, campusInfo, tools } from "@/lib/ai/tools";
import type { POI } from "@/types";

interface NavigateSuccess { success: true; poi: POI; message: string }
interface NavigateFailure { success: false; message: string }
type NavigateResult = NavigateSuccess | NavigateFailure;

interface EventsResult {
  success: true;
  events: { category: string; school?: string }[];
  filters: { date?: string; category?: string; range?: string };
  message: string;
}

interface CampusInfoResult {
  success: true;
  query: string;
  answer: string;
  venues?: POI[];
}

const callCtx = { toolCallId: "test", messages: [] as never[], abortSignal: undefined as unknown as AbortSignal };

describe("AI tools export", () => {
  it("exports tools object with navigate_to, show_events, and campus_info", () => {
    expect(tools).toBeDefined();
    expect(tools.navigate_to).toBe(navigateTo);
    expect(tools.show_events).toBe(showEvents);
    expect(tools.campus_info).toBe(campusInfo);
  });

  it("navigateTo has correct description and inputSchema", () => {
    expect(navigateTo.description).toContain("Navigate");
    expect(navigateTo.description).toContain("3D campus map");
    expect(navigateTo.inputSchema).toBeDefined();
  });

  it("showEvents has correct description and inputSchema", () => {
    expect(showEvents.description).toContain("events");
    expect(showEvents.inputSchema).toBeDefined();
  });

  it("campusInfo has correct description and inputSchema", () => {
    expect(campusInfo.description).toContain("campus");
    expect(campusInfo.inputSchema).toBeDefined();
  });
});

describe("navigateTo.execute", () => {
  it("returns success with POI data for a known destination", async () => {
    const raw = await navigateTo.execute!({ destination: "library" }, callCtx);
    const result = raw as NavigateResult;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.poi).toBeDefined();
      expect(result.poi.name.toLowerCase()).toContain("library");
      expect(result.message).toContain("Navigating to");
    }
  });

  it("returns failure with helpful message for unknown destination", async () => {
    const raw = await navigateTo.execute!({ destination: "nonexistent-place-xyz-123" }, callCtx);
    const result = raw as NavigateResult;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain("couldn't find");
      expect(result.message).toContain("nonexistent-place-xyz-123");
    }
  });

  it("includes address and hours in message when available", async () => {
    const raw = await navigateTo.execute!({ destination: "FairPrice" }, callCtx);
    const result = raw as NavigateResult;

    expect(result.success).toBe(true);
    if (result.success && result.poi.address) {
      expect(result.message).toContain("Address:");
    }
  });

  it("includes rating in message when available", async () => {
    const raw = await navigateTo.execute!({ destination: "HoHo Korean" }, callCtx);
    const result = raw as NavigateResult;

    expect(result.success).toBe(true);
    if (result.success && result.poi.rating) {
      expect(result.message).toContain("Rating:");
    }
  });
});

describe("showEvents.execute", () => {
  it("returns all events when no filters are applied", async () => {
    const result = (await showEvents.execute!({}, callCtx)) as EventsResult;

    expect(result.success).toBe(true);
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);
  });

  it("filters events by category", async () => {
    const result = (await showEvents.execute!({ category: "Information Session" }, callCtx)) as EventsResult;

    expect(result.success).toBe(true);
    for (const event of result.events) {
      expect(event.category.toLowerCase()).toContain("information session");
    }
  });

  it("filters events by school", async () => {
    const result = (await showEvents.execute!({ school: "SUSS" }, callCtx)) as EventsResult;

    expect(result.success).toBe(true);
    for (const event of result.events) {
      expect(event.school).toBe("SUSS");
    }
  });

  it("returns message indicating count when events found", async () => {
    const result = (await showEvents.execute!({}, callCtx)) as EventsResult;

    expect(result.message).toContain("Found");
    expect(result.message).toContain("event");
  });

  it("returns 'no events' message when nothing matches", async () => {
    const result = (await showEvents.execute!({ category: "nonexistent-category-xyz" }, callCtx)) as EventsResult;

    expect(result.events).toHaveLength(0);
    expect(result.message).toContain("No events found");
  });

  it("includes filter info in the response", async () => {
    const result = (await showEvents.execute!({ category: "Open House", range: "7d" }, callCtx)) as EventsResult;

    expect(result.filters.category).toBe("Open House");
    expect(result.filters.range).toBe("7d");
  });
});

describe("campusInfo.execute", () => {
  it("returns campus address for 'address' query", async () => {
    const result = (await campusInfo.execute!({ query: "What is the campus address?" }, callCtx)) as CampusInfoResult;

    expect(result.success).toBe(true);
    expect(result.answer).toContain("463 Clementi Road");
  });

  it("returns library info for 'library' query", async () => {
    const result = (await campusInfo.execute!({ query: "Tell me about the library" }, callCtx)) as CampusInfoResult;

    expect(result.success).toBe(true);
    expect(result.answer).toContain("Library");
  });

  it("returns venue list for category queries like 'supermarket'", async () => {
    const result = (await campusInfo.execute!({ query: "Where can I find a supermarket nearby?" }, callCtx)) as CampusInfoResult;

    expect(result.success).toBe(true);
    expect(result.answer).toContain("supermarket");
    expect(result.venues).toBeDefined();
    expect(result.venues!.length).toBeGreaterThan(0);
  });

  it("returns AIC info for 'aic' query", async () => {
    const result = (await campusInfo.execute!({ query: "Tell me about aic services" }, callCtx)) as CampusInfoResult;

    expect(result.success).toBe(true);
    expect(result.answer).toContain("AIC");
  });

  it("returns generic campus info for unknown queries", async () => {
    const result = (await campusInfo.execute!({ query: "random question about campus" }, callCtx)) as CampusInfoResult;

    expect(result.success).toBe(true);
    expect(result.answer).toContain("463 Clementi Road");
  });
});
