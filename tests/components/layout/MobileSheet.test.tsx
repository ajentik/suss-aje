import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/useBottomSheet", () => ({
  useBottomSheet: vi.fn(() => ({
    sheetRef: { current: null },
    handleRef: { current: null },
    currentHeight: 200,
    snapState: "peek" as const,
    isDragging: false,
    snapTo: vi.fn(),
    touchHandlers: {
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    },
  })),
}));

import { MobileSheet } from "@/components/layout/MobileSheet";
import { useBottomSheet } from "@/hooks/useBottomSheet";

const mockedUseBottomSheet = vi.mocked(useBottomSheet);

function setSnapState(snap: "mini" | "peek" | "half" | "full") {
  mockedUseBottomSheet.mockReturnValue({
    sheetRef: { current: null },
    handleRef: { current: null },
    currentHeight: 200,
    snapState: snap,
    isDragging: false,
    snapTo: vi.fn(),
    touchHandlers: {
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    },
  });
}

describe("MobileSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSnapState("peek");
  });

  it("renders children when snap is not mini", () => {
    render(<MobileSheet>Sheet Content</MobileSheet>);
    expect(screen.getByText("Sheet Content")).toBeInTheDocument();
    const contentContainer = screen.getByText("Sheet Content").closest("div");
    expect(contentContainer?.className).not.toContain("invisible");
  });

  it("hides children when snap is mini", () => {
    setSnapState("mini");
    render(<MobileSheet>Hidden Content</MobileSheet>);
    const contentContainer = screen.getByText("Hidden Content").closest("div");
    expect(contentContainer?.className).toContain("invisible");
  });

  it("shows mini content when snap is mini", () => {
    setSnapState("mini");
    render(
      <MobileSheet miniContent={<span>Mini View</span>}>
        Main Content
      </MobileSheet>,
    );
    expect(screen.getByText("Mini View")).toBeInTheDocument();
  });

  it("renders the drag handle", () => {
    const { container } = render(<MobileSheet>Content</MobileSheet>);
    const handle = container.querySelector("[role='button'][aria-roledescription='drag handle']");
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("aria-label", "Drag to resize or tap to cycle");
  });

  it("shows default mini content when no miniContent prop and snap is mini", () => {
    setSnapState("mini");
    render(<MobileSheet>Content</MobileSheet>);
    expect(screen.getByText("AskSUSSi")).toBeInTheDocument();
    expect(screen.getByText("Swipe up")).toBeInTheDocument();
  });
});
