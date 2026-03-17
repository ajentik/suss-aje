import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority: _priority, fill: _fill, alt, ...rest }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={(alt as string) ?? ""} {...rest} />;
  },
}));

vi.mock("@/lib/maps/aerial-view", () => ({
  lookupAerialVideo: vi.fn(() => Promise.resolve(null)),
}));

import HeroIntro from "@/components/layout/HeroIntro";

describe("HeroIntro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and subtitle text", () => {
    render(<HeroIntro onEnter={vi.fn()} />);
    expect(screen.getByText("AskSUSSi")).toBeInTheDocument();
    expect(
      screen.getByText(/Resolve campus affairs with one sentence/),
    ).toBeInTheDocument();
  });

  it("renders the SUSS logo", () => {
    render(<HeroIntro onEnter={vi.fn()} />);
    expect(
      screen.getByAltText("SUSS — Singapore University of Social Sciences"),
    ).toBeInTheDocument();
  });

  it("renders the CTA button that is accessible", () => {
    render(<HeroIntro onEnter={vi.fn()} />);
    const cta = screen.getByRole("button", {
      name: "Enter AskSUSSi campus assistant",
    });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveTextContent("Explore Campus");
  });

  it("calls onEnter when CTA is clicked (after timeout)", () => {
    vi.useFakeTimers();
    const onEnter = vi.fn();
    render(<HeroIntro onEnter={onEnter} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Enter AskSUSSi campus assistant" }),
    );
    expect(onEnter).not.toHaveBeenCalled();

    vi.advanceTimersByTime(700);
    expect(onEnter).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("renders feature pills", () => {
    render(<HeroIntro onEnter={vi.fn()} />);
    expect(screen.getByText("3D Campus Map")).toBeInTheDocument();
    expect(screen.getByText("AI Chat & Voice")).toBeInTheDocument();
    expect(screen.getByText("Events & Navigation")).toBeInTheDocument();
    expect(screen.getByText("Street View")).toBeInTheDocument();
  });

  it("adds fade-out class when CTA is clicked", () => {
    vi.useFakeTimers();
    render(<HeroIntro onEnter={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Enter AskSUSSi campus assistant" }),
    );

    const header = screen.getByRole("banner");
    expect(header.className).toContain("opacity-0");
    vi.useRealTimers();
  });

  it("renders video element when aerial video resolves", async () => {
    const { lookupAerialVideo } = await import("@/lib/maps/aerial-view");
    vi.mocked(lookupAerialVideo).mockResolvedValueOnce({
      uris: { VIDEO_MP4_HIGH: "https://cdn.example.com/video.mp4" },
    });

    render(<HeroIntro onEnter={vi.fn()} />);

    await vi.waitFor(() => {
      const videos = document.querySelectorAll("video");
      expect(videos.length).toBe(1);
      expect(videos[0].getAttribute("src")).toBe("https://cdn.example.com/video.mp4");
    });
  });

  it("shows progress bar when video not yet ready", () => {
    render(<HeroIntro onEnter={vi.fn()} />);
    const progressBar = document.querySelector(".h-1.bg-white\\/20");
    expect(progressBar).toBeInTheDocument();
  });

  it("renders bottom label text", () => {
    render(<HeroIntro onEnter={vi.fn()} />);
    expect(screen.getByText("SUSS Campus Intelligent Assistant")).toBeInTheDocument();
  });
});
