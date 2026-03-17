import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

Element.prototype.scrollIntoView = vi.fn();

const mockSendQuery = vi.fn();
const mockClearHistory = vi.fn();
const mockWalkTo = vi.fn();
const mockStartListening = vi.fn();
const mockStopListening = vi.fn();
let mockIsLoading = false;
let mockIsListening = false;
let mockConversationHistory: Array<{
  id: string;
  role: "user" | "assistant";
  content: string;
  place?: { name: string; distance?: string };
  timestamp: Date;
}> = [];

vi.mock("@/hooks/useNavigationChat", () => ({
  useNavigationChat: () => ({
    sendQuery: mockSendQuery,
    isLoading: mockIsLoading,
    conversationHistory: mockConversationHistory,
    clearHistory: mockClearHistory,
  }),
}));

vi.mock("@/hooks/useWalkingRoute", () => ({
  useWalkingRoute: () => ({
    walkTo: mockWalkTo,
  }),
}));

vi.mock("@/lib/voice/speech-recognition", () => ({
  useSpeechRecognition: () => ({
    isListening: mockIsListening,
    startListening: mockStartListening,
    stopListening: mockStopListening,
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/maps/campus-pois", () => ({
  findPOI: (name: string) => {
    if (name === "Library") {
      return { id: "lib", name: "Library", lat: 1.33, lng: 103.77, category: "On-campus" };
    }
    return null;
  },
}));

import NavigationChatPanel from "@/components/navigation/NavigationChatPanel";

describe("NavigationChatPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockIsListening = false;
    mockConversationHistory = [];
  });

  it("renders the toggle button", () => {
    render(<NavigationChatPanel />);
    const btn = screen.getByRole("button", { name: /open navigation chat/i });
    expect(btn).toBeInTheDocument();
  });

  it("opens the chat panel when toggle is clicked", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));
    expect(screen.getByLabelText("Navigation chat")).toBeInTheDocument();
  });

  it("closes the chat panel when close button is clicked", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));
    expect(screen.getByLabelText("Navigation chat")).toBeInTheDocument();

    const closeButtons = screen.getAllByRole("button", { name: /close navigation chat/i });
    fireEvent.click(closeButtons[0]);
    expect(screen.queryByLabelText("Navigation chat")).not.toBeInTheDocument();
  });

  it("shows empty state with suggestions when no history", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    expect(screen.getByText("Where do you need to go?")).toBeInTheDocument();
    expect(screen.getByText("Nearest polyclinic?")).toBeInTheDocument();
    expect(screen.getByText("Where can I eat?")).toBeInTheDocument();
    expect(screen.getByText("Find the library")).toBeInTheDocument();
  });

  it("clicking a suggestion sends the query", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    fireEvent.click(screen.getByText("Nearest polyclinic?"));
    expect(mockSendQuery).toHaveBeenCalledWith("Nearest polyclinic?");
  });

  it("sends message when input is submitted", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    const input = screen.getByLabelText("Navigation query");
    fireEvent.change(input, { target: { value: "Where is Block A?" } });
    fireEvent.click(screen.getByLabelText("Send navigation query"));

    expect(mockSendQuery).toHaveBeenCalledWith("Where is Block A?");
  });

  it("sends message on Enter key", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    const input = screen.getByLabelText("Navigation query");
    fireEvent.change(input, { target: { value: "Library" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockSendQuery).toHaveBeenCalledWith("Library");
  });

  it("disables send button when input is empty", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    const sendBtn = screen.getByLabelText("Send navigation query");
    expect(sendBtn).toBeDisabled();
  });

  it("disables input when loading", () => {
    mockIsLoading = true;
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    const input = screen.getByLabelText("Navigation query");
    expect(input).toBeDisabled();
  });

  it("shows loading animation when isLoading", () => {
    mockIsLoading = true;
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    expect(screen.getByText("Finding places...")).toBeInTheDocument();
  });

  it("renders conversation messages", () => {
    mockConversationHistory = [
      { id: "m1", role: "user", content: "Where is the library?", timestamp: new Date() },
      { id: "m2", role: "assistant", content: "The library is in Block A.", timestamp: new Date() },
    ];

    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    expect(screen.getByText("Where is the library?")).toBeInTheDocument();
    expect(screen.getByText("The library is in Block A.")).toBeInTheDocument();
  });

  it("shows clear button when there is history", () => {
    mockConversationHistory = [
      { id: "m1", role: "user", content: "Test", timestamp: new Date() },
    ];

    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    const clearBtn = screen.getByLabelText("Clear conversation");
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(mockClearHistory).toHaveBeenCalled();
  });

  it("does not show clear button when history is empty", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    expect(screen.queryByLabelText("Clear conversation")).not.toBeInTheDocument();
  });

  it("renders place card with navigate button", () => {
    mockConversationHistory = [
      {
        id: "m1",
        role: "assistant",
        content: "Found the library.",
        place: { name: "Library", distance: "200m" },
        timestamp: new Date(),
      },
    ];

    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("200m")).toBeInTheDocument();
    expect(screen.getByText("Navigate")).toBeInTheDocument();
  });

  it("calls walkTo when navigate button is clicked on a known POI", () => {
    mockConversationHistory = [
      {
        id: "m1",
        role: "assistant",
        content: "Found it.",
        place: { name: "Library" },
        timestamp: new Date(),
      },
    ];

    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));
    fireEvent.click(screen.getByText("Navigate"));

    expect(mockWalkTo).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Library" }),
    );
  });

  it("shows error toast when navigating to unknown POI", async () => {
    const { toast } = await import("sonner");
    mockConversationHistory = [
      {
        id: "m1",
        role: "assistant",
        content: "Found it.",
        place: { name: "Unknown Place" },
        timestamp: new Date(),
      },
    ];

    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));
    fireEvent.click(screen.getByText("Navigate"));

    expect(toast.error).toHaveBeenCalled();
  });

  it("voice toggle calls startListening when not listening", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    fireEvent.click(screen.getByLabelText("Voice input"));
    expect(mockStartListening).toHaveBeenCalled();
  });

  it("voice toggle calls stopListening when listening", () => {
    mockIsListening = true;
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    fireEvent.click(screen.getByLabelText("Stop recording"));
    expect(mockStopListening).toHaveBeenCalled();
  });

  it("toggle button has aria-expanded", () => {
    render(<NavigationChatPanel />);
    const btn = screen.getByRole("button", { name: /open navigation chat/i });
    expect(btn).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(btn);
    const closeToggleButtons = screen.getAllByRole("button", { name: /close navigation chat/i });
    const toggleBtn = closeToggleButtons.find(b => b.getAttribute("aria-expanded") !== null);
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
  });

  it("clears input after sending", () => {
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    const input = screen.getByLabelText("Navigation query") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.click(screen.getByLabelText("Send navigation query"));

    expect(input.value).toBe("");
  });

  it("does not send when loading", () => {
    mockIsLoading = true;
    render(<NavigationChatPanel />);
    fireEvent.click(screen.getByRole("button", { name: /open navigation chat/i }));

    const input = screen.getByLabelText("Navigation query");
    fireEvent.change(input, { target: { value: "Test" } });
    const sendBtn = screen.getByLabelText("Send navigation query");
    expect(sendBtn).toBeDisabled();
  });
});
