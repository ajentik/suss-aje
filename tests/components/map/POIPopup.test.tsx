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

  it("renders hours, rating, and address in expanded mode", async () => {
    await renderPOIDetailCard({
      poi: mockPOI,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: false,
    });

    expect(screen.getByText(mockPOI.description)).toBeInTheDocument();
    expect(screen.getByText("4.2 / 5.0")).toBeInTheDocument();
  });

  it("hides expanded content when compact", async () => {
    await renderPOIDetailCard({
      poi: mockPOI,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: true,
    });

    expect(screen.queryByText(mockPOI.description)).not.toBeInTheDocument();
    expect(screen.queryByText("4.2 / 5.0")).not.toBeInTheDocument();
  });

  it("renders cuisine when provided", async () => {
    const poiWithCuisine: POI = { ...mockPOI, cuisine: "Japanese" };
    await renderPOIDetailCard({
      poi: poiWithCuisine,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: false,
    });

    expect(screen.getByText("Japanese")).toBeInTheDocument();
  });

  it("renders price level when provided", async () => {
    const poiWithPrice: POI = { ...mockPOI, priceLevel: 3 as POI["priceLevel"] };
    await renderPOIDetailCard({
      poi: poiWithPrice,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: false,
    });

    expect(screen.getByText("$$$")).toBeInTheDocument();
  });

  it("renders website link when provided", async () => {
    const poiWithWebsite: POI = { ...mockPOI, website: "https://foodclique.sg" };
    await renderPOIDetailCard({
      poi: poiWithWebsite,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
    });

    const link = screen.getByText("Website");
    expect(link.closest("a")).toHaveAttribute("href", "https://foodclique.sg");
  });

  it("renders AACEventsSection for Active Ageing Centre POI", async () => {
    const aacPOI: POI = { ...mockPOI, category: "Active Ageing Centre" };
    await renderPOIDetailCard({
      poi: aacPOI,
      onClose: vi.fn(),
      onNavigate: vi.fn(),
      compact: false,
    });

    expect(screen.getByTestId("aac-events-section")).toBeInTheDocument();
  });
});

describe("POIPopup — desktop expanded details", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      selectedPOI: null,
      selectedEvent: null,
    });
  });

  it("renders hours in desktop popup", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });
    await renderPOIPopup();
    expect(screen.getByText("Mon–Fri 7AM–8PM")).toBeInTheDocument();
  });

  it("renders rating in desktop popup", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });
    await renderPOIPopup();
    expect(screen.getByText("4.2 / 5.0")).toBeInTheDocument();
  });

  it("renders AACEventsSection for AAC POI in desktop popup", async () => {
    const aacPOI: POI = { ...mockPOI, category: "Active Ageing Centre" };
    useAppStore.setState({ selectedPOI: aacPOI });
    await renderPOIPopup();
    expect(screen.getByTestId("aac-events-section")).toBeInTheDocument();
  });

  it("renders description in desktop popup", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });
    await renderPOIPopup();
    expect(screen.getByText("Campus canteen")).toBeInTheDocument();
  });

  it("fade-out transition clears after selectedPOI is null", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });
    const { container } = await renderPOIPopup();

    fireEvent.click(screen.getByRole("button", { name: "Close popup" }));

    const popup = container.firstChild as HTMLElement;
    if (popup) {
      fireEvent.transitionEnd(popup);
    }
  });

  it("touch swipe down far enough dismisses popup", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });
    const { container } = await renderPOIPopup();

    const popup = container.firstChild as HTMLElement;
    if (popup) {
      fireEvent.touchStart(popup, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(popup, { touches: [{ clientY: 200 }] });
      fireEvent.touchEnd(popup);
    }
    expect(useAppStore.getState().selectedPOI).toBeNull();
  });

  it("touch swipe down not far enough keeps popup", async () => {
    useAppStore.setState({ selectedPOI: mockPOI });
    const { container } = await renderPOIPopup();

    const popup = container.firstChild as HTMLElement;
    if (popup) {
      fireEvent.touchStart(popup, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(popup, { touches: [{ clientY: 130 }] });
      fireEvent.touchEnd(popup);
    }
    expect(screen.getByText("Foodclique")).toBeInTheDocument();
  });

  it("POI without address/hours/rating renders cleanly", async () => {
    const minimalPOI: POI = {
      id: "min-1",
      name: "Minimal POI",
      lat: 1.33,
      lng: 103.77,
      category: "Building",
      description: "A simple building",
    };
    useAppStore.setState({ selectedPOI: minimalPOI });
    await renderPOIPopup();
    expect(screen.getByText("Minimal POI")).toBeInTheDocument();
    expect(screen.getByText("A simple building")).toBeInTheDocument();
  });
});
