import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetOnboardingDismissed = vi.fn();
const mockSetPendingChatMessage = vi.fn();

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { priority, fill, ...rest } = props;
    return <img alt={(rest.alt as string) ?? ""} {...rest} />;
  },
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      onboardingDismissed: false,
      setOnboardingDismissed: mockSetOnboardingDismissed,
      setPendingChatMessage: mockSetPendingChatMessage,
    }),
  ),
}));

import Onboarding from "@/components/layout/Onboarding";

describe("Onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders welcome heading", () => {
    render(<Onboarding />);
    expect(
      screen.getByText("Welcome to your campus assistant"),
    ).toBeInTheDocument();
  });

  it("renders capability cards", () => {
    render(<Onboarding />);
    expect(screen.getByText("Navigate campus")).toBeInTheDocument();
    expect(screen.getByText("Find events")).toBeInTheDocument();
    expect(screen.getByText("Food nearby")).toBeInTheDocument();
    expect(screen.getByText("Library info")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Ask anything")).toBeInTheDocument();
  });

  it("renders try suggestions", () => {
    render(<Onboarding />);
    expect(screen.getByText("Where is the library?")).toBeInTheDocument();
    expect(screen.getByText("What events are today?")).toBeInTheDocument();
    expect(
      screen.getByText("Find me a place to eat nearby"),
    ).toBeInTheDocument();
    expect(screen.getByText("How do I get to Block D?")).toBeInTheDocument();
  });

  it("renders Get Started button", () => {
    render(<Onboarding />);
    expect(
      screen.getByRole("button", { name: "Get Started" }),
    ).toBeInTheDocument();
  });

  it("dismisses on Get Started click (after timeout)", () => {
    vi.useFakeTimers();
    render(<Onboarding />);

    fireEvent.click(screen.getByRole("button", { name: "Get Started" }));
    vi.advanceTimersByTime(350);
    expect(mockSetOnboardingDismissed).toHaveBeenCalledWith(true);
    vi.useRealTimers();
  });

  it("sends pending message when suggestion is clicked", () => {
    vi.useFakeTimers();
    render(<Onboarding />);

    fireEvent.click(screen.getByText("Where is the library?"));
    vi.advanceTimersByTime(350);
    expect(mockSetOnboardingDismissed).toHaveBeenCalledWith(true);
    expect(mockSetPendingChatMessage).toHaveBeenCalledWith(
      "Where is the library?",
    );
    vi.useRealTimers();
  });

  it("close button dismisses the dialog", () => {
    vi.useFakeTimers();
    render(<Onboarding />);

    fireEvent.click(
      screen.getByRole("button", { name: "Close welcome dialog" }),
    );
    vi.advanceTimersByTime(350);
    expect(mockSetOnboardingDismissed).toHaveBeenCalledWith(true);
    vi.useRealTimers();
  });
});
