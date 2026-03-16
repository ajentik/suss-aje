import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, getSystemPrompt } from "@/lib/ai/system-prompt";

describe("getSystemPrompt", () => {
  it("returns base prompt for English", () => {
    const result = getSystemPrompt("en");
    expect(result).toBe(SYSTEM_PROMPT);
    expect(result).not.toContain("preferred language");
  });

  it("appends Chinese instruction for zh", () => {
    const result = getSystemPrompt("zh");
    expect(result).toContain("Chinese (Simplified)");
    expect(result).toContain("Respond in Chinese (Simplified)");
  });

  it("appends Malay instruction for ms", () => {
    const result = getSystemPrompt("ms");
    expect(result).toContain("Bahasa Melayu");
    expect(result).toContain("Respond in Bahasa Melayu");
  });

  it("appends Tamil instruction for ta", () => {
    const result = getSystemPrompt("ta");
    expect(result).toContain("Tamil");
    expect(result).toContain("Respond in Tamil");
  });

  it("defaults to English when called without argument", () => {
    const result = getSystemPrompt();
    expect(result).toBe(SYSTEM_PROMPT);
  });

  it("still contains base prompt content for non-English languages", () => {
    const result = getSystemPrompt("zh");
    expect(result).toContain("AskSUSSi");
    expect(result).toContain("navigate_to");
  });
});
