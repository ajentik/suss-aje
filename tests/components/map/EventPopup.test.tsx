import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-2d">{children}</div>
  ),
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
});
