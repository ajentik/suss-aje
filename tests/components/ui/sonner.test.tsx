import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("sonner", () => ({
  Toaster: function MockToaster(props: Record<string, unknown>) {
    return <div data-testid="sonner-toaster" data-theme={props.theme as string} />;
  },
}));

vi.mock("lucide-react", () => ({
  CircleCheckIcon: () => <span data-testid="icon-success" />,
  InfoIcon: () => <span data-testid="icon-info" />,
  TriangleAlertIcon: () => <span data-testid="icon-warning" />,
  OctagonXIcon: () => <span data-testid="icon-error" />,
  Loader2Icon: () => <span data-testid="icon-loading" />,
}));

import { Toaster } from "@/components/ui/sonner";

describe("Toaster (sonner)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { getByTestId } = render(<Toaster />);
    expect(getByTestId("sonner-toaster")).toBeInTheDocument();
  });

  it("passes theme from next-themes", () => {
    const { getByTestId } = render(<Toaster />);
    expect(getByTestId("sonner-toaster")).toHaveAttribute("data-theme", "light");
  });
});
