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
    expect(screen.getByText("AAC Near Me")).toBeInTheDocument();
    expect(
      screen.getByText(/Discover activities, exercises, and social events/),
    ).toBeInTheDocument();
  });

  it("renders the app icon", () => {
    render(<HeroIntro onEnter={vi.fn()} />);
    // Heart icon is rendered as an SVG, not an image
    expect(screen.getByText("AAC Near Me")).toBeInTheDocument();
  });

  it("renders the CTA button that is accessible", () => {
    render(<HeroIntro onEnter={vi.fn()} />);
    const cta = screen.getByRole("button", {
      name: "Enter AAC Near Me",
    });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveTextContent("Get Started");
  });

  it("calls onEnter when CTA is clicked (after timeout)", () => {
    vi.useFakeTimers();
    const onEnter = vi.fn();
    render(<HeroIntro onEnter={onEnter} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Enter AAC Near Me" }),
    );
    expect(onEnter).not.toHaveBeenCalled();

    vi.advanceTimersByTime(700);
    expect(onEnter).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("renders feature pills", () => {
    render(<HeroIntro onEnter={vi.fn()} />);
    expect(screen.getByText("Find Nearby AACs")).toBeInTheDocument();
    expect(screen.getByText("Voice & Chat")).toBeInTheDocument();
    expect(screen.getByText("Activities & Events")).toBeInTheDocument();
    expect(screen.getByText("Street View")).toBeInTheDocument();
  });
});
