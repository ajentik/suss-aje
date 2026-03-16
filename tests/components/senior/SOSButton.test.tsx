import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SOSButton from "@/components/senior/SOSButton";

function mockGeolocation(overrides: Partial<Geolocation> = {}) {
  const geo: Geolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
    ...overrides,
  };
  Object.defineProperty(navigator, "geolocation", {
    value: geo,
    writable: true,
    configurable: true,
  });
  return geo;
}

describe("SOSButton", () => {
  beforeEach(() => {
    mockGeolocation();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({ json: () => Promise.resolve({ results: [] }) }),
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the SOS trigger button", () => {
    render(<SOSButton />);
    const btn = screen.getByRole("button", { name: "SOS Emergency" });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText("SOS")).toBeInTheDocument();
  });

  it("does not show modal initially", () => {
    render(<SOSButton />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens modal on SOS button click", () => {
    mockGeolocation({
      getCurrentPosition: vi.fn(),
    });
    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Emergency Help")).toBeInTheDocument();
  });

  it("shows call emergency link with tel:995", () => {
    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));
    const callLink = screen.getByText(/Call Emergency/);
    expect(callLink.closest("a")).toHaveAttribute("href", "tel:995");
  });

  it("shows share location button (disabled when no location)", () => {
    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));
    const shareBtn = screen.getByRole("button", { name: /Share My Location/ });
    expect(shareBtn).toBeDisabled();
  });

  it("enables share button after location is obtained", async () => {
    mockGeolocation({
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: { latitude: 1.314, longitude: 103.765 },
          timestamp: Date.now(),
        } as GeolocationPosition);
      }),
    });

    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));

    await waitFor(() => {
      const shareBtn = screen.getByRole("button", { name: /Share My Location/ });
      expect(shareBtn).not.toBeDisabled();
    });
  });

  it("closes modal on Cancel button click", () => {
    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Cancel/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes modal on Escape key", () => {
    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows location error when geolocation is denied", async () => {
    mockGeolocation({
      getCurrentPosition: vi.fn((_success, error) => {
        error!({
          code: 1,
          message: "User denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
      }),
    });

    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));

    await waitFor(() => {
      expect(screen.getByText(/Location access denied/)).toBeInTheDocument();
    });
  });

  it("shows address when reverse geocoding succeeds", async () => {
    mockGeolocation({
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: { latitude: 1.314, longitude: 103.765 },
          timestamp: Date.now(),
        } as GeolocationPosition);
      }),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              results: [{ formatted_address: "461 Clementi Rd, Singapore" }],
            }),
        }),
      ),
    );

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "test-key");

    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));

    await waitFor(() => {
      expect(screen.getByText(/461 Clementi Rd/)).toBeInTheDocument();
    });
  });

  it("uses Web Share API when available", async () => {
    const shareMock = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      writable: true,
      configurable: true,
    });

    mockGeolocation({
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: { latitude: 1.314, longitude: 103.765 },
          timestamp: Date.now(),
        } as GeolocationPosition);
      }),
    });

    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Share My Location/ })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Share My Location/ }));

    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "SOS - My Location",
        text: expect.stringContaining("https://maps.google.com/?q=1.314,103.765"),
      }),
    );

    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("falls back to SMS when Web Share is unavailable", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const openMock = vi.fn();
    vi.stubGlobal("open", openMock);

    mockGeolocation({
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: { latitude: 1.314, longitude: 103.765 },
          timestamp: Date.now(),
        } as GeolocationPosition);
      }),
    });

    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Share My Location/ })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Share My Location/ }));

    expect(openMock).toHaveBeenCalledWith(
      expect.stringContaining("sms:?body="),
      "_self",
    );
  });

  it("shows geolocation not supported error", () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(<SOSButton />);
    fireEvent.click(screen.getByRole("button", { name: "SOS Emergency" }));

    expect(screen.getByText(/not supported/)).toBeInTheDocument();
  });
});
