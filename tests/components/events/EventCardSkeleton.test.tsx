import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";

describe("EventCardSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<EventCardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders skeleton shimmer placeholder elements", () => {
    const { container } = render(<EventCardSkeleton />);
    const shimmers = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmers.length).toBeGreaterThanOrEqual(10);
  });

  it("renders a top-level container div", () => {
    const { container } = render(<EventCardSkeleton />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe("DIV");
    expect(wrapper.className).toContain("rounded-2xl");
  });

  it("applies animation delay based on index prop", () => {
    const { container } = render(<EventCardSkeleton index={3} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.animationDelay).toBe("300ms");
  });

  it("defaults index to 0 when not provided", () => {
    const { container } = render(<EventCardSkeleton />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.animationDelay).toBe("0ms");
  });

  it("renders skeleton for header icon", () => {
    const { container } = render(<EventCardSkeleton />);
    const iconSkeleton = container.querySelector(".w-10.h-10.rounded-xl.skeleton-shimmer");
    expect(iconSkeleton).toBeInTheDocument();
  });

  it("renders skeleton for tag pills", () => {
    const { container } = render(<EventCardSkeleton />);
    const tagSkeletons = container.querySelectorAll(".rounded-full.skeleton-shimmer");
    expect(tagSkeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("renders skeleton for action buttons", () => {
    const { container } = render(<EventCardSkeleton />);
    const buttonSkeletons = container.querySelectorAll(".h-11.rounded-full.skeleton-shimmer");
    expect(buttonSkeletons.length).toBe(2);
  });
});
