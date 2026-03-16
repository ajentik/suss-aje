import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import TranscriptionConfirmation from "@/components/TranscriptionConfirmation";
import type { QualityResult } from "@/utils/transcriptionQuality";

describe("TranscriptionConfirmation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mediumResult: QualityResult = {
    quality: "medium",
    shouldConfirm: true,
    suggestion: "Did you mean...?",
  };

  const lowResult: QualityResult = {
    quality: "low",
    shouldConfirm: true,
    suggestion: "I did not catch that clearly. Could you repeat?",
  };

  const highResult: QualityResult = {
    quality: "high",
    shouldConfirm: false,
  };

  it("renders transcript and suggestion for medium quality", () => {
    render(
      <TranscriptionConfirmation
        transcript="Navigate to canteen"
        qualityResult={mediumResult}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(/Navigate to canteen/)).toBeInTheDocument();
    expect(screen.getByText("Did you mean...?")).toBeInTheDocument();
  });

  it("renders suggestion only for low quality", () => {
    render(
      <TranscriptionConfirmation
        transcript="mumble"
        qualityResult={lowResult}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByText("I did not catch that clearly. Could you repeat?"),
    ).toBeInTheDocument();
  });

  it("renders nothing when quality is high (shouldConfirm false)", () => {
    const { container } = render(
      <TranscriptionConfirmation
        transcript="Hello"
        qualityResult={highResult}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows Correct and Try again buttons", () => {
    render(
      <TranscriptionConfirmation
        transcript="test"
        qualityResult={mediumResult}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Confirm transcription" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try transcription again" }),
    ).toBeInTheDocument();
  });

  it("calls onConfirm and hides when Correct is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <TranscriptionConfirmation
        transcript="test"
        qualityResult={mediumResult}
        onConfirm={onConfirm}
        onRetry={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm transcription" }),
    );

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onRetry and hides when Try again is clicked", () => {
    const onRetry = vi.fn();
    render(
      <TranscriptionConfirmation
        transcript="test"
        qualityResult={mediumResult}
        onConfirm={vi.fn()}
        onRetry={onRetry}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Try transcription again" }),
    );

    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("auto-dismisses after 5 seconds and calls onConfirm", () => {
    const onConfirm = vi.fn();
    render(
      <TranscriptionConfirmation
        transcript="test"
        qualityResult={mediumResult}
        onConfirm={onConfirm}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not auto-dismiss before 5 seconds", () => {
    const onConfirm = vi.fn();
    render(
      <TranscriptionConfirmation
        transcript="test"
        qualityResult={mediumResult}
        onConfirm={onConfirm}
        onRetry={vi.fn()}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(4_999);
    });

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("clears timer when Correct is clicked before auto-dismiss", () => {
    const onConfirm = vi.fn();
    render(
      <TranscriptionConfirmation
        transcript="test"
        qualityResult={mediumResult}
        onConfirm={onConfirm}
        onRetry={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm transcription" }),
    );

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("has role='alert' for accessibility", () => {
    render(
      <TranscriptionConfirmation
        transcript="test"
        qualityResult={mediumResult}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
