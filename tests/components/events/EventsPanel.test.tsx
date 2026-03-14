/* eslint-disable jsx-a11y/aria-role */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import type { CampusEvent } from "@/types";

const mockSetMapEventMarkers = vi.fn();

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      eventDateFilter: "",
      setEventDateFilter: vi.fn(),
      eventCategoryFilter: "",
      setEventCategoryFilter: vi.fn(),
      setMapEventMarkers: mockSetMapEventMarkers,
      activePanel: "events",
      setActivePanel: vi.fn(),
      routeInfo: null,
      setRouteInfo: vi.fn(),
      selectedDestination: null,
      setSelectedDestination: vi.fn(),
      flyToTarget: null,
      setFlyToTarget: vi.fn(),
      userLocation: null,
      setUserLocation: vi.fn(),
      selectedEvent: null,
      setSelectedEvent: vi.fn(),
      streetViewEvent: null,
      setStreetViewEvent: vi.fn(),
    }),
  ),
}));

vi.mock("@/lib/event-icons", () => {
  const Stub = (props: Record<string, unknown>) => <svg data-testid="category-icon" {...props} />;
  return {
    CATEGORY_ICON: {},
    DEFAULT_EVENT_ICON: Stub,
    CATEGORY_ICON_BG: {},
    DEFAULT_ICON_BG: "bg-muted",
  };
});

const sampleEvents: CampusEvent[] = [
  {
    id: "evt-1",
    title: "Campus Tour",
    date: "2026-03-15",
    time: "09:00",
    location: "Main Lobby",
    category: "Open House",
    description: "Guided campus walkthrough",
    type: "On-Campus",
    school: "SUSS",
    lat: 1.3143,
    lng: 103.7647,
  },
  {
    id: "evt-2",
    title: "Career Fair",
    date: "2026-03-16",
    time: "14:00",
    location: "Atrium",
    category: "Career",
    description: "Meet potential employers",
    type: "On-Campus",
    school: "SUSS",
    lat: 1.3145,
    lng: 103.7649,
  },
];

let mockHookReturn: ReturnType<typeof import("@/hooks/useCampusEvents").useCampusEvents>;

vi.mock("@/hooks/useCampusEvents", () => ({
  useCampusEvents: vi.fn(() => mockHookReturn),
}));

import EventsPanel from "@/components/events/EventsPanel";

describe("EventsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn = {
      events: [],
      allEvents: [],
      categories: [],
      isLoading: true,
      dateFilter: "all",
      setDateFilter: vi.fn(),
      categoryFilter: "",
      setCategoryFilter: vi.fn(),
      schoolFilter: "",
      setSchoolFilter: vi.fn(),
    };
  });

  it("renders loading skeleton when isLoading is true", () => {
    mockHookReturn = { ...mockHookReturn, isLoading: true };
    const { container } = render(<EventsPanel />);
    const skeletons = container.querySelectorAll(".skeleton-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders events list when data arrives", () => {
    mockHookReturn = {
      ...mockHookReturn,
      isLoading: false,
      events: sampleEvents,
      allEvents: sampleEvents,
      categories: ["Open House", "Career"],
    };
    render(<EventsPanel />);

    expect(screen.getByText("Campus Tour")).toBeInTheDocument();
    expect(screen.getByText("Career Fair")).toBeInTheDocument();
  });

  it("renders event count summary", () => {
    mockHookReturn = {
      ...mockHookReturn,
      isLoading: false,
      events: sampleEvents,
      allEvents: sampleEvents,
      categories: ["Open House", "Career"],
    };
    render(<EventsPanel />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/events/)).toBeInTheDocument();
  });

  it("renders singular 'event' for single result", () => {
    mockHookReturn = {
      ...mockHookReturn,
      isLoading: false,
      events: [sampleEvents[0]],
      allEvents: [sampleEvents[0]],
      categories: ["Open House"],
    };
    render(<EventsPanel />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/event$/)).toBeInTheDocument();
  });

  it("renders empty state when no events match filters", () => {
    mockHookReturn = {
      ...mockHookReturn,
      isLoading: false,
      events: [],
      allEvents: sampleEvents,
      categories: ["Open House", "Career"],
    };
    render(<EventsPanel />);

    expect(screen.getByText("No events found")).toBeInTheDocument();
    expect(
      screen.getByText(/Try adjusting your filters/),
    ).toBeInTheDocument();
  });

  it("renders Clear all filters button in empty state", () => {
    mockHookReturn = {
      ...mockHookReturn,
      isLoading: false,
      events: [],
      allEvents: sampleEvents,
      categories: ["Open House", "Career"],
    };
    render(<EventsPanel />);

    expect(screen.getByText("Clear all filters")).toBeInTheDocument();
  });

  it("renders EventFilter component", () => {
    mockHookReturn = {
      ...mockHookReturn,
      isLoading: false,
      events: sampleEvents,
      allEvents: sampleEvents,
      categories: ["Open House", "Career"],
    };
    render(<EventsPanel />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
  });

  it("calls setMapEventMarkers with events", () => {
    mockHookReturn = {
      ...mockHookReturn,
      isLoading: false,
      events: sampleEvents,
      allEvents: sampleEvents,
      categories: ["Open House", "Career"],
    };
    render(<EventsPanel />);

    expect(mockSetMapEventMarkers).toHaveBeenCalledWith(sampleEvents);
  });

  it("transitions from loading to events", () => {
    mockHookReturn = { ...mockHookReturn, isLoading: true };
    const { container, rerender } = render(<EventsPanel />);
    expect(container.querySelectorAll(".skeleton-shimmer").length).toBeGreaterThan(0);

    mockHookReturn = {
      ...mockHookReturn,
      isLoading: false,
      events: sampleEvents,
      allEvents: sampleEvents,
      categories: ["Open House", "Career"],
    };
    rerender(<EventsPanel />);
    expect(screen.getByText("Campus Tour")).toBeInTheDocument();
    expect(container.querySelectorAll(".skeleton-shimmer").length).toBe(0);
  });
});
