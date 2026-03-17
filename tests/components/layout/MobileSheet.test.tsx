import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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
    const handle = container.querySelector(
      "button[aria-roledescription='drag handle']",
    );
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("aria-label", "Drag to resize or tap to cycle");
    expect(handle).toHaveAttribute("aria-roledescription", "drag handle");
  });

  it("shows default mini content when no miniContent prop and snap is mini", () => {
    setSnapState("mini");
    render(<MobileSheet>Content</MobileSheet>);
    expect(screen.getByText("AskSUSSi")).toBeInTheDocument();
    expect(screen.getByText("Swipe up")).toBeInTheDocument();
  });

  it("tap on drag handle cycles snap state", () => {
    const mockSnapTo = vi.fn();
    mockedUseBottomSheet.mockReturnValue({
      sheetRef: { current: null },
      handleRef: { current: null },
      currentHeight: 200,
      snapState: "peek",
      isDragging: false,
      snapTo: mockSnapTo,
      touchHandlers: {
        onTouchStart: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchEnd: vi.fn(),
      },
    });
    render(<MobileSheet>Content</MobileSheet>);
    const handle = screen.getByLabelText("Drag to resize or tap to cycle");
    fireEvent.click(handle);
    expect(mockSnapTo).toHaveBeenCalledWith("half");
  });

  it("Enter key on drag handle cycles snap", () => {
    const mockSnapTo = vi.fn();
    mockedUseBottomSheet.mockReturnValue({
      sheetRef: { current: null },
      handleRef: { current: null },
      currentHeight: 200,
      snapState: "half",
      isDragging: false,
      snapTo: mockSnapTo,
      touchHandlers: {
        onTouchStart: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchEnd: vi.fn(),
      },
    });
    render(<MobileSheet>Content</MobileSheet>);
    const handle = screen.getByLabelText("Drag to resize or tap to cycle");
    fireEvent.keyDown(handle, { key: "Enter" });
    expect(mockSnapTo).toHaveBeenCalledWith("full");
  });

  it("Space key on drag handle cycles snap", () => {
    const mockSnapTo = vi.fn();
    mockedUseBottomSheet.mockReturnValue({
      sheetRef: { current: null },
      handleRef: { current: null },
      currentHeight: 200,
      snapState: "mini",
      isDragging: false,
      snapTo: mockSnapTo,
      touchHandlers: {
        onTouchStart: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchEnd: vi.fn(),
      },
    });
    render(<MobileSheet>Content</MobileSheet>);
    const handle = screen.getByLabelText("Expand panel");
    fireEvent.keyDown(handle, { key: " " });
    expect(mockSnapTo).toHaveBeenCalledWith("peek");
  });

  it("ArrowUp key expands to next snap", () => {
    const mockSnapTo = vi.fn();
    mockedUseBottomSheet.mockReturnValue({
      sheetRef: { current: null },
      handleRef: { current: null },
      currentHeight: 200,
      snapState: "peek",
      isDragging: false,
      snapTo: mockSnapTo,
      touchHandlers: {
        onTouchStart: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchEnd: vi.fn(),
      },
    });
    render(<MobileSheet>Content</MobileSheet>);
    const handle = screen.getByLabelText("Drag to resize or tap to cycle");
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(mockSnapTo).toHaveBeenCalledWith("half");
  });

  it("ArrowDown key collapses to previous snap", () => {
    const mockSnapTo = vi.fn();
    mockedUseBottomSheet.mockReturnValue({
      sheetRef: { current: null },
      handleRef: { current: null },
      currentHeight: 200,
      snapState: "half",
      isDragging: false,
      snapTo: mockSnapTo,
      touchHandlers: {
        onTouchStart: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchEnd: vi.fn(),
      },
    });
    render(<MobileSheet>Content</MobileSheet>);
    const handle = screen.getByLabelText("Drag to resize or tap to cycle");
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(mockSnapTo).toHaveBeenCalledWith("peek");
  });

  it("ArrowDown at mini does not go below", () => {
    const mockSnapTo = vi.fn();
    mockedUseBottomSheet.mockReturnValue({
      sheetRef: { current: null },
      handleRef: { current: null },
      currentHeight: 200,
      snapState: "mini",
      isDragging: false,
      snapTo: mockSnapTo,
      touchHandlers: {
        onTouchStart: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchEnd: vi.fn(),
      },
    });
    render(<MobileSheet>Content</MobileSheet>);
    const handle = screen.getByLabelText("Expand panel");
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(mockSnapTo).not.toHaveBeenCalled();
  });

  it("ArrowUp at full does not go above", () => {
    const mockSnapTo = vi.fn();
    mockedUseBottomSheet.mockReturnValue({
      sheetRef: { current: null },
      handleRef: { current: null },
      currentHeight: 200,
      snapState: "full",
      isDragging: false,
      snapTo: mockSnapTo,
      touchHandlers: {
        onTouchStart: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchEnd: vi.fn(),
      },
    });
    render(<MobileSheet>Content</MobileSheet>);
    const handle = screen.getByLabelText("Drag to resize or tap to cycle");
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(mockSnapTo).not.toHaveBeenCalled();
  });

  it("calls onSnapChange when snap state changes", () => {
    const onSnapChange = vi.fn();
    setSnapState("peek");
    const { rerender } = render(
      <MobileSheet onSnapChange={onSnapChange}>Content</MobileSheet>,
    );
    setSnapState("half");
    rerender(
      <MobileSheet onSnapChange={onSnapChange}>Content</MobileSheet>,
    );
    expect(onSnapChange).toHaveBeenCalledWith("half");
  });

  it("exposes snapTo via snapToRef", () => {
    const mockSnapTo = vi.fn();
    mockedUseBottomSheet.mockReturnValue({
      sheetRef: { current: null },
      handleRef: { current: null },
      currentHeight: 200,
      snapState: "peek",
      isDragging: false,
      snapTo: mockSnapTo,
      touchHandlers: {
        onTouchStart: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchEnd: vi.fn(),
      },
    });
    const snapToRef = { current: null as ((snap: "mini" | "peek" | "half" | "full") => void) | null };
    render(<MobileSheet snapToRef={snapToRef}>Content</MobileSheet>);
    expect(snapToRef.current).toBe(mockSnapTo);
  });
});
