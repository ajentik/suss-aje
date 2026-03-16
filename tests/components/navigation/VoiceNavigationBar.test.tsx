import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockStart = vi.fn();
const mockStop = vi.fn();
const mockToggleMute = vi.fn();

let mockNavState = {
  isNavigating: false,
  currentStepIndex: 0,
  distanceToNextMeters: 120,
  isSpeaking: false,
  isOffRoute: false,
  voiceMuted: false,
  start: mockStart,
  stop: mockStop,
  toggleMute: mockToggleMute,
};

vi.mock("@/hooks/useVoiceNavigation", () => ({
  useVoiceNavigation: () => mockNavState,
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      routeInfo: {
        polyline: [{ lat: 1.33, lng: 103.776 }],
        distanceMeters: 300,
        duration: "4 min",
        steps: [
          {
            instruction: "Head north on Clementi Road",
            distanceToNextMeters: 150,
            durationText: "2 min",
            maneuver: "STRAIGHT",
          },
          {
            instruction: "Turn left at the entrance",
            distanceToNextMeters: 150,
            durationText: "2 min",
            maneuver: "TURN_LEFT",
          },
        ],
      },
    }),
  ),
}));

describe("VoiceNavigationBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavState = {
      isNavigating: false,
      currentStepIndex: 0,
      distanceToNextMeters: 120,
      isSpeaking: false,
      isOffRoute: false,
      voiceMuted: false,
      start: mockStart,
      stop: mockStop,
      toggleMute: mockToggleMute,
    };
  });

  async function renderBar() {
    const { default: VoiceNavigationBar } = await import(
      "@/components/navigation/VoiceNavigationBar"
    );
    return render(<VoiceNavigationBar />);
  }

  it("renders nothing when not navigating", async () => {
    mockNavState.isNavigating = false;
    const { container } = await renderBar();
    expect(container.innerHTML).toBe("");
  });

  it("renders current step instruction when navigating", async () => {
    mockNavState.isNavigating = true;
    await renderBar();
    expect(screen.getByText("Head north on Clementi Road")).toBeInTheDocument();
  });

  it("renders distance to next waypoint", async () => {
    mockNavState.isNavigating = true;
    mockNavState.distanceToNextMeters = 120;
    await renderBar();
    expect(screen.getByText("120m")).toBeInTheDocument();
  });

  it("renders step counter", async () => {
    mockNavState.isNavigating = true;
    mockNavState.currentStepIndex = 0;
    await renderBar();
    expect(screen.getByText("Step 1/2")).toBeInTheDocument();
  });

  it("stop button calls stop()", async () => {
    mockNavState.isNavigating = true;
    await renderBar();

    const stopBtn = screen.getByRole("button", { name: "Stop navigation" });
    fireEvent.click(stopBtn);
    expect(mockStop).toHaveBeenCalledOnce();
  });

  it("mute button calls toggleMute()", async () => {
    mockNavState.isNavigating = true;
    await renderBar();

    const muteBtn = screen.getByRole("button", { name: "Mute voice" });
    fireEvent.click(muteBtn);
    expect(mockToggleMute).toHaveBeenCalledOnce();
  });

  it("shows unmute label when voice is muted", async () => {
    mockNavState.isNavigating = true;
    mockNavState.voiceMuted = true;
    await renderBar();

    expect(
      screen.getByRole("button", { name: "Unmute voice" }),
    ).toBeInTheDocument();
  });

  it("shows off-route warning when off route", async () => {
    mockNavState.isNavigating = true;
    mockNavState.isOffRoute = true;
    await renderBar();

    expect(screen.getByText(/off route/i)).toBeInTheDocument();
  });

  it("has aria-label for accessibility", async () => {
    mockNavState.isNavigating = true;
    await renderBar();

    const nav = screen.getByRole("navigation", { name: "Voice navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("formats distance as km for large values", async () => {
    mockNavState.isNavigating = true;
    mockNavState.distanceToNextMeters = 1500;
    await renderBar();

    expect(screen.getByText("1.5km")).toBeInTheDocument();
  });
});
