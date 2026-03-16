import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import EventFilter from "@/components/events/EventFilter";
import type { DateRangePreset } from "@/types";

const defaultProps = {
  dateFilter: "all" as DateRangePreset,
  onDateChange: vi.fn(),
  categoryFilter: "",
  onCategoryChange: vi.fn(),
  categories: ["Information Session", "Open House", "Career"],
  schoolFilter: "",
  onSchoolChange: vi.fn(),
};

describe("EventFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders filter section with label", () => {
    render(<EventFilter {...defaultProps} />);
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("renders date preset buttons", () => {
    render(<EventFilter {...defaultProps} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("3 Days")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("marks the active date filter with aria-pressed=true", () => {
    render(<EventFilter {...defaultProps} dateFilter="1d" />);
    expect(screen.getByText("Today")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("3 Days")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("This Week")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("All")).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onDateChange when a date preset is clicked", () => {
    const onDateChange = vi.fn();
    render(<EventFilter {...defaultProps} onDateChange={onDateChange} />);

    fireEvent.click(screen.getByText("Today"));
    expect(onDateChange).toHaveBeenCalledWith("1d");

    fireEvent.click(screen.getByText("3 Days"));
    expect(onDateChange).toHaveBeenCalledWith("3d");

    fireEvent.click(screen.getByText("This Week"));
    expect(onDateChange).toHaveBeenCalledWith("7d");

    fireEvent.click(screen.getByText("All"));
    expect(onDateChange).toHaveBeenCalledWith("all");
  });

  it("renders the date range group with accessible role", () => {
    render(<EventFilter {...defaultProps} />);
    expect(screen.getByRole("group", { name: "Date range" })).toBeInTheDocument();
  });

  it("renders the search region with accessible label", () => {
    render(<EventFilter {...defaultProps} />);
    expect(screen.getByRole("search", { name: "Event filters" })).toBeInTheDocument();
  });

  it("shows active filter count badge when filters are active", () => {
    render(<EventFilter {...defaultProps} dateFilter="1d" categoryFilter="Career" />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("does not show filter count badge when all filters are default", () => {
    render(<EventFilter {...defaultProps} />);
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("shows Clear all button when filters are active", () => {
    render(<EventFilter {...defaultProps} dateFilter="7d" />);
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("calls all reset functions when Clear all is clicked", () => {
    const onDateChange = vi.fn();
    const onCategoryChange = vi.fn();
    const onSchoolChange = vi.fn();
    render(
      <EventFilter
        {...defaultProps}
        dateFilter="1d"
        onDateChange={onDateChange}
        onCategoryChange={onCategoryChange}
        onSchoolChange={onSchoolChange}
      />,
    );

    fireEvent.click(screen.getByText("Clear all"));
    expect(onDateChange).toHaveBeenCalledWith("all");
    expect(onCategoryChange).toHaveBeenCalledWith("");
    expect(onSchoolChange).toHaveBeenCalledWith("");
  });

  it("does not show Clear all button when no filters are active", () => {
    render(<EventFilter {...defaultProps} />);
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });
});
