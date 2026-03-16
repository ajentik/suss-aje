import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getBuildingInsights } from "@/lib/maps/solar-utils";

const LAT = 1.3299;
const LNG = 103.7764;
const API_KEY = "test-solar-key";

describe("getBuildingInsights", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls Solar API with correct URL parameters", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          solarPotential: {
            maxSunshineHoursPerYear: 1600,
            maxArrayPanelsCount: 42,
          },
        }),
    });

    await getBuildingInsights(LAT, LNG, API_KEY);

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("solar.googleapis.com/v1/buildingInsights:findClosest");
    expect(url).toContain(`location.latitude=${LAT}`);
    expect(url).toContain(`location.longitude=${LNG}`);
    expect(url).toContain(`key=${API_KEY}`);
    expect(url).toContain("requiredQuality=LOW");
  });

  it("returns High sun exposure when maxSunshineHoursPerYear > 1500", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          solarPotential: {
            maxSunshineHoursPerYear: 1800,
            maxArrayPanelsCount: 50,
          },
        }),
    });

    const result = await getBuildingInsights(LAT, LNG, API_KEY);

    expect(result).not.toBeNull();
    expect(result!.sunExposure).toBe("High");
    expect(result!.maxSunshineHoursPerYear).toBe(1800);
    expect(result!.solarPanelCount).toBe(50);
  });

  it("returns Moderate sun exposure when 1000 <= hours <= 1500", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          solarPotential: {
            maxSunshineHoursPerYear: 1200,
            maxArrayPanelsCount: 30,
          },
        }),
    });

    const result = await getBuildingInsights(LAT, LNG, API_KEY);

    expect(result).not.toBeNull();
    expect(result!.sunExposure).toBe("Moderate");
  });

  it("returns Low sun exposure when hours < 1000", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          solarPotential: {
            maxSunshineHoursPerYear: 800,
            maxArrayPanelsCount: 10,
          },
        }),
    });

    const result = await getBuildingInsights(LAT, LNG, API_KEY);

    expect(result).not.toBeNull();
    expect(result!.sunExposure).toBe("Low");
    expect(result!.maxSunshineHoursPerYear).toBe(800);
  });

  it("uses solarPanels.length when available over maxArrayPanelsCount", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          solarPotential: {
            maxSunshineHoursPerYear: 1600,
            solarPanels: new Array(25),
            maxArrayPanelsCount: 42,
          },
        }),
    });

    const result = await getBuildingInsights(LAT, LNG, API_KEY);

    expect(result).not.toBeNull();
    expect(result!.solarPanelCount).toBe(25);
  });

  it("rounds maxSunshineHoursPerYear to nearest integer", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          solarPotential: {
            maxSunshineHoursPerYear: 1523.7,
            maxArrayPanelsCount: 15,
          },
        }),
    });

    const result = await getBuildingInsights(LAT, LNG, API_KEY);

    expect(result).not.toBeNull();
    expect(result!.maxSunshineHoursPerYear).toBe(1524);
  });

  it("returns null when response is not ok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await getBuildingInsights(LAT, LNG, API_KEY);
    expect(result).toBeNull();
  });

  it("returns null when solarPotential is missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await getBuildingInsights(LAT, LNG, API_KEY);
    expect(result).toBeNull();
  });

  it("returns null when fetch throws a network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const result = await getBuildingInsights(LAT, LNG, API_KEY);
    expect(result).toBeNull();
  });

  it("defaults maxSunshineHoursPerYear to 0 when missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          solarPotential: {
            maxArrayPanelsCount: 5,
          },
        }),
    });

    const result = await getBuildingInsights(LAT, LNG, API_KEY);

    expect(result).not.toBeNull();
    expect(result!.maxSunshineHoursPerYear).toBe(0);
    expect(result!.sunExposure).toBe("Low");
  });
});
