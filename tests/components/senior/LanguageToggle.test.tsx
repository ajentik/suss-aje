import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageToggle from "@/components/senior/LanguageToggle";

const { useAppStore } = await import("@/store/app-store");

function resetStore() {
  useAppStore.setState({
    preferredLanguage: "en",
  });
}

describe("LanguageToggle", () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
  });

  it("renders four language options", () => {
    render(<LanguageToggle />);
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("中文")).toBeInTheDocument();
    expect(screen.getByText("BM")).toBeInTheDocument();
    expect(screen.getByText("தமிழ்")).toBeInTheDocument();
  });

  it("defaults to English selected", () => {
    render(<LanguageToggle />);
    const enRadio = screen.getByRole("radio", { name: /EN/i });
    expect(enRadio).toBeChecked();
  });

  it("selects Chinese when clicked", async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await user.click(screen.getByText("中文"));

    expect(useAppStore.getState().preferredLanguage).toBe("zh");
    const zhRadio = screen.getByDisplayValue("zh");
    expect(zhRadio).toBeChecked();
  });

  it("selects Malay when clicked", async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await user.click(screen.getByText("BM"));

    expect(useAppStore.getState().preferredLanguage).toBe("ms");
  });

  it("selects Tamil when clicked", async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await user.click(screen.getByText("தமிழ்"));

    expect(useAppStore.getState().preferredLanguage).toBe("ta");
  });

  it("persists selection to localStorage", async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await user.click(screen.getByText("中文"));

    expect(localStorage.getItem("preferred-language")).toBe("zh");
  });

  it("renders as a fieldset with accessible label", () => {
    render(<LanguageToggle />);
    const fieldset = screen.getByRole("group", { name: /preferred language/i });
    expect(fieldset).toBeInTheDocument();
  });

  it("has four radio inputs", () => {
    render(<LanguageToggle />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(4);
  });
});
