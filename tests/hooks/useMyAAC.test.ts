import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMyAAC, STORAGE_KEY, poiToMyAAC } from "@/hooks/useMyAAC";
import type { POI } from "@/types";

const testPOI: POI = {
  id: "aac-bedok",
  name: "Bedok North AAC",
  lat: 1.334,
  lng: 103.932,
  category: "Active Ageing Centre",
  description: "Test centre",
  address: "Blk 123 Bedok North St 1, #01-01, S460123",
  contact: "+65 6123 4567",
};

const testPOI2: POI = {
  id: "aac-clementi",
  name: "Clementi AAC",
  lat: 1.315,
  lng: 103.765,
  category: "Active Ageing Centre",
  description: "Another centre",
  address: "Blk 456 Clementi Ave 3, S120456",
};

describe("poiToMyAAC", () => {
  it("maps POI to MyAACData with phone", () => {
    const result = poiToMyAAC(testPOI);
    expect(result).toEqual({
      name: "Bedok North AAC",
      lat: 1.334,
      lng: 103.932,
      address: "Blk 123 Bedok North St 1, #01-01, S460123",
      phone: "+65 6123 4567",
    });
  });

  it("maps POI to MyAACData without phone when contact is absent", () => {
    const result = poiToMyAAC(testPOI2);
    expect(result).toEqual({
      name: "Clementi AAC",
      lat: 1.315,
      lng: 103.765,
      address: "Blk 456 Clementi Ave 3, S120456",
    });
    expect(result).not.toHaveProperty("phone");
  });

  it("defaults address to empty string when POI has no address", () => {
    const noAddr: POI = { ...testPOI, address: undefined };
    const result = poiToMyAAC(noAddr);
    expect(result.address).toBe("");
  });
});

describe("useMyAAC", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no AAC is saved", () => {
    const { result } = renderHook(() => useMyAAC());
    expect(result.current.myAAC).toBeNull();
  });

  it("saves and retrieves an AAC", () => {
    const { result } = renderHook(() => useMyAAC());

    act(() => {
      result.current.setMyAAC(testPOI);
    });

    expect(result.current.myAAC).toEqual({
      name: "Bedok North AAC",
      lat: 1.334,
      lng: 103.932,
      address: "Blk 123 Bedok North St 1, #01-01, S460123",
      phone: "+65 6123 4567",
    });
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useMyAAC());

    act(() => {
      result.current.setMyAAC(testPOI);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.name).toBe("Bedok North AAC");
    expect(stored.lat).toBe(1.334);
  });

  it("clears saved AAC", () => {
    const { result } = renderHook(() => useMyAAC());

    act(() => {
      result.current.setMyAAC(testPOI);
    });
    expect(result.current.myAAC).not.toBeNull();

    act(() => {
      result.current.clearMyAAC();
    });
    expect(result.current.myAAC).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("replaces saved AAC when setting a new one", () => {
    const { result } = renderHook(() => useMyAAC());

    act(() => {
      result.current.setMyAAC(testPOI);
    });
    expect(result.current.myAAC?.name).toBe("Bedok North AAC");

    act(() => {
      result.current.setMyAAC(testPOI2);
    });
    expect(result.current.myAAC?.name).toBe("Clementi AAC");
    expect(result.current.myAAC).not.toHaveProperty("phone");
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const { result } = renderHook(() => useMyAAC());
    expect(result.current.myAAC).toBeNull();
  });

  it("handles localStorage with wrong shape gracefully", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));
    const { result } = renderHook(() => useMyAAC());
    expect(result.current.myAAC).toBeNull();
  });

  it("reads pre-existing valid localStorage on mount", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: "Pre-saved AAC",
        lat: 1.3,
        lng: 103.8,
        address: "Blk 1 Test",
      }),
    );

    const { result } = renderHook(() => useMyAAC());
    expect(result.current.myAAC?.name).toBe("Pre-saved AAC");
  });
});
