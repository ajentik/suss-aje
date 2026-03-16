import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockSetSttLanguage = vi.fn();
let mockSttLanguage = "english";

vi.mock("@/store/app-store", () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      sttLanguage: mockSttLanguage,
      setSttLanguage: mockSetSttLanguage,
    }),
}));

import LanguageSelector from "@/components/chat/LanguageSelector";

describe("LanguageSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSttLanguage = "english";
  });

  it("renders a trigger with speech language aria-label", () => {
    render(<LanguageSelector />);

    expect(screen.getByLabelText("Speech language")).toBeInTheDocument();
  });

  it("renders a combobox role trigger", () => {
    render(<LanguageSelector />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("has the selected value in the hidden input for english", () => {
    render(<LanguageSelector />);

    const hiddenInput = document.querySelector("input[aria-hidden='true']");
    expect(hiddenInput).toHaveValue("english");
  });

  it("has the selected value in the hidden input for singlish", () => {
    mockSttLanguage = "singlish";
    render(<LanguageSelector />);

    const hiddenInput = document.querySelector("input[aria-hidden='true']");
    expect(hiddenInput).toHaveValue("singlish");
  });

  it("has the selected value in the hidden input for mandarin-mix", () => {
    mockSttLanguage = "mandarin-mix";
    render(<LanguageSelector />);

    const hiddenInput = document.querySelector("input[aria-hidden='true']");
    expect(hiddenInput).toHaveValue("mandarin-mix");
  });
});
