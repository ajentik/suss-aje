import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("next/font/google", () => ({
  Nunito_Sans: () => ({ variable: "--font-sans" }),
  Source_Code_Pro: () => ({ variable: "--font-geist-mono" }),
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("@/components/layout/ServiceWorkerRegistrar", () => ({
  default: () => null,
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders children", () => {
    render(
      <RootLayout>
        <div data-testid="child">Hello</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("includes skip-to-content link", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
  });

  it("renders Toaster component", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });
});
