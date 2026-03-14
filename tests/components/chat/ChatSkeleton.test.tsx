import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ChatSkeleton } from "@/components/chat/ChatSkeleton";

describe("ChatSkeleton", () => {
  it("renders with status role", () => {
    render(<ChatSkeleton />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has accessible loading label", () => {
    render(<ChatSkeleton />);

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading conversation",
    );
  });

  it("renders shimmer placeholder elements", () => {
    const { container } = render(<ChatSkeleton />);

    const shimmerBars = container.querySelectorAll(".animate-skeleton-wave");
    expect(shimmerBars.length).toBe(3);
  });

  it("contains screen-reader-only loading text", () => {
    render(<ChatSkeleton />);

    expect(screen.getByText("Loading messages...")).toBeInTheDocument();
  });

  it("screen-reader text is visually hidden", () => {
    const { container } = render(<ChatSkeleton />);

    const srOnly = container.querySelector(".sr-only");
    expect(srOnly).toBeInTheDocument();
    expect(srOnly).toHaveTextContent("Loading messages...");
  });
});
