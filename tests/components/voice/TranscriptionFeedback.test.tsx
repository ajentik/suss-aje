import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSubmitFeedback = vi.fn();

vi.mock("@/hooks/useTranscriptionFeedback", () => ({
  useTranscriptionFeedback: () => ({
    submitFeedback: mockSubmitFeedback,
    getFeedbackHistory: vi.fn(() => []),
    getMisrecognizedPhrases: vi.fn(() => []),
    clearFeedback: vi.fn(),
  }),
}));

import TranscriptionFeedback from "@/components/voice/TranscriptionFeedback";

describe("TranscriptionFeedback", () => {
  const defaultProps = {
    transcript: "hello world",
    provider: "web-speech",
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("renders the feedback prompt", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    expect(
      screen.getByText("Was this transcription correct?"),
    ).toBeInTheDocument();
  });

  it("renders thumbs up and thumbs down buttons", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Transcription correct" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Transcription incorrect" }),
    ).toBeInTheDocument();
  });

  it("renders dismiss button", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Dismiss feedback" }),
    ).toBeInTheDocument();
  });

  it("submits positive feedback on thumbs up", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription correct" }),
    );

    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      "hello world",
      null,
      "web-speech",
    );
  });

  it("shows thank-you message after positive feedback", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription correct" }),
    );

    expect(screen.getByText("Thanks for your feedback!")).toBeInTheDocument();
  });

  it("shows correction input on thumbs down", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription incorrect" }),
    );

    expect(
      screen.getByText("What should it have been?"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Type the correct transcription"),
    ).toBeInTheDocument();
  });

  it("submits correction on submit button click", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription incorrect" }),
    );

    const input = screen.getByPlaceholderText("Type the correct transcription");
    fireEvent.change(input, { target: { value: "corrected text" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Submit correction" }),
    );

    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      "hello world",
      "corrected text",
      "web-speech",
    );
  });

  it("submits correction on Enter key", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription incorrect" }),
    );

    const input = screen.getByPlaceholderText("Type the correct transcription");
    fireEvent.change(input, { target: { value: "corrected text" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      "hello world",
      "corrected text",
      "web-speech",
    );
  });

  it("does not submit empty correction", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription incorrect" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Submit correction" }),
    );

    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it("does not submit whitespace-only correction", () => {
    render(<TranscriptionFeedback {...defaultProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription incorrect" }),
    );

    const input = screen.getByPlaceholderText("Type the correct transcription");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(
      screen.getByRole("button", { name: "Submit correction" }),
    );

    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it("calls onDismiss when dismiss button clicked", () => {
    const onDismiss = vi.fn();
    render(<TranscriptionFeedback {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss feedback" }),
    );

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("calls onDismiss after positive feedback with delay", () => {
    const onDismiss = vi.fn();
    render(<TranscriptionFeedback {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription correct" }),
    );

    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when cancel button clicked in correction mode", () => {
    const onDismiss = vi.fn();
    render(<TranscriptionFeedback {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription incorrect" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel correction" }),
    );

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("uses default provider when not specified", () => {
    render(
      <TranscriptionFeedback
        transcript="test"
        onDismiss={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Transcription correct" }),
    );

    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      "test",
      null,
      "web-speech",
    );
  });
});
