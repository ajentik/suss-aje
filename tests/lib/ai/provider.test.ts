import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn().mockReturnValue(() => ({ modelId: "test" })),
}));

describe("AI Provider", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports a google provider function", async () => {
    const { google } = await import("@/lib/ai/provider");
    expect(typeof google).toBe("function");
  });

  it("creates a model instance when called", async () => {
    const { google } = await import("@/lib/ai/provider");
    const model = google("gemini-3.1-flash-lite-preview");
    expect(model).toBeDefined();
    expect(model).toHaveProperty("modelId");
  });
});
