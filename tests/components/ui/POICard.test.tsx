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

  it("renders price level as dollar signs", () => {
    render(<POICard poi={{ ...basePOI, priceLevel: 3 }} />);
    expect(screen.getByText("$$$")).toBeInTheDocument();
  });

  it("renders website link when expanded", () => {
    render(<POICard poi={{ ...basePOI, website: "https://example.com" }} />);
    fireEvent.click(screen.getByRole("button", { name: /SUSS Library/i }));

    const link = screen.getByText("Website");
    expect(link.closest("a")).toHaveAttribute("href", "https://example.com");
    expect(link.closest("a")).toHaveAttribute("target", "_blank");
  });

  it("renders phone contact when expanded", () => {
    render(<POICard poi={{ ...basePOI, contact: "+65 1234 5678" }} />);
    fireEvent.click(screen.getByRole("button", { name: /SUSS Library/i }));
    expect(screen.getByText("+65 1234 5678")).toBeInTheDocument();
  });

  it("renders call button for AAC POI with contact", () => {
    const aacPoi: POI = {
      ...basePOI,
      category: "Active Ageing Centre",
      contact: "+65 9999 0000",
    };
    render(<POICard poi={aacPoi} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(aacPoi.name) }));

    const callLink = screen.getByLabelText(`Call ${aacPoi.name}`);
    expect(callLink).toBeInTheDocument();
    expect(callLink).toHaveAttribute("href", "tel:+6599990000");
  });

  it("renders distance badge when distanceFromCampus is set", () => {
    render(<POICard poi={{ ...basePOI, distanceFromCampus: "5 min walk" }} />);
    expect(screen.getByText("5 min walk")).toBeInTheDocument();
  });

  it("does not render website link when not provided", () => {
    render(<POICard poi={{ ...basePOI, website: undefined }} />);
    fireEvent.click(screen.getByRole("button", { name: /SUSS Library/i }));
    expect(screen.queryByText("Website")).not.toBeInTheDocument();
  });

  it("toggles expand/collapse", () => {
    render(<POICard poi={basePOI} />);
    const btn = screen.getByRole("button", { name: /SUSS Library/i });

    fireEvent.click(btn);
    expect(screen.getByText("The main university library")).toBeInTheDocument();

    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });
});
