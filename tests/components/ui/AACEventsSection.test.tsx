import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetSelectedEvent = vi.fn();
const mockSetFlyToTarget = vi.fn();

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setSelectedEvent: mockSetSelectedEvent,
      setFlyToTarget: mockSetFlyToTarget,
    }),
  ),
}));

vi.mock("@/lib/maps/aac-events", () => ({
  getAACEventsForPOI: vi.fn(),
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

import AACEventsSection from "@/components/ui/AACEventsSection";
import type { POI, CampusEvent } from "@/types";
import type { AACEventsByKind } from "@/lib/maps/aac-events";

const basePOI: POI = {
  id: "poi-1",
  name: "Test Centre",
  lat: 1.314,
  lng: 103.764,
  category: "Active Ageing Centre",
  description: "Test",
};

function makeEvent(overrides: Partial<CampusEvent> = {}): CampusEvent {
  return {
    id: "evt-1",
    title: "Morning Tai Chi",
    date: "2026-04-01",
    time: "09:00",
    location: "Test Centre",
    category: "Social",
    description: "Tai chi session",
    type: "On-Campus",
    school: "SUSS",
    lat: 1.314,
    lng: 103.764,
    ...overrides,
  };
}

describe("AACEventsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders event items from precomputed events", () => {
    const events: AACEventsByKind = {
      regular: [makeEvent(), makeEvent({ id: "evt-2", title: "Afternoon Walk" })],
      special: [],
    };
    render(<AACEventsSection poi={basePOI} precomputedEvents={events} />);

    expect(screen.getByText("Morning Tai Chi")).toBeInTheDocument();
    expect(screen.getByText("Afternoon Walk")).toBeInTheDocument();
    expect(screen.getByText("Events (2)")).toBeInTheDocument();
  });

  it("returns null when no events", () => {
    const events: AACEventsByKind = { regular: [], special: [] };
    const { container } = render(
      <AACEventsSection poi={basePOI} precomputedEvents={events} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows tab buttons when both kinds have events", () => {
    const events: AACEventsByKind = {
      regular: [makeEvent()],
      special: [makeEvent({ id: "evt-s1", title: "Workshop" })],
    };
    render(<AACEventsSection poi={basePOI} precomputedEvents={events} />);

    expect(screen.getByText("Regular (1)")).toBeInTheDocument();
    expect(screen.getByText("Special (1)")).toBeInTheDocument();
  });

  it("switches tab to show special events", () => {
    const events: AACEventsByKind = {
      regular: [makeEvent()],
      special: [makeEvent({ id: "evt-s1", title: "Cooking Workshop" })],
    };
    render(<AACEventsSection poi={basePOI} precomputedEvents={events} />);

    expect(screen.getByText("Morning Tai Chi")).toBeInTheDocument();
    expect(screen.queryByText("Cooking Workshop")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Special (1)"));
    expect(screen.getByText("Cooking Workshop")).toBeInTheDocument();
  });

  it("calls store callbacks when an event row is clicked", () => {
    const event = makeEvent();
    const events: AACEventsByKind = {
      regular: [event],
      special: [],
    };
    render(<AACEventsSection poi={basePOI} precomputedEvents={events} />);

    fireEvent.click(screen.getByText("Morning Tai Chi"));
    expect(mockSetFlyToTarget).toHaveBeenCalledWith({
      lat: event.lat,
      lng: event.lng,
    });
    expect(mockSetSelectedEvent).toHaveBeenCalledWith(event);
  });
});
