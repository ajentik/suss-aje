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

  it("shows video overlay after clicking and video resolves", async () => {
    const { lookupAerialVideo } = await import("@/lib/maps/aerial-view");
    vi.mocked(lookupAerialVideo).mockResolvedValueOnce({
      uris: { VIDEO_MP4_HIGH: "https://cdn.example.com/aerial.mp4" },
    });

    useAppStore.setState({ selectedDestination: mockDestination });
    await renderAerialViewButton();

    const button = screen.getByRole("button", { name: "Aerial flyover" });
    await fireEvent.click(button);

    await vi.waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Aerial flyover video" })).toBeInTheDocument();
    });
  });

  it("closes video overlay when close button clicked", async () => {
    const { lookupAerialVideo } = await import("@/lib/maps/aerial-view");
    vi.mocked(lookupAerialVideo).mockResolvedValueOnce({
      uris: { VIDEO_MP4_MEDIUM: "https://cdn.example.com/aerial.mp4" },
    });

    useAppStore.setState({ selectedDestination: mockDestination });
    await renderAerialViewButton();

    await fireEvent.click(screen.getByRole("button", { name: "Aerial flyover" }));

    await vi.waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Close aerial view" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes video on Escape key", async () => {
    const { lookupAerialVideo } = await import("@/lib/maps/aerial-view");
    vi.mocked(lookupAerialVideo).mockResolvedValueOnce({
      uris: { VIDEO_MP4_HIGH: "https://cdn.example.com/aerial.mp4" },
    });

    useAppStore.setState({ selectedDestination: mockDestination });
    await renderAerialViewButton();

    await fireEvent.click(screen.getByRole("button", { name: "Aerial flyover" }));

    await vi.waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows destination name in video overlay", async () => {
    const { lookupAerialVideo } = await import("@/lib/maps/aerial-view");
    vi.mocked(lookupAerialVideo).mockResolvedValueOnce({
      uris: { VIDEO_MP4_HIGH: "https://cdn.example.com/aerial.mp4" },
    });

    useAppStore.setState({ selectedDestination: mockDestination });
    await renderAerialViewButton();

    await fireEvent.click(screen.getByRole("button", { name: "Aerial flyover" }));

    await vi.waitFor(() => {
      expect(screen.getByText(/SUSS Library/)).toBeInTheDocument();
    });
  });
});
