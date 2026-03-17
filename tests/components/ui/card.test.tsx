import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

describe("Card components", () => {
  it("renders Card with children", () => {
    render(<Card data-testid="card">Card content</Card>);
    expect(screen.getByTestId("card")).toHaveTextContent("Card content");
  });

  it("Card has data-slot='card'", () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card");
  });

  it("Card supports size='sm'", () => {
    render(<Card data-testid="card" size="sm">Small card</Card>);
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "sm");
  });

  it("Card applies custom className", () => {
    render(<Card data-testid="card" className="custom-class">Content</Card>);
    expect(screen.getByTestId("card")).toHaveClass("custom-class");
  });

  it("renders CardHeader", () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    expect(screen.getByTestId("header")).toHaveAttribute("data-slot", "card-header");
  });

  it("renders CardTitle", () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    expect(screen.getByTestId("title")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByTestId("title")).toHaveTextContent("Title");
  });

  it("renders CardDescription", () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>);
    expect(screen.getByTestId("desc")).toHaveAttribute("data-slot", "card-description");
    expect(screen.getByTestId("desc")).toHaveTextContent("Description");
  });

  it("renders CardAction", () => {
    render(<CardAction data-testid="action">Action</CardAction>);
    expect(screen.getByTestId("action")).toHaveAttribute("data-slot", "card-action");
  });

  it("renders CardContent", () => {
    render(<CardContent data-testid="content">Body</CardContent>);
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByTestId("content")).toHaveTextContent("Body");
  });

  it("renders CardFooter", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    expect(screen.getByTestId("footer")).toHaveAttribute("data-slot", "card-footer");
    expect(screen.getByTestId("footer")).toHaveTextContent("Footer");
  });

  it("renders full Card composition", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>My Title</CardTitle>
          <CardDescription>My Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>,
    );

    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("My Description")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });
});
