import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import QuickActions from "@/components/chat/QuickActions";

describe("QuickActions", () => {
  it("renders all quick action buttons", () => {
    render(<QuickActions onSend={vi.fn()} />);

    expect(screen.getByLabelText("Campus Map")).toBeInTheDocument();
    expect(screen.getByLabelText("Events Today")).toBeInTheDocument();
    expect(screen.getByLabelText("Where to Eat")).toBeInTheDocument();
    expect(screen.getByLabelText("Library Hours")).toBeInTheDocument();
    expect(screen.getByLabelText("Shuttle Schedule")).toBeInTheDocument();
    expect(screen.getByLabelText("Nearest AAC")).toBeInTheDocument();
  });

  it("calls onSend with the correct message when an action is clicked", () => {
    const onSend = vi.fn();
    render(<QuickActions onSend={onSend} />);

    fireEvent.click(screen.getByLabelText("Campus Map"));
    expect(onSend).toHaveBeenCalledOnce();
    expect(onSend).toHaveBeenCalledWith("Show me the campus map");
  });

  it("calls onSend with correct message for Events Today", () => {
    const onSend = vi.fn();
    render(<QuickActions onSend={onSend} />);

    fireEvent.click(screen.getByLabelText("Events Today"));
    expect(onSend).toHaveBeenCalledWith("What events are happening today?");
  });

  it("calls onSend with correct message for Where to Eat", () => {
    const onSend = vi.fn();
    render(<QuickActions onSend={onSend} />);

    fireEvent.click(screen.getByLabelText("Where to Eat"));
    expect(onSend).toHaveBeenCalledWith("Where can I eat near campus?");
  });

  it("does not call onSend when disabled", () => {
    const onSend = vi.fn();
    render(<QuickActions onSend={onSend} disabled />);

    fireEvent.click(screen.getByLabelText("Campus Map"));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables all buttons when disabled prop is true", () => {
    render(<QuickActions onSend={vi.fn()} disabled />);

    const buttons = screen.getAllByRole("option");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("buttons have accessible labels via aria-label", () => {
    render(<QuickActions onSend={vi.fn()} />);

    const buttons = screen.getAllByRole("option");
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute("aria-label");
      expect(btn.getAttribute("aria-label")).not.toBe("");
    });
  });

  it("renders listbox container with accessible label", () => {
    render(<QuickActions onSend={vi.fn()} />);

    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-label",
      "Quick action suggestions",
    );
  });

  it("navigates right with ArrowRight key", () => {
    render(<QuickActions onSend={vi.fn()} />);

    const listbox = screen.getByRole("listbox");
    const buttons = screen.getAllByRole("option");
    buttons[0].focus();

    fireEvent.keyDown(listbox, { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("navigates left with ArrowLeft key", () => {
    render(<QuickActions onSend={vi.fn()} />);

    const listbox = screen.getByRole("listbox");
    const buttons = screen.getAllByRole("option");
    buttons[1].focus();

    fireEvent.keyDown(listbox, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("wraps around to first when ArrowRight at end", () => {
    render(<QuickActions onSend={vi.fn()} />);

    const listbox = screen.getByRole("listbox");
    const buttons = screen.getAllByRole("option");
    buttons[buttons.length - 1].focus();

    fireEvent.keyDown(listbox, { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("wraps around to last when ArrowLeft at start", () => {
    render(<QuickActions onSend={vi.fn()} />);

    const listbox = screen.getByRole("listbox");
    const buttons = screen.getAllByRole("option");
    buttons[0].focus();

    fireEvent.keyDown(listbox, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it("navigates down with ArrowDown key", () => {
    render(<QuickActions onSend={vi.fn()} />);

    const listbox = screen.getByRole("listbox");
    const buttons = screen.getAllByRole("option");
    buttons[0].focus();

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("navigates up with ArrowUp key", () => {
    render(<QuickActions onSend={vi.fn()} />);

    const listbox = screen.getByRole("listbox");
    const buttons = screen.getAllByRole("option");
    buttons[1].focus();

    fireEvent.keyDown(listbox, { key: "ArrowUp" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("calls onSend with correct messages for remaining actions", () => {
    const onSend = vi.fn();
    render(<QuickActions onSend={onSend} />);

    fireEvent.click(screen.getByLabelText("Library Hours"));
    expect(onSend).toHaveBeenCalledWith("What are the library hours?");

    fireEvent.click(screen.getByLabelText("Shuttle Schedule"));
    expect(onSend).toHaveBeenCalledWith("What is the shuttle bus schedule?");

    fireEvent.click(screen.getByLabelText("Nearest AAC"));
    expect(onSend).toHaveBeenCalledWith("Where is the nearest AAC (Active Ageing Centre)?");
  });
});
