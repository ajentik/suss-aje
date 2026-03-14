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

vi.mock("@/lib/maps/aerial-view", () => ({
  lookupAerialVideo: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("focus-trap-react", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="focus-trap">{children}</div>
  ),
}));

import type { POI } from "@/types";
import { useAppStore } from "@/store/app-store";

const mockDestination: POI = {
  id: "lib-1",
  name: "SUSS Library",
  lat: 1.33,
  lng: 103.776,
  category: "Building",
  description: "Main campus library",
};

async function renderAerialViewButton() {
  const { default: AerialViewButton } = await import(
    "@/components/map/AerialViewButton"
  );
  return render(<AerialViewButton />);
}

describe("AerialViewButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ selectedDestination: null });
  });

  it("renders nothing when no destination is selected", async () => {
    const { container } = await renderAerialViewButton();
    expect(container.innerHTML).toBe("");
  });

  it("renders button with aria-label when destination selected", async () => {
    useAppStore.setState({ selectedDestination: mockDestination });

    await renderAerialViewButton();

    const button = screen.getByRole("button", {
      name: "Aerial flyover",
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Aerial flyover");
  });

  it("onClick fires without error", async () => {
    useAppStore.setState({ selectedDestination: mockDestination });

    await renderAerialViewButton();

    const button = screen.getByRole("button", {
      name: "Aerial flyover",
    });
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it("displays Aerial View label on desktop", async () => {
    useAppStore.setState({ selectedDestination: mockDestination });

    await renderAerialViewButton();

    expect(screen.getByText("Aerial View")).toBeInTheDocument();
  });
});
