import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetMyAAC = vi.fn();
const mockClearMyAAC = vi.fn();
const mockWalkTo = vi.fn();
const mockSetActivePanel = vi.fn();

vi.mock("@/hooks/useMyAAC", () => ({
  useMyAAC: vi.fn(),
}));

vi.mock("@/hooks/useWalkingRoute", () => ({
  useWalkingRoute: vi.fn(() => ({
    walkTo: mockWalkTo,
    isLoading: false,
  })),
}));

vi.mock("@/store/app-store", () => ({
  useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setActivePanel: mockSetActivePanel,
    }),
  ),
}));

import MyAACCard from "@/components/senior/MyAACCard";
import { useMyAAC } from "@/hooks/useMyAAC";

const mockedUseMyAAC = vi.mocked(useMyAAC);

function setMyAACState(overrides: Partial<ReturnType<typeof useMyAAC>> = {}) {
  mockedUseMyAAC.mockReturnValue({
    myAAC: null,
    setMyAAC: mockSetMyAAC,
    clearMyAAC: mockClearMyAAC,
    ...overrides,
  });
}

describe("MyAACCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMyAACState();
  });

  describe("when no AAC is saved", () => {
    it("shows 'Set your nearest AAC' prompt", () => {
      render(<MyAACCard />);
      expect(screen.getByText("Set your nearest AAC")).toBeInTheDocument();
      expect(screen.getByText("Quick access to your Active Ageing Centre")).toBeInTheDocument();
    });

    it("shows Browse button that navigates to aac-search panel", () => {
      render(<MyAACCard />);
      fireEvent.click(screen.getByText("Browse"));
      expect(mockSetActivePanel).toHaveBeenCalledWith("aac-search");
    });
  });

  describe("when an AAC is saved", () => {
    const savedAAC = {
      name: "Bedok North Active Ageing Centre",
      lat: 1.334,
      lng: 103.932,
      address: "Blk 123 Bedok North",
      phone: "+65 6123 4567",
    };

    beforeEach(() => {
      setMyAACState({ myAAC: savedAAC });
    });

    it("shows My AAC label and name", () => {
      render(<MyAACCard />);
      expect(screen.getByText("My AAC")).toBeInTheDocument();
      expect(screen.getByText("Bedok North Active Ageing Centre")).toBeInTheDocument();
    });

    it("shows Call button with tel link when phone is available", () => {
      render(<MyAACCard />);
      const callLink = screen.getByText("Call").closest("a");
      expect(callLink).toHaveAttribute("href", "tel:+65 6123 4567");
    });

    it("shows Walk There button", () => {
      render(<MyAACCard />);
      expect(screen.getByText("Walk There")).toBeInTheDocument();
    });

    it("calls walkTo when Walk There is clicked", () => {
      render(<MyAACCard />);
      fireEvent.click(screen.getByText("Walk There"));
      expect(mockWalkTo).toHaveBeenCalledOnce();
      expect(mockWalkTo).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Bedok North Active Ageing Centre",
          lat: 1.334,
          lng: 103.932,
        }),
      );
    });

    it("shows Activities button", () => {
      render(<MyAACCard />);
      expect(screen.getByText("Activities")).toBeInTheDocument();
    });

    it("navigates to aac-search when Activities is clicked", () => {
      render(<MyAACCard />);
      fireEvent.click(screen.getByText("Activities"));
      expect(mockSetActivePanel).toHaveBeenCalledWith("aac-search");
    });

    it("clears saved AAC when remove button is clicked", () => {
      render(<MyAACCard />);
      fireEvent.click(screen.getByLabelText("Remove saved AAC"));
      expect(mockClearMyAAC).toHaveBeenCalledOnce();
    });

    it("hides Call button when phone is not available", () => {
      setMyAACState({
        myAAC: { ...savedAAC, phone: undefined },
      });
      render(<MyAACCard />);
      expect(screen.queryByText("Call")).not.toBeInTheDocument();
    });
  });
});
