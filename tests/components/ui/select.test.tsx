import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "@/components/ui/select";

describe("Select components", () => {
  it("renders SelectTrigger with data-slot", () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger data-testid="trigger">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "select-trigger");
  });

  it("SelectTrigger supports size='sm'", () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger data-testid="trigger" size="sm">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-size", "sm");
  });

  it("SelectTrigger defaults to size='default'", () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger data-testid="trigger">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-size", "default");
  });

  it("renders SelectGroup with data-slot", () => {
    render(
      <Select defaultValue="a">
        <SelectGroup data-testid="group">
          <SelectItem value="a">Option A</SelectItem>
        </SelectGroup>
      </Select>,
    );
    expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "select-group");
  });

  it("renders SelectLabel with data-slot", () => {
    render(
      <Select defaultValue="a">
        <SelectGroup>
          <SelectLabel data-testid="label">Group Label</SelectLabel>
        </SelectGroup>
      </Select>,
    );
    expect(screen.getByTestId("label")).toHaveAttribute("data-slot", "select-label");
    expect(screen.getByTestId("label")).toHaveTextContent("Group Label");
  });

  it("renders SelectSeparator with data-slot", () => {
    render(
      <Select defaultValue="a">
        <SelectSeparator data-testid="sep" />
      </Select>,
    );
    expect(screen.getByTestId("sep")).toHaveAttribute("data-slot", "select-separator");
  });

  it("renders SelectItem with data-slot", () => {
    render(
      <Select defaultValue="a">
        <SelectItem data-testid="item" value="a">Option A</SelectItem>
      </Select>,
    );
    expect(screen.getByTestId("item")).toHaveAttribute("data-slot", "select-item");
  });

  it("applies custom className to SelectTrigger", () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger data-testid="trigger" className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByTestId("trigger")).toHaveClass("custom-trigger");
  });

  it("applies custom className to SelectGroup", () => {
    render(
      <Select defaultValue="a">
        <SelectGroup data-testid="group" className="custom-group">
          <SelectItem value="a">A</SelectItem>
        </SelectGroup>
      </Select>,
    );
    expect(screen.getByTestId("group")).toHaveClass("custom-group");
  });
});
