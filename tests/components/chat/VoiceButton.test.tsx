import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockStartListening = vi.fn();
const mockStopListening = vi.fn();
let mockIsListening = false;

vi.mock("@/lib/voice/speech-recognition", () => ({
  useSpeechRecognition: () => ({
    isListening: mockIsListening,
    transcript: "",
    startListening: mockStartListening,
    stopListening: mockStopListening,
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import VoiceButton from "@/components/chat/VoiceButton";

describe("VoiceButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsListening = false;
  });

  it("renders as a button", () => {
    render(<VoiceButton onTranscript={vi.fn()} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has aria-label 'Start voice input' when idle", () => {
    render(<VoiceButton onTranscript={vi.fn()} />);

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Start voice input",
    );
  });

  it("has aria-label 'Stop recording' when listening", () => {
    mockIsListening = true;
    render(<VoiceButton onTranscript={vi.fn()} />);

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Stop recording",
    );
  });

  it("has title 'Start voice input' when idle", () => {
    render(<VoiceButton onTranscript={vi.fn()} />);

    expect(screen.getByRole("button")).toHaveAttribute(
      "title",
      "Start voice input",
    );
  });

  it("has title 'Stop recording' when listening", () => {
    mockIsListening = true;
    render(<VoiceButton onTranscript={vi.fn()} />);

    expect(screen.getByRole("button")).toHaveAttribute(
      "title",
      "Stop recording",
    );
  });

  it("calls startListening when clicked in idle state", () => {
    const onTranscript = vi.fn();
    render(<VoiceButton onTranscript={onTranscript} />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockStartListening).toHaveBeenCalledOnce();
    expect(mockStopListening).not.toHaveBeenCalled();
  });

  it("calls stopListening when clicked while listening", () => {
    mockIsListening = true;
    render(<VoiceButton onTranscript={vi.fn()} />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockStopListening).toHaveBeenCalledOnce();
    expect(mockStartListening).not.toHaveBeenCalled();
  });

  it("passes onTranscript callback to startListening", () => {
    const onTranscript = vi.fn();
    render(<VoiceButton onTranscript={onTranscript} />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockStartListening).toHaveBeenCalledWith(
      onTranscript,
      expect.any(Function),
      undefined,
    );
  });

  it("passes lang to startListening when provided", () => {
    const onTranscript = vi.fn();
    render(<VoiceButton onTranscript={onTranscript} lang="en-SG" />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockStartListening).toHaveBeenCalledWith(
      onTranscript,
      expect.any(Function),
      "en-SG",
    );
  });

  it("is type='button' (not submit)", () => {
    render(<VoiceButton onTranscript={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
