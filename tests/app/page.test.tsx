import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/components/layout/AppShell", () => ({
  default: () => <div data-testid="app-shell">AppShell</div>,
}));

import Home from "@/app/page";

describe("Home page", () => {
  it("renders AppShell", () => {
    const { getByTestId } = render(<Home />);
    expect(getByTestId("app-shell")).toBeInTheDocument();
  });
});
