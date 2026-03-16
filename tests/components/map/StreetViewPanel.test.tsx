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

const mockSetVisible = vi.fn();

const mockStreetViewPanorama = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
  this.setVisible = mockSetVisible;
});
const mockClearInstanceListeners = vi.fn();

Object.defineProperty(window, "google", {
  value: {
    maps: {
      StreetViewPanorama: mockStreetViewPanorama,
      event: {
        clearInstanceListeners: mockClearInstanceListeners,
      },
    },
  },
  writable: true,
});

import StreetViewPanel from "@/components/map/StreetViewPanel";
import type { CampusEvent } from "@/types";

const mockLocation = { lat: 1.33, lng: 103.776 };

const mockEventInfo: CampusEvent = {
  id: "evt-sv",
  title: "Campus Tour",
  date: "2026-03-20",
  time: "2:00 PM",
  location: "SUSS Main Campus",
  category: "Tour",
  description: "Guided campus walkthrough",
  type: "On-Campus",
  school: "SUSS",
  lat: 1.33,
  lng: 103.776,
};

describe("StreetViewPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetVisible.mockClear();
    mockClearInstanceListeners.mockClear();
  });

  it("renders with given coordinates and creates StreetViewPanorama", () => {
    render(<StreetViewPanel location={mockLocation} onClose={vi.fn()} />);

    expect(mockStreetViewPanorama).toHaveBeenCalledOnce();
    const callArgs = mockStreetViewPanorama.mock.calls[0];
    expect(callArgs[1]).toMatchObject({ position: mockLocation });
  });

  it("renders Back to Map button", () => {
    render(<StreetViewPanel location={mockLocation} onClose={vi.fn()} />);

    expect(screen.getByText("Back to Map")).toBeInTheDocument();
  });

  it("close button fires onClose", () => {
    const onClose = vi.fn();
    render(<StreetViewPanel location={mockLocation} onClose={onClose} />);

    fireEvent.click(screen.getByText("Back to Map"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders event info overlay when eventInfo is provided", () => {
    render(
      <StreetViewPanel
        location={mockLocation}
        onClose={vi.fn()}
        eventInfo={mockEventInfo}
      />,
    );

    expect(screen.getByText("Campus Tour")).toBeInTheDocument();
    expect(screen.getByText(/2026-03-20/)).toBeInTheDocument();
    expect(screen.getByText("SUSS Main Campus")).toBeInTheDocument();
  });

  it("does not render event overlay when eventInfo is absent", () => {
    render(<StreetViewPanel location={mockLocation} onClose={vi.fn()} />);

    expect(screen.queryByText("Campus Tour")).not.toBeInTheDocument();
  });

  it("cleans up panorama on unmount", () => {
    const { unmount } = render(
      <StreetViewPanel location={mockLocation} onClose={vi.fn()} />,
    );

    expect(mockStreetViewPanorama).toHaveBeenCalledOnce();

    unmount();

    expect(mockSetVisible).toHaveBeenCalledWith(false);
    expect(mockClearInstanceListeners).toHaveBeenCalledOnce();
  });
});
