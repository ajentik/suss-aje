import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStreamText = vi.fn();

vi.mock("ai", () => ({
  convertToModelMessages: vi.fn().mockResolvedValue([]),
  streamText: (...args: unknown[]) => mockStreamText(...args),
  stepCountIs: vi.fn().mockReturnValue(5),
  UIMessage: {},
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: () => (model: string) => ({ modelId: model }),
}));

vi.mock("@/lib/ai/system-prompt", () => ({
  SYSTEM_PROMPT: "You are AskSUSSi.",
}));

vi.mock("@/lib/ai/tools", () => ({
  tools: { navigate_to: {} },
}));

async function callPOST(body: unknown): Promise<Response> {
  const { POST } = await import("@/app/api/chat/route");
  return POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.resetModules();
    mockStreamText.mockReset();
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid json/i);
  });

  it("calls streamText and returns stream response", async () => {
    const mockResponse = new Response("stream data", { status: 200 });
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => mockResponse,
    });

    const res = await callPOST({
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(res.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalledOnce();
  });

  it("passes system prompt and tools to streamText", async () => {
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => new Response("ok"),
    });

    await callPOST({
      messages: [{ role: "user", content: "Test" }],
    });

    const args = mockStreamText.mock.calls[0][0];
    expect(args.system).toBe("You are AskSUSSi.");
    expect(args.tools).toHaveProperty("navigate_to");
  });
});
