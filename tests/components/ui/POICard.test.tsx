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

vi.mock("@/lib/maps/aac-events", () => ({
  getAACEventsForPOI: vi.fn(() => ({ regular: [], special: [] })),
  isOffSiteEvent: vi.fn(() => false),
  classifyAACEvent: vi.fn(() => "regular"),
}));

vi.mock("@/lib/date-utils", () => ({
  formatEventDate: vi.fn((d: string) => d),
  formatEventDateRange: vi.fn((d: string) => d),
}));

vi.mock("@/lib/event-icons", () => ({
  CATEGORY_ICON: {},
  DEFAULT_EVENT_ICON: () => null,
  CATEGORY_ICON_BG: {},
  DEFAULT_ICON_BG: "bg-muted",
}));

import POICard from "@/components/ui/POICard";
import type { POI } from "@/types";

const basePOI: POI = {
  id: "poi-1",
  name: "SUSS Library",
  lat: 1.314,
  lng: 103.764,
  category: "On-Campus",
  description: "The main university library",
  address: "463 Clementi Rd",
  hours: "Mon–Fri 8:30AM–9PM",
  rating: 4.5,
  tags: ["study", "books"],
};

describe("POICard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders name and category in collapsed state", () => {
    render(<POICard poi={basePOI} />);
    expect(screen.getByText("SUSS Library")).toBeInTheDocument();
    expect(screen.getByText("On-Campus")).toBeInTheDocument();
  });

  it("expands to show description, address, hours when clicked", () => {
    render(<POICard poi={basePOI} />);
    fireEvent.click(
      screen.getByRole("button", { name: /SUSS Library/i }),
    );

    expect(screen.getByText("The main university library")).toBeInTheDocument();
    expect(screen.getByText("463 Clementi Rd")).toBeInTheDocument();
    expect(screen.getByText("Mon–Fri 8:30AM–9PM")).toBeInTheDocument();
    expect(screen.getByText("4.5 / 5.0")).toBeInTheDocument();
  });

  it("shows tags when expanded", () => {
    render(<POICard poi={basePOI} />);
    fireEvent.click(
      screen.getByRole("button", { name: /SUSS Library/i }),
    );

    expect(screen.getByText("study")).toBeInTheDocument();
    expect(screen.getByText("books")).toBeInTheDocument();
  });

  it("calls store actions when 'Show on map' is clicked", () => {
    render(<POICard poi={basePOI} />);
    fireEvent.click(
      screen.getByRole("button", { name: /SUSS Library/i }),
    );
    fireEvent.click(screen.getByText("Show on map"));

    expect(mockSetFlyToTarget).toHaveBeenCalledWith({
      lat: basePOI.lat,
      lng: basePOI.lng,
    });
    expect(mockSetSelectedPOI).toHaveBeenCalledWith(basePOI);
  });
});
