import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import AACResultCard, { formatDistance } from "@/components/aac/AACResultCard";
import type { POI } from "@/types";

const basePOI: POI = {
  id: "aac-test",
  name: "Test Active Ageing Centre",
  lat: 1.314,
  lng: 103.764,
  category: "Active Ageing Centre",
  description: "Test centre",
  address: "Blk 123 Test St #01-01, Singapore 123456",
  hours: "Mon–Fri 9AM–5PM",
};

describe("formatDistance", () => {
  it("formats sub-kilometre as metres", () => {
    expect(formatDistance(0.35)).toBe("350 m");
  });

  it("formats >= 1 km with one decimal", () => {
    expect(formatDistance(2.456)).toBe("2.5 km");
  });

  it("formats exactly 1 km", () => {
    expect(formatDistance(1)).toBe("1.0 km");
  });
});

describe("AACResultCard", () => {
  it("renders name and address", () => {
    render(<AACResultCard poi={basePOI} distanceKm={1.2} onSelect={vi.fn()} />);
    expect(screen.getByText("Test Active Ageing Centre")).toBeInTheDocument();
    expect(screen.getByText("Blk 123 Test St #01-01, Singapore 123456")).toBeInTheDocument();
  });

  it("renders hours when present", () => {
    render(<AACResultCard poi={basePOI} distanceKm={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Mon–Fri 9AM–5PM")).toBeInTheDocument();
  });

  it("renders formatted distance", () => {
    render(<AACResultCard poi={basePOI} distanceKm={0.45} onSelect={vi.fn()} />);
    expect(screen.getByText("450 m")).toBeInTheDocument();
  });

  it("omits distance when null", () => {
    render(<AACResultCard poi={basePOI} distanceKm={null} onSelect={vi.fn()} />);
    expect(screen.queryByText(/km|m$/)).not.toBeInTheDocument();
  });

  it("calls onSelect with the POI when clicked", () => {
    const onSelect = vi.fn();
    render(<AACResultCard poi={basePOI} distanceKm={1.0} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Test Active Ageing Centre"));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(basePOI);
  });
});
