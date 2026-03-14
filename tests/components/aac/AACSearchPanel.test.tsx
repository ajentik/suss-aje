import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/hooks/useGeolocation", () => ({
  useGeolocation: vi.fn(),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setSelectedPOI: mockSetSelectedPOI,
      setFlyToTarget: mockSetFlyToTarget,
    }),
  ),
}));

vi.mock("@/lib/maps/active-ageing-centres", () => ({
  ACTIVE_AGEING_CENTRES: [
    {
      id: "aac-1",
      name: "Alpha AAC (Bedok)",
      lat: 1.324,
      lng: 103.93,
      category: "Active Ageing Centre",
      description: "Centre 1",
      address: "Blk 1 Bedok North",
    },
    {
      id: "aac-2",
      name: "Beta AAC (Clementi)",
      lat: 1.315,
      lng: 103.765,
      category: "Active Ageing Centre",
      description: "Centre 2",
      address: "Blk 2 Clementi Ave",
    },
    {
      id: "aac-3",
      name: "Gamma AAC (Jurong)",
      lat: 1.34,
      lng: 103.74,
      category: "Active Ageing Centre",
      description: "Centre 3",
      address: "Blk 3 Jurong West",
    },
  ],
}));

import AACSearchPanel from "@/components/aac/AACSearchPanel";
import { useGeolocation } from "@/hooks/useGeolocation";

const mockSetSelectedPOI = vi.fn();
const mockSetFlyToTarget = vi.fn();
const mockRequestLocation = vi.fn();

const mockedUseGeolocation = vi.mocked(useGeolocation);

function setGeoState(overrides: Partial<ReturnType<typeof useGeolocation>> = {}) {
  mockedUseGeolocation.mockReturnValue({
    lat: null,
    lng: null,
    status: "idle",
    error: null,
    requestLocation: mockRequestLocation,
    ...overrides,
  });
}

describe("AACSearchPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setGeoState();
  });

  it("renders search input and location button", () => {
    render(<AACSearchPanel />);
    expect(screen.getByPlaceholderText("Search by name or area…")).toBeInTheDocument();
    expect(screen.getByText("Use My Location")).toBeInTheDocument();
  });

  it("shows all centres alphabetically when no location", () => {
    render(<AACSearchPanel />);
    expect(
      screen.getByText(
        (_content, el) => el?.tagName === "P" && el.textContent === "3 centres",
      ),
    ).toBeInTheDocument();
    const names = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.includes("AAC"),
    );
    expect(names[0]).toHaveTextContent("Alpha AAC");
    expect(names[1]).toHaveTextContent("Beta AAC");
    expect(names[2]).toHaveTextContent("Gamma AAC");
  });

  it("filters by name", () => {
    render(<AACSearchPanel />);
    fireEvent.change(screen.getByPlaceholderText("Search by name or area…"), {
      target: { value: "beta" },
    });
    expect(
      screen.getByText(
        (_content, el) => el?.tagName === "P" && el.textContent === "1 centre",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Beta AAC (Clementi)")).toBeInTheDocument();
    expect(screen.queryByText("Alpha AAC (Bedok)")).not.toBeInTheDocument();
  });

  it("filters by address", () => {
    render(<AACSearchPanel />);
    fireEvent.change(screen.getByPlaceholderText("Search by name or area…"), {
      target: { value: "jurong" },
    });
    expect(
      screen.getByText(
        (_content, el) => el?.tagName === "P" && el.textContent === "1 centre",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Gamma AAC (Jurong)")).toBeInTheDocument();
  });

  it("shows empty state when no results match", () => {
    render(<AACSearchPanel />);
    fireEvent.change(screen.getByPlaceholderText("Search by name or area…"), {
      target: { value: "nonexistent" },
    });
    expect(screen.getByText("No centres found")).toBeInTheDocument();
    expect(screen.getByText("Clear search")).toBeInTheDocument();
  });

  it("sorts by distance when location is available", () => {
    setGeoState({ lat: 1.314, lng: 103.764, status: "success" });
    render(<AACSearchPanel />);

    expect(screen.getByText(/nearest first/)).toBeInTheDocument();
    const cards = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.includes("AAC"),
    );
    expect(cards[0]).toHaveTextContent("Beta AAC");
    expect(mockSetFlyToTarget).toHaveBeenCalledWith({
      lat: 1.314,
      lng: 103.764,
      altitude: 3000,
    });
  });

  it("flies map to user location on geolocation success", () => {
    setGeoState({ lat: 1.29, lng: 103.85, status: "success" });
    render(<AACSearchPanel />);

    expect(mockSetFlyToTarget).toHaveBeenCalledOnce();
    expect(mockSetFlyToTarget).toHaveBeenCalledWith({
      lat: 1.29,
      lng: 103.85,
      altitude: 3000,
    });
  });

  it("does not fly map when geolocation is idle", () => {
    setGeoState({ status: "idle" });
    render(<AACSearchPanel />);

    expect(mockSetFlyToTarget).not.toHaveBeenCalled();
  });

  it("calls requestLocation when button is clicked", () => {
    render(<AACSearchPanel />);
    fireEvent.click(screen.getByText("Use My Location"));
    expect(mockRequestLocation).toHaveBeenCalledOnce();
  });

  it("shows loading state during geolocation", () => {
    setGeoState({ status: "loading" });
    render(<AACSearchPanel />);
    expect(screen.getByText("Getting location…")).toBeInTheDocument();
  });

  it("shows error when location is denied", () => {
    setGeoState({ status: "denied", error: "Location access was denied." });
    render(<AACSearchPanel />);
    expect(screen.getByText("Location access was denied.")).toBeInTheDocument();
  });

  it("calls setSelectedPOI and setFlyToTarget when card is clicked", () => {
    render(<AACSearchPanel />);
    fireEvent.click(screen.getByText("Alpha AAC (Bedok)"));
    expect(mockSetSelectedPOI).toHaveBeenCalledWith(
      expect.objectContaining({ id: "aac-1" }),
    );
    expect(mockSetFlyToTarget).toHaveBeenCalledWith({ lat: 1.324, lng: 103.93 });
  });
});
