/* eslint-disable jsx-a11y/aria-role */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  it("shows timestamp on click for user message", async () => {
    const ts = new Date("2026-03-15T10:30:00");
    render(<ChatMessage role="user" content="Hello" timestamp={ts} />);

    const bubble = screen.getByText("Hello");
    await userEvent.click(bubble);

    expect(screen.getByText(/10:30/)).toBeInTheDocument();
  });

  it("shows timestamp on click for assistant message", async () => {
    const ts = new Date("2026-03-15T14:45:00");
    render(<ChatMessage role="assistant" content="Hey" timestamp={ts} />);

    const bubble = screen.getByText("Hey");
    await userEvent.click(bubble);

    expect(screen.getByText(/2:45|14:45/)).toBeInTheDocument();
  });

  it("hides timestamp on second click", async () => {
    const ts = new Date("2026-03-15T10:30:00");
    render(<ChatMessage role="user" content="Hello" timestamp={ts} />);

    const bubble = screen.getByText("Hello");
    await userEvent.click(bubble);
    expect(screen.getByText(/10:30/)).toBeInTheDocument();

    await userEvent.click(bubble);
    expect(screen.queryByText(/10:30/)).not.toBeInTheDocument();
  });

  it("does not show timestamp when isStreaming is true", async () => {
    const ts = new Date("2026-03-15T10:30:00");
    render(<ChatMessage role="assistant" content="Still going" timestamp={ts} isStreaming />);

    const bubble = screen.getByText("Still going");
    await userEvent.click(bubble);

    expect(screen.queryByText(/10:30/)).not.toBeInTheDocument();
  });

  it("does not show timestamp when none is provided", async () => {
    render(<ChatMessage role="user" content="No time" />);
    const bubble = screen.getByText("No time");
    await userEvent.click(bubble);
    expect(screen.queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument();
  });

  it("toggles timestamp on Enter key", () => {
    const ts = new Date("2026-03-15T10:30:00");
    render(<ChatMessage role="user" content="Hello" timestamp={ts} />);

    const bubble = screen.getByText("Hello");
    fireEvent.keyDown(bubble, { key: "Enter" });

    expect(screen.getByText(/10:30/)).toBeInTheDocument();
  });

  it("toggles timestamp on Space key", () => {
    const ts = new Date("2026-03-15T10:30:00");
    render(<ChatMessage role="user" content="Hello" timestamp={ts} />);

    const bubble = screen.getByText("Hello");
    fireEvent.keyDown(bubble, { key: " " });

    expect(screen.getByText(/10:30/)).toBeInTheDocument();
  });

  it("does not toggle timestamp for other keys", () => {
    const ts = new Date("2026-03-15T10:30:00");
    render(<ChatMessage role="user" content="Hello" timestamp={ts} />);

    const bubble = screen.getByText("Hello");
    fireEvent.keyDown(bubble, { key: "Tab" });

    expect(screen.queryByText(/10:30/)).not.toBeInTheDocument();
  });

  it("renders markdown headings in assistant messages", () => {
    render(<ChatMessage role="assistant" content="# Heading 1" />);
    expect(screen.getByText("Heading 1").tagName).toBe("H1");
  });

  it("renders markdown lists in assistant messages", () => {
    render(<ChatMessage role="assistant" content={"- item one\n- item two"} />);
    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
  });

  it("renders markdown links in assistant messages", () => {
    render(<ChatMessage role="assistant" content="[Click here](https://example.com)" />);
    const link = screen.getByText("Click here");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders inline code in assistant messages", () => {
    render(<ChatMessage role="assistant" content="Use `npm install`" />);
    const code = screen.getByText("npm install");
    expect(code.tagName).toBe("CODE");
  });

  it("renders blockquote in assistant messages", () => {
    render(<ChatMessage role="assistant" content="> This is a quote" />);
    const blockquote = screen.getByText("This is a quote").closest("blockquote");
    expect(blockquote).toBeInTheDocument();
  });

  it("renders table in assistant messages", () => {
    const md = "| Col1 | Col2 |\n|---|---|\n| A | B |";
    render(<ChatMessage role="assistant" content={md} />);
    expect(screen.getByText("Col1")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders emphasis in assistant messages", () => {
    render(<ChatMessage role="assistant" content="*italic text*" />);
    const em = screen.getByText("italic text");
    expect(em.tagName).toBe("EM");
  });

  it("renders strikethrough in assistant messages", () => {
    render(<ChatMessage role="assistant" content="~~deleted~~" />);
    const del = screen.getByText("deleted");
    expect(del.tagName).toBe("DEL");
  });

  it("renders horizontal rule in assistant messages", () => {
    const { container } = render(<ChatMessage role="assistant" content={"text\n\n---\n\nmore text"} />);
    const hr = container.querySelector("hr");
    expect(hr).toBeInTheDocument();
  });

  it("renders ordered list in assistant messages", () => {
    render(<ChatMessage role="assistant" content={"1. first\n2. second"} />);
    const ol = screen.getByRole("list");
    expect(ol.tagName).toBe("OL");
  });
});
