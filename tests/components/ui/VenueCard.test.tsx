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

  it("renders price level indicator", () => {
    render(<VenueCard venue={baseVenue} />);
    const { container } = render(<VenueCard venue={{ ...baseVenue, priceLevel: 2 as POI["priceLevel"] }} />);
    expect(container.textContent).toContain("$");
  });

  it("opens google maps on Navigate click", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<VenueCard venue={baseVenue} />);
    fireEvent.click(screen.getByRole("button", { name: /Foodclique/i }));
    fireEvent.click(screen.getByText("Navigate"));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("google.com/maps/dir"),
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });

  it("calls tel: link on Call click", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<VenueCard venue={baseVenue} />);
    fireEvent.click(screen.getByRole("button", { name: /Foodclique/i }));
    fireEvent.click(screen.getByRole("button", { name: "Call" }));

    expect(openSpy).toHaveBeenCalledWith("tel:+6561234567", "_self");
    openSpy.mockRestore();
  });

  it("opens website on Website click", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<VenueCard venue={baseVenue} />);
    fireEvent.click(screen.getByRole("button", { name: /Foodclique/i }));
    fireEvent.click(screen.getByRole("button", { name: "Website" }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });

  it("toggles expand/collapse with aria-expanded", () => {
    render(<VenueCard venue={baseVenue} />);
    const header = screen.getByRole("button", { name: /Foodclique/i });
    expect(header).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("renders without optional fields", () => {
    const minVenue: POI = {
      id: "v-2",
      name: "Simple Venue",
      lat: 1.33,
      lng: 103.77,
      category: "Food",
      description: "A venue",
    };
    render(<VenueCard venue={minVenue} />);
    expect(screen.getByText("Simple Venue")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Simple Venue/i }));
    expect(screen.queryByRole("button", { name: "Call" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Website" })).not.toBeInTheDocument();
  });
});
