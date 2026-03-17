import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("useNavigationChat", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(response: object, status = 200) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(response),
      }),
    );
  }

  it("starts with empty state", async () => {
    mockFetch({});
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    expect(result.current.conversationHistory).toEqual([]);
    expect(result.current.response).toBeNull();
    expect(result.current.places).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("ignores empty queries", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    await act(async () => {
      await result.current.sendQuery("   ");
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.conversationHistory).toEqual([]);
  });

  it("sends query and adds user + assistant messages", async () => {
    mockFetch({ reply: "The library is in Block A.", placeId: "place1", placeName: "Library", placeDistance: "200m" });
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    await act(async () => {
      await result.current.sendQuery("Where is the library?");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conversationHistory).toHaveLength(2);
    expect(result.current.conversationHistory[0].role).toBe("user");
    expect(result.current.conversationHistory[0].content).toBe("Where is the library?");
    expect(result.current.conversationHistory[1].role).toBe("assistant");
    expect(result.current.conversationHistory[1].content).toBe("The library is in Block A.");
    expect(result.current.conversationHistory[1].place).toEqual({
      placeId: "place1",
      name: "Library",
      distance: "200m",
    });
    expect(result.current.response).toBe("The library is in Block A.");
    expect(result.current.places).toHaveLength(1);
  });

  it("adds assistant message without place when placeId is missing", async () => {
    mockFetch({ reply: "I can help with directions." });
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    await act(async () => {
      await result.current.sendQuery("Hello");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conversationHistory).toHaveLength(2);
    expect(result.current.conversationHistory[1].place).toBeUndefined();
    expect(result.current.places).toHaveLength(0);
  });

  it("handles 404 with fallback message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      }),
    );
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    await act(async () => {
      await result.current.sendQuery("Test query");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conversationHistory).toHaveLength(2);
    expect(result.current.conversationHistory[1].content).toMatch(/not available/i);
  });

  it("handles non-404 HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      }),
    );
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    await act(async () => {
      await result.current.sendQuery("Test query");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conversationHistory).toHaveLength(2);
    expect(result.current.conversationHistory[1].content).toMatch(/couldn.*process/i);
  });

  it("handles fetch rejection (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    await act(async () => {
      await result.current.sendQuery("Test query");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conversationHistory).toHaveLength(2);
    expect(result.current.conversationHistory[1].content).toMatch(/couldn.*process/i);
  });

  it("ignores AbortError silently", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")),
    );
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    await act(async () => {
      await result.current.sendQuery("Test query");
    });

    expect(result.current.conversationHistory).toHaveLength(1);
    expect(result.current.conversationHistory[0].role).toBe("user");
  });

  it("clearHistory resets all state", async () => {
    mockFetch({ reply: "Response", placeId: "p1", placeName: "Place" });
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    await act(async () => {
      await result.current.sendQuery("Hello");
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conversationHistory.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.conversationHistory).toEqual([]);
    expect(result.current.response).toBeNull();
    expect(result.current.places).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("does not add duplicate places", async () => {
    mockFetch({ reply: "Found it", placeId: "place1", placeName: "Library" });
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    await act(async () => {
      await result.current.sendQuery("Where is library?");
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockFetch({ reply: "Found again", placeId: "place1", placeName: "Library" });

    await act(async () => {
      await result.current.sendQuery("Library again?");
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.places).toHaveLength(1);
  });

  it("limits conversation history to MAX_HISTORY (10)", async () => {
    const { useNavigationChat } = await import("@/hooks/useNavigationChat");
    const { result } = renderHook(() => useNavigationChat());

    for (let i = 0; i < 6; i++) {
      mockFetch({ reply: `Reply ${i}` });
      await act(async () => {
        await result.current.sendQuery(`Query ${i}`);
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
    }

    expect(result.current.conversationHistory.length).toBeLessThanOrEqual(10);
  });
});
