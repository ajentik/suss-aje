import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  Map3D: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map3d">{children}</div>
  ),
  Marker3DInteractive: () => <div data-testid="marker" />,
  AdvancedMarker: () => <div data-testid="advanced-marker" />,
  InfoWindow: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="info-window">{children}</div>
  ),
}));

import type { CampusEvent } from "@/types";
import { useAppStore } from "@/store/app-store";

const mockEvent: CampusEvent = {
  id: "evt-1",
  title: "SUSS Open Day",
  date: "2026-03-20",
  time: "10:00 AM – 4:00 PM",
  location: "SUSS Main Campus",
  category: "Open House",
  description: "Annual open day for prospective students",
  type: "On-Campus",
  school: "SUSS",
  lat: 1.33,
  lng: 103.776,
};

async function renderEventPopup() {
  const { default: EventPopup } = await import(
    "@/components/map/EventPopup"
  );
  return render(<EventPopup />);
}

async function renderEventDetailCard(props: {
  event: CampusEvent;
  onClose: () => void;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const { EventDetailCard } = await import("@/components/map/EventPopup");
  return render(<EventDetailCard {...props} />);
}

describe("EventPopup (desktop floating popup)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      selectedEvent: null,
      selectedPOI: null,
    });
  });

  it("renders nothing when selectedEvent is null", async () => {
    const { container } = await renderEventPopup();
    expect(container.innerHTML).toBe("");
  });

  it("renders event title, date, and location", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });

    await renderEventPopup();

    expect(screen.getByText("SUSS Open Day")).toBeInTheDocument();
    expect(screen.getByText("2026-03-20")).toBeInTheDocument();
    expect(screen.getByText("SUSS Main Campus")).toBeInTheDocument();
  });

  it("renders event time", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });

    await renderEventPopup();

    expect(
      screen.getByText("10:00 AM – 4:00 PM"),
    ).toBeInTheDocument();
  });

  it("close button clears selectedEvent", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });

    await renderEventPopup();

    fireEvent.click(
      screen.getByRole("button", { name: "Close popup" }),
    );
    expect(useAppStore.getState().selectedEvent).toBeNull();
  });

  it("Navigate here button triggers navigation", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });

    await renderEventPopup();

    fireEvent.click(screen.getByText("Navigate here"));
    expect(useAppStore.getState().selectedEvent).toBeNull();
  });
});

describe("EventDetailCard (mobile bottom sheet)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders event title, date, and location", async () => {
    await renderEventDetailCard({
      event: mockEvent,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
    });

    expect(screen.getByText("SUSS Open Day")).toBeInTheDocument();
    expect(screen.getByText(/2026-03-20/)).toBeInTheDocument();
    expect(screen.getByText("SUSS Main Campus")).toBeInTheDocument();
  });

  it("Navigate button calls onNavigate", async () => {
    const onNavigate = vi.fn();
    await renderEventDetailCard({
      event: mockEvent,
      onClose: vi.fn(),
      onNavigate,
    });

    fireEvent.click(screen.getByText("Navigate"));
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("Back to chat button calls onClose", async () => {
    const onClose = vi.fn();
    await renderEventDetailCard({
      event: mockEvent,
      onClose,
      onNavigate: vi.fn(),
    });

    fireEvent.click(screen.getByText("Back to chat"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows Join Online link for Online events", async () => {
    const onlineEvent: CampusEvent = {
      ...mockEvent,
      type: "Online",
      url: "https://zoom.us/j/123",
    };
    await renderEventDetailCard({
      event: onlineEvent,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
    });

    const link = screen.getByText("Join Online");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "https://zoom.us/j/123");
  });

  it("shows Navigate button for On-Campus events", async () => {
    await renderEventDetailCard({
      event: mockEvent,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
    });

    expect(screen.getByText("Navigate")).toBeInTheDocument();
  });

  it("renders expanded details with description, type, school", async () => {
    await renderEventDetailCard({
      event: mockEvent,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: false,
    });

    expect(screen.getByText(mockEvent.description)).toBeInTheDocument();
    expect(screen.getByText(mockEvent.type)).toBeInTheDocument();
    expect(screen.getByText(mockEvent.school)).toBeInTheDocument();
  });

  it("hides description and type/school badges when compact", async () => {
    await renderEventDetailCard({
      event: mockEvent,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: true,
    });

    expect(screen.queryByText(mockEvent.description)).not.toBeInTheDocument();
  });

  it("renders venueAddress when provided and not compact", async () => {
    const eventWithVenue: CampusEvent = {
      ...mockEvent,
      venueAddress: "463 Clementi Road, Level 3",
    };
    await renderEventDetailCard({
      event: eventWithVenue,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: false,
    });

    expect(screen.getByText("463 Clementi Road, Level 3")).toBeInTheDocument();
  });

  it("renders registration link when registrationUrl is provided", async () => {
    const eventWithReg: CampusEvent = {
      ...mockEvent,
      registrationUrl: "https://register.suss.edu.sg",
    };
    await renderEventDetailCard({
      event: eventWithReg,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: false,
    });

    const link = screen.getByText("Register");
    expect(link.closest("a")).toHaveAttribute("href", "https://register.suss.edu.sg");
  });

  it("renders Details link for non-Online events with url", async () => {
    const eventWithUrl: CampusEvent = {
      ...mockEvent,
      url: "https://suss.edu.sg/event/1",
    };
    await renderEventDetailCard({
      event: eventWithUrl,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
    });

    const link = screen.getByText("Details");
    expect(link.closest("a")).toHaveAttribute("href", "https://suss.edu.sg/event/1");
  });

  it("renders longDescription when provided", async () => {
    const eventWithLong: CampusEvent = {
      ...mockEvent,
      longDescription: "This is a much longer description of the event.",
    };
    await renderEventDetailCard({
      event: eventWithLong,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: false,
    });

    expect(screen.getByText("This is a much longer description of the event.")).toBeInTheDocument();
  });

  it("renders endDate range when provided", async () => {
    const eventWithEnd: CampusEvent = {
      ...mockEvent,
      endDate: "2026-03-22",
    };
    await renderEventDetailCard({
      event: eventWithEnd,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
    });

    expect(screen.getByText(/2026-03-20 – 2026-03-22/)).toBeInTheDocument();
  });
});

describe("EventPopup — touch and transition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ selectedEvent: null });
  });

  it("venueAddress renders in desktop popup", async () => {
    useAppStore.setState({
      selectedEvent: { ...mockEvent, venueAddress: "Block A, Room 3-01" },
    });
    await renderEventPopup();
    expect(screen.getByText("Block A, Room 3-01")).toBeInTheDocument();
  });

  it("renders type and school badges", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });
    await renderEventPopup();
    expect(screen.getByText("On-Campus")).toBeInTheDocument();
    expect(screen.getByText("SUSS")).toBeInTheDocument();
  });

  it("renders Details link for non-Online event with url", async () => {
    useAppStore.setState({
      selectedEvent: { ...mockEvent, url: "https://example.com" },
    });
    await renderEventPopup();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("renders Join Online for Online event with url", async () => {
    useAppStore.setState({
      selectedEvent: { ...mockEvent, type: "Online" as const, url: "https://zoom.us/j/123" },
    });
    await renderEventPopup();
    expect(screen.getByText("Join Online")).toBeInTheDocument();
  });

  it("renders description in desktop popup", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });
    await renderEventPopup();
    expect(screen.getByText(mockEvent.description)).toBeInTheDocument();
  });

  it("renders endDate range in desktop popup", async () => {
    useAppStore.setState({
      selectedEvent: { ...mockEvent, endDate: "2026-03-22" },
    });
    await renderEventPopup();
    expect(screen.getByText(/2026-03-20 – 2026-03-22/)).toBeInTheDocument();
  });

  it("touch swipe down far enough dismisses popup", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });
    const { container } = await renderEventPopup();

    const popup = container.firstChild as HTMLElement;
    if (popup) {
      fireEvent.touchStart(popup, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(popup, { touches: [{ clientY: 200 }] });
      fireEvent.touchEnd(popup);
    }
    expect(useAppStore.getState().selectedEvent).toBeNull();
  });

  it("touch swipe down not far enough keeps popup", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });
    const { container } = await renderEventPopup();

    const popup = container.firstChild as HTMLElement;
    if (popup) {
      fireEvent.touchStart(popup, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(popup, { touches: [{ clientY: 130 }] });
      fireEvent.touchEnd(popup);
    }
    expect(screen.getByText("SUSS Open Day")).toBeInTheDocument();
  });

  it("transition end clears fading-out event", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });
    const { container } = await renderEventPopup();

    fireEvent.click(screen.getByRole("button", { name: "Close popup" }));

    const popup = container.firstChild as HTMLElement;
    if (popup) {
      fireEvent.transitionEnd(popup);
    }
  });

  it("navigate sets street view for non-Online event", async () => {
    useAppStore.setState({ selectedEvent: mockEvent });
    await renderEventPopup();
    fireEvent.click(screen.getByText("Navigate here"));
    expect(useAppStore.getState().streetViewEvent).toEqual(mockEvent);
  });

  it("does not set street view for Online event", async () => {
    const onlineEvent = { ...mockEvent, type: "Online" as const };
    useAppStore.setState({ selectedEvent: onlineEvent });
    await renderEventPopup();

    expect(screen.queryByText("Navigate here")).not.toBeInTheDocument();
  });
});
