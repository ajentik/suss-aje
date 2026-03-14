import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetSelectedPOI = vi.fn();
const mockSetFlyToTarget = vi.fn();

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setSelectedPOI: mockSetSelectedPOI,
      setFlyToTarget: mockSetFlyToTarget,
    }),
  ),
}));

import VenueCard from "@/components/ui/VenueCard";
import type { POI } from "@/types";

const baseVenue: POI = {
  id: "v-1",
  name: "Foodclique",
  lat: 1.315,
  lng: 103.765,
  category: "Restaurant",
  description: "Campus canteen with various stalls",
  address: "463 Clementi Rd #01-01",
  hours: "Mon–Sat 7AM–9PM",
  rating: 4.2,
  cuisine: "Mixed",
  distanceFromCampus: "On campus",
  priceLevel: 1,
  tags: ["halal", "value"],
  website: "https://example.com",
  contact: "+6561234567",
};

describe("VenueCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders venue name and category icon area in collapsed state", () => {
    render(<VenueCard venue={baseVenue} />);
    expect(screen.getByText("Foodclique")).toBeInTheDocument();
  });

  it("renders rating and distance", () => {
    render(<VenueCard venue={baseVenue} />);
    expect(screen.getByText("4.2")).toBeInTheDocument();
    expect(screen.getByText("On campus")).toBeInTheDocument();
  });

  it("renders cuisine", () => {
    render(<VenueCard venue={baseVenue} />);
    expect(screen.getByText("Mixed")).toBeInTheDocument();
  });

  it("expands to show description, address, hours when clicked", () => {
    render(<VenueCard venue={baseVenue} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Foodclique/i }),
    );

    expect(
      screen.getByText("Campus canteen with various stalls"),
    ).toBeInTheDocument();
    expect(screen.getByText("463 Clementi Rd #01-01")).toBeInTheDocument();
    expect(screen.getByText("Mon–Sat 7AM–9PM")).toBeInTheDocument();
  });

  it("shows tags when expanded", () => {
    render(<VenueCard venue={baseVenue} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Foodclique/i }),
    );
    expect(screen.getByText("halal")).toBeInTheDocument();
    expect(screen.getByText("value")).toBeInTheDocument();
  });

  it("calls store when 'Show on map' clicked", () => {
    render(<VenueCard venue={baseVenue} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Foodclique/i }),
    );
    fireEvent.click(screen.getByText("Show on map"));

    expect(mockSetFlyToTarget).toHaveBeenCalledWith({
      lat: baseVenue.lat,
      lng: baseVenue.lng,
    });
    expect(mockSetSelectedPOI).toHaveBeenCalledWith(baseVenue);
  });
});
