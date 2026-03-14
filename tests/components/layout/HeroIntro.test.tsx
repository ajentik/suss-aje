import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { priority, fill, ...rest } = props;
    return <img alt={(rest.alt as string) ?? ""} {...rest} />;
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
});
