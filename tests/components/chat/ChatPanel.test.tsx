import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-2d">{children}</div>
  ),
  AdvancedMarker: () => <div data-testid="advanced-marker" />,
}));

const mockSendMessage = vi.fn();
const mockUseChat = {
  messages: [] as Array<{
    id: string;
    role: string;
    parts: Array<{ type: string; text?: string; state?: string }>;
  }>,
  sendMessage: mockSendMessage,
  status: "ready" as string,
  error: null as Error | null,
  id: "test-chat-id",
  setMessages: vi.fn(),
};

vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(() => mockUseChat),
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/voice/speech-synthesis", () => ({
  useSpeechSynthesis: () => ({
    speak: vi.fn(),
    cancel: vi.fn(),
    isSpeaking: false,
  }),
}));

vi.mock("@/lib/maps/campus-pois", () => ({
  findPOI: vi.fn(() => null),
  CAMPUS_POIS: [],
  CAMPUS_CENTER: { lat: 1.3299, lng: 103.7764 },
}));

vi.mock("@/components/chat/ChatMessage", () => ({
  default: ({ role, content }: { role: string; content: string }) => (
    <div data-testid={`chat-message-${role}`}>{content}</div>
  ),
}));

vi.mock("@/components/chat/ChatInput", () => ({
  default: ({
    onSend,
    isLoading,
  }: {
    onSend: (text: string) => void;
    isLoading: boolean;
  }) => (
    <div data-testid="chat-input">
      <input
        data-testid="chat-input-field"
        aria-label="Message input"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSend((e.target as HTMLInputElement).value);
          }
        }}
      />
      <button
        type="button"
        data-testid="send-button"
        disabled={isLoading}
        onClick={() => onSend("test message")}
      >
        Send
      </button>
    </div>
  ),
}));

vi.mock("@/components/chat/QuickActions", () => ({
  default: ({
    onSend,
    disabled,
  }: {
    onSend: (text: string) => void;
    disabled: boolean;
  }) => (
    <div data-testid="quick-actions">
      <button type="button" onClick={() => onSend("Quick question")} disabled={disabled}>
        Quick Action
      </button>
    </div>
  ),
}));

vi.mock("@/components/chat/ToolResultCard", () => ({
  default: () => <div data-testid="tool-result-card" />,
}));

vi.mock("@/components/chat/VoiceButton", () => ({
  default: () => <button type="button" data-testid="voice-button">Voice</button>,
}));

import { useAppStore } from "@/store/app-store";
import { useChat } from "@ai-sdk/react";

const mockedUseChat = vi.mocked(useChat);

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    useAppStore.setState({
      activePanel: "chat",
      routeInfo: null,
      selectedDestination: null,
      flyToTarget: null,
      eventDateFilter: "all",
      eventCategoryFilter: "",
      mapEventMarkers: [],
      highlightedEventIds: [],
      ttsEnabled: false,
      userLocation: null,
    });

    mockUseChat.messages = [];
    mockUseChat.sendMessage = mockSendMessage;
    mockUseChat.status = "ready";
    mockUseChat.error = null;
    mockUseChat.id = "test-chat-id";
    mockUseChat.setMessages = vi.fn();
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);
  });

  async function renderChatPanel() {
    const { default: ChatPanel } = await import(
      "@/components/chat/ChatPanel"
    );
    return render(<ChatPanel />);
  }

  it("renders ChatInput", async () => {
    await renderChatPanel();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
  });

  it("renders QuickActions when messages list is empty", async () => {
    await renderChatPanel();
    expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
  });

  it("renders welcome message when no messages", async () => {
    await renderChatPanel();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("renders suggested questions when no messages", async () => {
    await renderChatPanel();
    expect(screen.getByText("Where is the library?")).toBeInTheDocument();
    expect(screen.getByText("What events are today?")).toBeInTheDocument();
    expect(screen.getByText("How to get to the canteen?")).toBeInTheDocument();
  });

  it("does not render QuickActions when messages are present", async () => {
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Hello", state: "complete" }],
      },
      {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "Hi! How can I help?", state: "complete" }],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.queryByTestId("quick-actions")).not.toBeInTheDocument();
  });

  it("renders ChatMessage list when messages are present", async () => {
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Where is the library?", state: "complete" }],
      },
      {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "The library is in Block C.", state: "complete" }],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();

    expect(screen.getByTestId("chat-message-user")).toBeInTheDocument();
    expect(screen.getByText("Where is the library?")).toBeInTheDocument();
    expect(screen.getByTestId("chat-message-assistant")).toBeInTheDocument();
    expect(screen.getByText("The library is in Block C.")).toBeInTheDocument();
  });

  it("submitting a message calls sendMessage", async () => {
    await renderChatPanel();

    const sendButton = screen.getByTestId("send-button");
    fireEvent.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith({ text: "test message" });
  });

  it("clicking a suggested question calls sendMessage", async () => {
    await renderChatPanel();

    const libraryButton = screen.getByText("Where is the library?");
    fireEvent.click(libraryButton);

    expect(mockSendMessage).toHaveBeenCalledWith({
      text: "Where is the library?",
    });
  });

  it("shows thinking indicator when status is submitted", async () => {
    mockUseChat.status = "submitted";
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();

    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });

  it("shows error message when error occurs", async () => {
    mockUseChat.error = new Error("Network error");
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();

    expect(screen.getByText("Oops, something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("renders chat log area with correct aria attributes", async () => {
    await renderChatPanel();

    const chatLog = screen.getByRole("log");
    expect(chatLog).toHaveAttribute("aria-label", "Chat messages");
    expect(chatLog).toHaveAttribute("aria-live", "polite");
  });
});
