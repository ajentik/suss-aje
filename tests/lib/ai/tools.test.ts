import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { navigateTo, showEvents, campusInfo, walkingAdvice, tools } from "@/lib/ai/tools";
import type { POI } from "@/types";

interface NavigateSuccess { success: true; poi: POI; source: string; message: string }
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

interface WalkingAdviceResult {
  success: true;
  destination: string;
  mobilityLevel: string;
  advice: string;
  isOnCampus: boolean;
}

const callCtx = { toolCallId: "test", messages: [] as never[], abortSignal: undefined as unknown as AbortSignal };

describe("AI tools export", () => {
  it("exports tools object with navigate_to, show_events, campus_info, and walking_advice", () => {
    expect(tools).toBeDefined();
    expect(tools.navigate_to).toBe(navigateTo);
    expect(tools.show_events).toBe(showEvents);
    expect(tools.campus_info).toBe(campusInfo);
    expect(tools.walking_advice).toBe(walkingAdvice);
  });

  it("navigateTo has correct description and inputSchema", () => {
    expect(navigateTo.description).toContain("Navigate");
    expect(navigateTo.description).toContain("3D campus map");
    expect(navigateTo.description).toContain("Google Maps");
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

  it("walkingAdvice has correct description and inputSchema", () => {
    expect(walkingAdvice.description).toContain("walking advice");
    expect(walkingAdvice.description).toContain("elderly");
    expect(walkingAdvice.inputSchema).toBeDefined();
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
      expect(result.source).toBe("campus");
    }
  });

  it("returns failure with helpful message for unknown destination when Google Places unavailable", async () => {
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

  it("resolves Singlish term 'kopitiam' to find food-related POIs", async () => {
    const raw = await navigateTo.execute!({ destination: "kopitiam" }, callCtx);
    const result = raw as NavigateResult;

    if (result.success) {
      expect(result.source).toBe("campus");
    }
  });

  it("accepts optional userLat and userLng parameters", async () => {
    const raw = await navigateTo.execute!(
      { destination: "library", userLat: 1.33, userLng: 103.77 },
      callCtx,
    );
    const result = raw as NavigateResult;

    expect(result.success).toBe(true);
  });
});

describe("navigateTo Google Places fallback", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, GOOGLE_MAPS_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("falls back to Google Places when POI not found and API returns result", async () => {
    const mockResponse = {
      places: [{
        displayName: { text: "Test Restaurant" },
        formattedAddress: "123 Test Street, Singapore",
        location: { latitude: 1.33, longitude: 103.77 },
        rating: 4.5,
        types: ["restaurant"],
      }],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const raw = await navigateTo.execute!(
      { destination: "some unique restaurant xyz" },
      callCtx,
    );
    const result = raw as NavigateResult;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.source).toBe("google_places");
      expect(result.poi.name).toBe("Test Restaurant");
      expect(result.poi.address).toBe("123 Test Street, Singapore");
      expect(result.poi.rating).toBe(4.5);
    }
  });

  it("returns failure when Google Places API also finds nothing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ places: [] }),
    } as Response);

    const raw = await navigateTo.execute!(
      { destination: "completely-unknown-xyz" },
      callCtx,
    );
    const result = raw as NavigateResult;

    expect(result.success).toBe(false);
  });

  it("returns failure gracefully when Google Places API errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const raw = await navigateTo.execute!(
      { destination: "some-place-with-api-error" },
      callCtx,
    );
    const result = raw as NavigateResult;

    expect(result.success).toBe(false);
  });
});

describe("walkingAdvice.execute", () => {
  it("returns advice for an on-campus destination", async () => {
    const result = (await walkingAdvice.execute!(
      { destination: "library" },
      callCtx,
    )) as WalkingAdviceResult;

    expect(result.success).toBe(true);
    expect(result.isOnCampus).toBe(true);
    expect(result.mobilityLevel).toBe("moderate");
    expect(result.advice).toContain("campus");
  });

  it("returns advice for an off-campus destination", async () => {
    const result = (await walkingAdvice.execute!(
      { destination: "Clementi Mall" },
      callCtx,
    )) as WalkingAdviceResult;

    expect(result.success).toBe(true);
    expect(result.isOnCampus).toBe(false);
    expect(result.advice).toContain("Clementi Mall");
  });

  it("adjusts advice for low mobility level", async () => {
    const result = (await walkingAdvice.execute!(
      { destination: "library", mobilityLevel: "low" },
      callCtx,
    )) as WalkingAdviceResult;

    expect(result.success).toBe(true);
    expect(result.mobilityLevel).toBe("low");
    expect(result.advice).toContain("ramp");
  });

  it("adjusts advice for high mobility level", async () => {
    const result = (await walkingAdvice.execute!(
      { destination: "library", mobilityLevel: "high" },
      callCtx,
    )) as WalkingAdviceResult;

    expect(result.success).toBe(true);
    expect(result.mobilityLevel).toBe("high");
    expect(result.advice).toContain("sheltered");
  });

  it("returns advice for unknown destination", async () => {
    const result = (await walkingAdvice.execute!(
      { destination: "some unknown place" },
      callCtx,
    )) as WalkingAdviceResult;

    expect(result.success).toBe(true);
    expect(result.isOnCampus).toBe(false);
    expect(result.advice.length).toBeGreaterThan(0);
  });

  it("includes nearby rest stops in advice", async () => {
    const result = (await walkingAdvice.execute!(
      { destination: "library" },
      callCtx,
    )) as WalkingAdviceResult;

    expect(result.advice).toContain("rest");
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
