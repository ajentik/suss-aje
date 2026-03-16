import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
}));

import { useAppStore } from "@/store/app-store";

async function renderMobilitySelector() {
  const { default: MobilitySelector } = await import(
    "@/components/navigation/MobilitySelector"
  );
  return render(<MobilitySelector />);
}

describe("MobilitySelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ mobilityLevel: "normal" });
  });

  it("renders all four mobility options", async () => {
    await renderMobilitySelector();

    expect(screen.getByRole("radio", { name: "Normal" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Slow" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Walker" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Wheelchair" })).toBeInTheDocument();
  });

  it("has normal selected by default", async () => {
    await renderMobilitySelector();

    const normalRadio = screen.getByRole("radio", { name: "Normal" });
    expect(normalRadio).toBeChecked();
  });

  it("updates store when a different option is selected", async () => {
    const user = userEvent.setup();
    await renderMobilitySelector();

    const slowRadio = screen.getByRole("radio", { name: "Slow" });
    await user.click(slowRadio);

    expect(useAppStore.getState().mobilityLevel).toBe("slow");
  });

  it("renders as a fieldset with proper aria-label", async () => {
    await renderMobilitySelector();

    const fieldset = screen.getByRole("group", { name: "Mobility level" });
    expect(fieldset).toBeInTheDocument();
  });

  it("reflects store state for non-default mobility level", async () => {
    useAppStore.setState({ mobilityLevel: "wheelchair" });
    await renderMobilitySelector();

    const wheelchairRadio = screen.getByRole("radio", { name: "Wheelchair" });
    expect(wheelchairRadio).toBeChecked();
  });
});
