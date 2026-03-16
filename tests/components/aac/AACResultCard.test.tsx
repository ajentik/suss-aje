import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockWalkTo = vi.fn();
const mockSetMyAAC = vi.fn();

vi.mock("@/hooks/useWalkingRoute", () => ({
  useWalkingRoute: vi.fn(() => ({
    walkTo: mockWalkTo,
    isLoading: false,
  })),
}));

vi.mock("@/hooks/useMyAAC", () => ({
  useMyAAC: vi.fn(() => ({
    myAAC: null,
    setMyAAC: mockSetMyAAC,
    clearMyAAC: vi.fn(),
  })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import AACResultCard, { formatDistance } from "@/components/aac/AACResultCard";
import { useMyAAC } from "@/hooks/useMyAAC";
import type { POI } from "@/types";

const mockedUseMyAAC = vi.mocked(useMyAAC);

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
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseMyAAC.mockReturnValue({
      myAAC: null,
      setMyAAC: mockSetMyAAC,
      clearMyAAC: vi.fn(),
    });
  });

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

  it("shows Set as My AAC button when not saved", () => {
    render(<AACResultCard poi={basePOI} distanceKm={1.0} onSelect={vi.fn()} />);
    expect(screen.getByLabelText(`Set ${basePOI.name} as My AAC`)).toBeInTheDocument();
  });

  it("calls setMyAAC when star button is clicked", () => {
    render(<AACResultCard poi={basePOI} distanceKm={1.0} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(`Set ${basePOI.name} as My AAC`));
    expect(mockSetMyAAC).toHaveBeenCalledOnce();
    expect(mockSetMyAAC).toHaveBeenCalledWith(basePOI);
  });

  it("shows saved state when AAC matches", () => {
    mockedUseMyAAC.mockReturnValue({
      myAAC: { name: basePOI.name, lat: basePOI.lat, lng: basePOI.lng, address: basePOI.address! },
      setMyAAC: mockSetMyAAC,
      clearMyAAC: vi.fn(),
    });
    render(<AACResultCard poi={basePOI} distanceKm={1.0} onSelect={vi.fn()} />);
    expect(screen.getByLabelText(`${basePOI.name} is your saved AAC`)).toBeInTheDocument();
  });

  it("does not call setMyAAC when already saved and star is clicked", () => {
    mockedUseMyAAC.mockReturnValue({
      myAAC: { name: basePOI.name, lat: basePOI.lat, lng: basePOI.lng, address: basePOI.address! },
      setMyAAC: mockSetMyAAC,
      clearMyAAC: vi.fn(),
    });
    render(<AACResultCard poi={basePOI} distanceKm={1.0} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(`${basePOI.name} is your saved AAC`));
    expect(mockSetMyAAC).not.toHaveBeenCalled();
  });
});
