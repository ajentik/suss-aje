import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetFlyToTarget = vi.fn();
const mockSetSelectedEvent = vi.fn();
const mockSetStreetViewEvent = vi.fn();

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setFlyToTarget: mockSetFlyToTarget,
      setSelectedEvent: mockSetSelectedEvent,
      setStreetViewEvent: mockSetStreetViewEvent,
    }),
  ),
}));

vi.mock("@/lib/event-icons", () => {
  const Stub = (props: Record<string, unknown>) => <svg data-testid="category-icon" {...props} />;
  return {
    CATEGORY_ICON: { "Information Session": Stub },
    DEFAULT_EVENT_ICON: Stub,
    CATEGORY_ICON_BG: { "Information Session": "bg-blue-500/10" },
    DEFAULT_ICON_BG: "bg-muted",
  };
});

import EventCard from "@/components/events/EventCard";
import type { CampusEvent } from "@/types";

const mockEvent: CampusEvent = {
  id: "evt-1",
  title: "Open Day 2026",
  date: "2026-03-15",
  time: "10:00",
  location: "SUSS Campus, Level 3",
  category: "Information Session",
  description: "Come explore the campus!",
  type: "On-Campus",
  school: "SUSS",
  lat: 1.3143,
  lng: 103.7647,
  venueAddress: "461 Clementi Rd",
  registrationUrl: "https://example.com/register",
};

const multiDayEvent: CampusEvent = {
  ...mockEvent,
  id: "evt-2",
  endDate: "2026-03-17",
};

describe("EventCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders event title", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("Open Day 2026")).toBeInTheDocument();
  });

  it("renders date display", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("2026-03-15")).toBeInTheDocument();
  });

  it("renders multi-day date range", () => {
    render(<EventCard event={multiDayEvent} />);
    expect(screen.getByText("2026-03-15 \u2013 2026-03-17")).toBeInTheDocument();
  });

  it("renders time", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("Information Session")).toBeInTheDocument();
  });

  it("renders event type badge", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getAllByText("On-Campus").length).toBeGreaterThanOrEqual(1);
  });

  it("renders location", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("SUSS Campus, Level 3")).toBeInTheDocument();
  });

  it("renders venue address when different from location", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("461 Clementi Rd")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("Come explore the campus!")).toBeInTheDocument();
  });

  it("renders school badge", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("SUSS")).toBeInTheDocument();
  });

  it("renders registration link", () => {
    render(<EventCard event={mockEvent} />);
    const link = screen.getByText("Register");
    expect(link.closest("a")).toHaveAttribute("href", "https://example.com/register");
    expect(link.closest("a")).toHaveAttribute("target", "_blank");
  });

  it("renders navigate button for on-campus events", () => {
    render(<EventCard event={mockEvent} />);
    const navButtons = screen.getAllByText("Navigate");
    expect(navButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls setFlyToTarget and setSelectedEvent on card click", () => {
    render(<EventCard event={mockEvent} />);
    const card = screen.getByRole("button", { name: /View Open Day 2026 on map/ });
    fireEvent.click(card);

    expect(mockSetFlyToTarget).toHaveBeenCalledOnce();
    expect(mockSetFlyToTarget).toHaveBeenCalledWith({ lat: 1.3143, lng: 103.7647 });
    expect(mockSetSelectedEvent).toHaveBeenCalledOnce();
    expect(mockSetSelectedEvent).toHaveBeenCalledWith(mockEvent);
  });

  it("fires click via Enter key (keyboard accessibility)", () => {
    render(<EventCard event={mockEvent} />);
    const card = screen.getByRole("button", { name: /View Open Day 2026 on map/ });
    fireEvent.keyDown(card, { key: "Enter", code: "Enter" });
    fireEvent.click(card);

    expect(mockSetFlyToTarget).toHaveBeenCalled();
    expect(mockSetSelectedEvent).toHaveBeenCalled();
  });

  it("fires click via Space key (keyboard accessibility)", () => {
    render(<EventCard event={mockEvent} />);
    const card = screen.getByRole("button", { name: /View Open Day 2026 on map/ });
    fireEvent.keyUp(card, { key: " ", code: "Space" });
    fireEvent.click(card);

    expect(mockSetFlyToTarget).toHaveBeenCalled();
    expect(mockSetSelectedEvent).toHaveBeenCalled();
  });

  it("has accessible aria-label", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByRole("button", { name: /View Open Day 2026 on map/ })).toBeInTheDocument();
  });

  it("calls setStreetViewEvent when Navigate is clicked", () => {
    render(<EventCard event={mockEvent} />);
    const navButtons = screen.getAllByText("Navigate");
    const navButton = navButtons.find((el) => el.tagName !== "title")!;
    fireEvent.click(navButton);

    expect(mockSetStreetViewEvent).toHaveBeenCalledOnce();
    expect(mockSetStreetViewEvent).toHaveBeenCalledWith(mockEvent);
    expect(mockSetFlyToTarget).not.toHaveBeenCalled();
  });

  it("renders Join Online link for online events", () => {
    const onlineEvent: CampusEvent = {
      ...mockEvent,
      type: "Online",
      url: "https://zoom.us/meeting",
    };
    render(<EventCard event={onlineEvent} />);
    const link = screen.getByText("Join Online");
    expect(link.closest("a")).toHaveAttribute("href", "https://zoom.us/meeting");
  });
});
