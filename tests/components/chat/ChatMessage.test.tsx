import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import ChatMessage from "@/components/chat/ChatMessage";

describe("ChatMessage", () => {
  it("renders user message with content", () => {
    render(<ChatMessage role="user" content="Hello there" />);

    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("renders user message with correct aria-label", () => {
    render(<ChatMessage role="user" content="Hi" />);

    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("aria-label", "You said");
  });

  it("renders assistant message with content", () => {
    render(<ChatMessage role="assistant" content="Welcome to campus!" />);

    expect(screen.getByText("Welcome to campus!")).toBeInTheDocument();
  });

  it("renders assistant message with correct aria-label", () => {
    render(<ChatMessage role="assistant" content="Hello" />);

    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("aria-label", "AskSUSSi said");
  });

  it("renders markdown in assistant messages", () => {
    render(<ChatMessage role="assistant" content="**bold text**" />);

    const strong = screen.getByText("bold text");
    expect(strong.tagName).toBe("STRONG");
  });

  it("renders plain text (no markdown) in user messages", () => {
    render(<ChatMessage role="user" content="**not bold**" />);

    expect(screen.getByText("**not bold**")).toBeInTheDocument();
  });

  it("shows streaming indicator when isStreaming is true", () => {
    const { container } = render(
      <ChatMessage role="assistant" content="Typing..." isStreaming />,
    );

    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).toBeInTheDocument();
  });

  it("does not show streaming indicator when isStreaming is false", () => {
    const { container } = render(
      <ChatMessage role="assistant" content="Done" isStreaming={false} />,
    );

    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).not.toBeInTheDocument();
  });
});
