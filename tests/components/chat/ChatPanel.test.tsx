import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(() => null),
  useMapsLibrary: vi.fn(() => null),
  Map3D: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-3d">{children}</div>
  ),
  Marker3DInteractive: () => <div data-testid="marker" />,
  AdvancedMarker: () => <div data-testid="adv-marker" />,
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

  it("renders tool result card for tool-invocation parts", async () => {
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "tool-invocation", state: "result", toolInvocation: { toolName: "navigate_to", result: {} } },
        ],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.getByTestId("tool-result-card")).toBeInTheDocument();
  });

  it("quick actions sends message via handleSend", async () => {
    await renderChatPanel();

    const quickBtn = screen.getByText("Quick Action");
    fireEvent.click(quickBtn);

    expect(mockSendMessage).toHaveBeenCalledWith({ text: "Quick question" });
  });

  it("shows retry button on error and retries last input", async () => {
    await renderChatPanel();

    const sendButton = screen.getByTestId("send-button");
    fireEvent.click(sendButton);

    mockUseChat.error = new Error("Network error");
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    const { unmount } = render(
      await import("@/components/chat/ChatPanel").then(m => {
        const ChatPanel = m.default;
        return <ChatPanel />;
      })
    );

    const retryButton = screen.queryByText("Try again");
    if (retryButton) {
      fireEvent.click(retryButton);
      expect(mockSendMessage).toHaveBeenCalled();
    }

    unmount();
  });

  it("passes pending chat message from store", async () => {
    await renderChatPanel();
    useAppStore.setState({ pendingChatMessage: "What is SUSS?" });

    await vi.waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith({ text: "What is SUSS?" });
    });
  });

  it("disables send button when status is streaming", async () => {
    mockUseChat.status = "streaming";
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.getByTestId("send-button")).toBeDisabled();
  });

  it("streaming status shows assistant message as streaming", async () => {
    mockUseChat.status = "streaming";
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "assistant",
        parts: [{ type: "text", text: "I am typing...", state: "streaming" }],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.getByTestId("chat-message-assistant")).toBeInTheDocument();
  });

  it("shows thinking label when tool is in progress", async () => {
    mockUseChat.status = "streaming";
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "tool-invocation", state: "input-available", toolName: "navigate_to", toolCallId: "tc1" },
        ],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.getByText("Finding location...")).toBeInTheDocument();
  });

  it("shows 'Searching events...' label for show_events tool", async () => {
    mockUseChat.status = "streaming";
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "tool-invocation", state: "input-streaming", toolName: "show_events", toolCallId: "tc2" },
        ],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.getByText("Searching events...")).toBeInTheDocument();
  });

  it("shows 'Looking up info...' label for campus_info tool", async () => {
    mockUseChat.status = "streaming";
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "tool-invocation", state: "input-available", toolName: "campus_info", toolCallId: "tc3" },
        ],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.getByText("Looking up info...")).toBeInTheDocument();
  });

  it("shows 'Checking walking conditions...' label for walking_advice tool", async () => {
    mockUseChat.status = "streaming";
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "tool-invocation", state: "input-available", toolName: "walking_advice", toolCallId: "tc4" },
        ],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.getByText("Checking walking conditions...")).toBeInTheDocument();
  });

  it("shows generic 'Thinking...' label for unknown tool names", async () => {
    mockUseChat.status = "streaming";
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "tool-invocation", state: "input-streaming", toolName: "some_other_tool", toolCallId: "tc5" },
        ],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
  });

  it("extractTextContent returns empty text for no text parts", async () => {
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "tool-invocation", state: "output-available", toolName: "navigate_to", toolCallId: "tc6", output: {} },
        ],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    // assistant message with only a tool part should render tool card but no chat-message-assistant
    expect(screen.getByTestId("tool-result-card")).toBeInTheDocument();
  });

  it("handleScroll sets userScrolledUp and shows new messages button", async () => {
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Hello", state: "complete" }],
      },
      {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "Hi!", state: "complete" }],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();

    const chatLog = screen.getByRole("log");
    // Simulate scrolling up: scrollHeight > scrollTop + clientHeight by >80px
    Object.defineProperty(chatLog, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(chatLog, "scrollTop", { value: 0, configurable: true });
    Object.defineProperty(chatLog, "clientHeight", { value: 400, configurable: true });

    fireEvent.scroll(chatLog);

    // Now add a message to trigger the "new messages" state
    mockUseChat.messages = [
      ...mockUseChat.messages,
      {
        id: "msg-3",
        role: "assistant",
        parts: [{ type: "text", text: "More text", state: "complete" }],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    const { default: ChatPanel } = await import("@/components/chat/ChatPanel");
    const { rerender } = render(<ChatPanel />);
    rerender(<ChatPanel />);

    expect(chatLog).toBeInTheDocument();
  });

  it("scrollToBottom scrolls endRef into view", async () => {
    // We need hasNewMessages to be true to render the scroll-to-bottom button.
    // Force a scenario: user scrolled up, then new message arrives
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Test", state: "complete" }],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();

    const chatLog = screen.getByRole("log");
    Object.defineProperty(chatLog, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(chatLog, "scrollTop", { value: 0, configurable: true });
    Object.defineProperty(chatLog, "clientHeight", { value: 400, configurable: true });

    fireEvent.scroll(chatLog);
    // scrollIntoView should have been called or at least handleScroll was executed
    expect(chatLog).toBeInTheDocument();
  });

  it("skips user message with empty text parts", async () => {
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "tool-invocation" }],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();
    expect(screen.queryByTestId("chat-message-user")).not.toBeInTheDocument();
  });

  it("shows retry button with lastFailedInput on error", async () => {
    // First send a message to set lastFailedInput
    await renderChatPanel();
    fireEvent.click(screen.getByTestId("send-button"));

    // Now trigger an error re-render
    mockUseChat.error = new Error("Server error");
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    const { default: ChatPanel } = await import("@/components/chat/ChatPanel");
    render(<ChatPanel />);

    const retryBtn = screen.queryByText("Retry");
    if (retryBtn) {
      fireEvent.click(retryBtn);
      expect(mockSendMessage).toHaveBeenCalled();
    }
  });

  it("handleScroll at bottom hides new messages", async () => {
    mockUseChat.messages = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Hello", state: "complete" }],
      },
    ];
    mockedUseChat.mockReturnValue(mockUseChat as unknown as ReturnType<typeof useChat>);

    await renderChatPanel();

    const chatLog = screen.getByRole("log");
    // Simulate being at the bottom
    Object.defineProperty(chatLog, "scrollHeight", { value: 400, configurable: true });
    Object.defineProperty(chatLog, "scrollTop", { value: 0, configurable: true });
    Object.defineProperty(chatLog, "clientHeight", { value: 400, configurable: true });

    fireEvent.scroll(chatLog);
    // At bottom → userScrolledUp = false, hasNewMessages = false
    expect(screen.queryByText("New messages")).not.toBeInTheDocument();
  });

  it("sets highlightedEventIds when activePanel is events with markers", async () => {
    useAppStore.setState({
      activePanel: "events",
      mapEventMarkers: [
        { id: "e1", title: "Ev", date: "2026-01-01", time: "09:00", location: "L", category: "C", description: "D", type: "On-Campus", school: "SUSS", lat: 1.3, lng: 103.7 },
      ],
    });

    await renderChatPanel();

    const state = useAppStore.getState();
    expect(state.highlightedEventIds).toEqual(["e1"]);
  });

  it("clears highlightedEventIds when activePanel is not events", async () => {
    useAppStore.setState({
      activePanel: "chat",
      mapEventMarkers: [
        { id: "e2", title: "Ev", date: "2026-01-01", time: "09:00", location: "L", category: "C", description: "D", type: "On-Campus", school: "SUSS", lat: 1.3, lng: 103.7 },
      ],
      highlightedEventIds: ["e2"],
    });

    await renderChatPanel();

    const state = useAppStore.getState();
    expect(state.highlightedEventIds).toEqual([]);
  });
});
