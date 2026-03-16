import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { lookupAerialVideo } from "@/lib/maps/aerial-view";

describe("lookupAerialVideo", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls Aerial View API with correct URL and encoded address", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          state: "ACTIVE",
          uris: { MP4_HIGH: "https://example.com/video.mp4" },
        }),
    });

    await lookupAerialVideo("463 Clementi Road, Singapore");

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("aerialview.googleapis.com/v1/videos:lookupVideo");
    expect(url).toContain("address=463%20Clementi%20Road%2C%20Singapore");
  });

  it("returns video data when state is ACTIVE", async () => {
    const mockVideo = {
      state: "ACTIVE" as const,
      uris: {
        MP4_HIGH: "https://example.com/high.mp4",
        MP4_LOW: "https://example.com/low.mp4",
      },
      metadata: {
        videoId: "vid-123",
        captureDate: { year: 2025, month: 6, day: 15 },
        duration: "30s",
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVideo),
    });

    const result = await lookupAerialVideo("463 Clementi Road");

    expect(result).not.toBeNull();
    expect(result!.state).toBe("ACTIVE");
    expect(result!.uris.MP4_HIGH).toBe("https://example.com/high.mp4");
    expect(result!.metadata?.videoId).toBe("vid-123");
  });

  it("returns null when state is PROCESSING", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          state: "PROCESSING",
          uris: {},
        }),
    });

    const result = await lookupAerialVideo("463 Clementi Road");
    expect(result).toBeNull();
  });

  it("returns null when state is NEEDS_PROCESSING", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          state: "NEEDS_PROCESSING",
          uris: {},
        }),
    });

    const result = await lookupAerialVideo("463 Clementi Road");
    expect(result).toBeNull();
  });

  it("returns null when response is not ok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await lookupAerialVideo("unknown address");
    expect(result).toBeNull();
  });

  it("returns null when fetch throws a network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const result = await lookupAerialVideo("463 Clementi Road");
    expect(result).toBeNull();
  });
});
