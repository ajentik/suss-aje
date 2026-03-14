import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/maps/aac-events", () => ({
  isOffSiteEvent: vi.fn(() => false),
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

import EventRow from "@/components/ui/EventRow";
import type { CampusEvent } from "@/types";

function makeEvent(overrides: Partial<CampusEvent> = {}): CampusEvent {
  return {
    id: "evt-1",
    title: "Open House Tour",
    date: "2026-05-01",
    time: "10:00",
    location: "Block A",
    category: "Open House",
    description: "Guided tour of the campus",
    type: "On-Campus",
    school: "SUSS",
    lat: 1.314,
    lng: 103.764,
    ...overrides,
  };
}

describe("EventRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders date, title, and time", () => {
    render(<EventRow event={makeEvent()} onEventClick={vi.fn()} />);
    expect(screen.getByText("Open House Tour")).toBeInTheDocument();
    expect(screen.getByText("2026-05-01")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("renders description when present", () => {
    render(<EventRow event={makeEvent()} onEventClick={vi.fn()} />);
    expect(screen.getByText("Guided tour of the campus")).toBeInTheDocument();
  });

  it("fires onEventClick with the event when clicked", () => {
    const onEventClick = vi.fn();
    const event = makeEvent();
    render(<EventRow event={event} onEventClick={onEventClick} />);

    fireEvent.click(screen.getByText("Open House Tour"));
    expect(onEventClick).toHaveBeenCalledOnce();
    expect(onEventClick).toHaveBeenCalledWith(event);
  });

  it("renders external link when event has url", () => {
    const event = makeEvent({ url: "https://example.com" });
    render(<EventRow event={event} onEventClick={vi.fn()} />);
    expect(
      screen.getByRole("link", { name: /open.*details/i }),
    ).toHaveAttribute("href", "https://example.com");
  });

  it("does not render external link when event has no url", () => {
    render(<EventRow event={makeEvent()} onEventClick={vi.fn()} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("hides description and time in compact mode", () => {
    render(
      <EventRow event={makeEvent()} onEventClick={vi.fn()} compact />,
    );
    expect(screen.getByText("Open House Tour")).toBeInTheDocument();
    expect(screen.queryByText("10:00")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Guided tour of the campus"),
    ).not.toBeInTheDocument();
  });
});
