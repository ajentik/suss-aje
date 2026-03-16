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

const mockWalkTo = vi.fn();
vi.mock("@/hooks/useWalkingRoute", () => ({
  useWalkingRoute: () => ({ walkTo: mockWalkTo, isLoading: false }),
}));

vi.mock("@/components/ui/AACEventsSection", () => ({
  default: () => <div data-testid="aac-events-section" />,
}));

vi.mock("@/components/ui/EventRow", () => ({
  default: () => <div data-testid="event-row" />,
}));

vi.mock("@/../public/campus-events.json", () => ({ default: [] }));

import type { POI } from "@/types";
import { useAppStore } from "@/store/app-store";

const mockPOI: POI = {
  id: "food-1",
  name: "Foodclique",
  lat: 1.33,
  lng: 103.776,
  category: "Restaurant",
  description: "Campus canteen",
  address: "463 Clementi Rd, Level 1",
  hours: "Mon–Fri 7AM–8PM",
  rating: 4.2,
};

async function renderPOIPopup() {
  const { default: POIPopup } = await import("@/components/map/POIPopup");
  return render(<POIPopup />);
}

async function renderPOIDetailCard(props: {
  poi: POI;
  onClose: () => void;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const { POIDetailCard } = await import("@/components/map/POIPopup");
  return render(<POIDetailCard {...props} />);
}

describe("POIPopup (desktop floating popup)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      selectedPOI: null,
      selectedEvent: null,
    });
  });

  it("renders nothing when selectedPOI is null", async () => {
    const { container } = await renderPOIPopup();
    expect(container.innerHTML).toBe("");
  });

  it("renders POI name, category, and address", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });

    await renderPOIPopup();

    expect(screen.getByText("Foodclique")).toBeInTheDocument();
    expect(screen.getByText("Restaurant")).toBeInTheDocument();
    expect(
      screen.getByText("463 Clementi Rd, Level 1"),
    ).toBeInTheDocument();
  });

  it("renders Walk here button", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });

    await renderPOIPopup();

    expect(screen.getByText("Walk here")).toBeInTheDocument();
  });

  it("Walk here button calls walkTo with the POI", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });

    await renderPOIPopup();

    fireEvent.click(screen.getByText("Walk here"));
    expect(mockWalkTo).toHaveBeenCalledOnce();
    expect(mockWalkTo).toHaveBeenCalledWith(mockPOI);
  });

  it("Navigate here button calls setSelectedDestination", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });

    await renderPOIPopup();

    fireEvent.click(screen.getByText("Navigate here"));

    const state = useAppStore.getState();
    expect(state.selectedDestination).toEqual(mockPOI);
  });

  it("close button clears selectedPOI", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });

    await renderPOIPopup();

    fireEvent.click(
      screen.getByRole("button", { name: "Close popup" }),
    );
    expect(useAppStore.getState().selectedPOI).toBeNull();
  });
});

describe("POIDetailCard (mobile bottom sheet)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders POI name, category, and address", async () => {
    await renderPOIDetailCard({
      poi: mockPOI,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
    });

    expect(screen.getByText("Foodclique")).toBeInTheDocument();
    expect(screen.getByText("Restaurant")).toBeInTheDocument();
    expect(
      screen.getAllByText("463 Clementi Rd, Level 1").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("Walk here button calls walkTo", async () => {
    await renderPOIDetailCard({
      poi: mockPOI,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
    });

    fireEvent.click(screen.getByRole("button", { name: /walk/i }));
    expect(mockWalkTo).toHaveBeenCalledOnce();
  });

  it("Navigate button calls onNavigate", async () => {
    const onNavigate = vi.fn();
    await renderPOIDetailCard({
      poi: mockPOI,
      onClose: vi.fn(),
      onNavigate,
    });

    fireEvent.click(screen.getByText("Navigate"));
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("Back to chat button calls onClose", async () => {
    const onClose = vi.fn();
    await renderPOIDetailCard({
      poi: mockPOI,
      onClose,
      onNavigate: vi.fn(),
    });

    fireEvent.click(screen.getByText("Back to chat"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
