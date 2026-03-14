import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import type { CampusEvent } from "@/types";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const MOCK_EVENTS: CampusEvent[] = [
  {
    id: "evt-1",
    title: "AI Workshop",
    date: "2026-03-15",
    time: "10:00",
    location: "Block A",
    category: "Workshop",
    description: "Learn AI",
    type: "On-Campus",
    school: "SUSS",
    lat: 1.33,
    lng: 103.77,
  },
  {
    id: "evt-2",
    title: "Open Day",
    date: "2026-03-16",
    time: "09:00",
    location: "Main Hall",
    category: "Lecture",
    description: "Open day event",
    type: "On-Campus",
    school: "SIM",
    lat: 1.33,
    lng: 103.78,
  },
  {
    id: "evt-3",
    title: "Past Event",
    date: "2025-01-01",
    time: "08:00",
    location: "Room 101",
    category: "Workshop",
    description: "Old workshop",
    type: "Online",
    school: "SUSS",
    lat: 1.33,
    lng: 103.77,
  },
];

function mockFetchSuccess(data: CampusEvent[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve(data),
    }),
  );
}

function mockFetchFailure() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
}

describe("useCampusEvents", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-03-15T00:00:00") });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("fetches events and returns them sorted by date/time", async () => {
    mockFetchSuccess(MOCK_EVENTS);
    const { useCampusEvents } = await import("@/hooks/useCampusEvents");
    const { result } = renderHook(() => useCampusEvents());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.allEvents).toHaveLength(3);
    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].id).toBe("evt-3");
    expect(result.current.events[2].id).toBe("evt-2");
  });

  it("returns unique sorted categories", async () => {
    mockFetchSuccess(MOCK_EVENTS);
    const { useCampusEvents } = await import("@/hooks/useCampusEvents");
    const { result } = renderHook(() => useCampusEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.categories).toEqual(["Lecture", "Workshop"]);
  });

  it("filters events by category", async () => {
    mockFetchSuccess(MOCK_EVENTS);
    const { useCampusEvents } = await import("@/hooks/useCampusEvents");
    const { result } = renderHook(() => useCampusEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setCategoryFilter("Workshop"));

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events.every((e) => e.category === "Workshop")).toBe(true);
  });

  it("filters events by school", async () => {
    mockFetchSuccess(MOCK_EVENTS);
    const { useCampusEvents } = await import("@/hooks/useCampusEvents");
    const { result } = renderHook(() => useCampusEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSchoolFilter("SIM"));

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].school).toBe("SIM");
  });

  it("filters events by date preset '1d' (today only)", async () => {
    mockFetchSuccess(MOCK_EVENTS);
    const { useCampusEvents } = await import("@/hooks/useCampusEvents");
    const { result } = renderHook(() => useCampusEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setDateFilter("1d"));

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].date).toBe("2026-03-15");
  });

  it("filters events by date preset '3d'", async () => {
    mockFetchSuccess(MOCK_EVENTS);
    const { useCampusEvents } = await import("@/hooks/useCampusEvents");
    const { result } = renderHook(() => useCampusEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setDateFilter("3d"));

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events.map((e) => e.id)).toEqual(["evt-1", "evt-2"]);
  });

  it("handles fetch error and shows toast", async () => {
    mockFetchFailure();
    const { toast } = await import("sonner");
    const { useCampusEvents } = await import("@/hooks/useCampusEvents");
    const { result } = renderHook(() => useCampusEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(toast.error).toHaveBeenCalledWith("Failed to load campus events.");
    expect(result.current.events).toEqual([]);
  });

  it("shows all events when date filter is 'all'", async () => {
    mockFetchSuccess(MOCK_EVENTS);
    const { useCampusEvents } = await import("@/hooks/useCampusEvents");
    const { result } = renderHook(() => useCampusEvents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.dateFilter).toBe("all");
    expect(result.current.events).toHaveLength(3);
  });
});
