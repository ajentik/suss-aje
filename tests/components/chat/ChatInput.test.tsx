/* eslint-disable jsx-a11y/aria-role */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/chat/VoiceButton", () => ({
  default: () => <button type="button" aria-label="Mock voice" />,
}));

import ChatInput from "@/components/chat/ChatInput";

describe("ChatInput", () => {
  it("renders textarea and send button", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);

    expect(screen.getByLabelText("Chat message")).toBeInTheDocument();
    expect(screen.getByLabelText("Send message")).toBeInTheDocument();
  });

  it("typing into textarea updates value", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);

    const textarea = screen.getByLabelText("Chat message");
    await user.type(textarea, "hello");
    expect(textarea).toHaveValue("hello");
  });

  it("pressing Enter submits the message", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} isLoading={false} />);

    const textarea = screen.getByLabelText("Chat message");
    await user.type(textarea, "test message{Enter}");

    expect(onSend).toHaveBeenCalledOnce();
    expect(onSend).toHaveBeenCalledWith("test message");
  });

  it("Shift+Enter does not submit", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} isLoading={false} />);

    const textarea = screen.getByLabelText("Chat message");
    await user.type(textarea, "line one{Shift>}{Enter}{/Shift}line two");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("submit button click calls onSend", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} isLoading={false} />);

    const textarea = screen.getByLabelText("Chat message");
    await user.type(textarea, "click send");

    const sendBtn = screen.getByLabelText("Send message");
    await user.click(sendBtn);

    expect(onSend).toHaveBeenCalledOnce();
    expect(onSend).toHaveBeenCalledWith("click send");
  });

  it("clears input after successful send", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);

    const textarea = screen.getByLabelText("Chat message");
    await user.type(textarea, "will be cleared{Enter}");

    expect(textarea).toHaveValue("");
  });

  it("does not send empty or whitespace-only input", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} isLoading={false} />);

    const textarea = screen.getByLabelText("Chat message");
    await user.type(textarea, "   {Enter}");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables textarea when isLoading is true", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={true} />);

    expect(screen.getByLabelText("Chat message")).toBeDisabled();
  });

  it("disables send button when isLoading is true", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    const { rerender } = render(
      <ChatInput onSend={onSend} isLoading={false} />,
    );
    const textarea = screen.getByLabelText("Chat message");
    await user.type(textarea, "loading test");

    rerender(<ChatInput onSend={onSend} isLoading={true} />);

    expect(screen.getByLabelText("Send message")).toBeDisabled();
  });

  it("has correct aria-label on textarea", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);
    expect(screen.getByLabelText("Chat message")).toHaveAttribute(
      "aria-label",
      "Chat message",
    );
  });
});
