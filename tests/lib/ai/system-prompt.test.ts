import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

describe("SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("identifies as AskSUSSi", () => {
    expect(SYSTEM_PROMPT).toContain("AskSUSSi");
  });

  it("mentions available tools", () => {
    expect(SYSTEM_PROMPT).toContain("navigate_to");
    expect(SYSTEM_PROMPT).toContain("show_events");
    expect(SYSTEM_PROMPT).toContain("campus_info");
  });

  it("contains SUSS campus context", () => {
    expect(SYSTEM_PROMPT).toContain("SUSS");
    expect(SYSTEM_PROMPT).toContain("463 Clementi Road");
    expect(SYSTEM_PROMPT).toContain("Singapore");
  });

  it("mentions campus buildings", () => {
    expect(SYSTEM_PROMPT).toContain("Block A");
    expect(SYSTEM_PROMPT).toContain("Block B");
    expect(SYSTEM_PROMPT).toContain("Block C");
    expect(SYSTEM_PROMPT).toContain("Block D");
  });

  it("mentions key facilities", () => {
    expect(SYSTEM_PROMPT).toContain("Library");
    expect(SYSTEM_PROMPT).toContain("Canteen");
    expect(SYSTEM_PROMPT).toContain("Gym");
  });

  it("mentions nearby venues", () => {
    expect(SYSTEM_PROMPT).toContain("Supermarket");
    expect(SYSTEM_PROMPT).toContain("Restaurant");
    expect(SYSTEM_PROMPT).toContain("Hawker");
  });

  it("contains Active Ageing Centres context", () => {
    expect(SYSTEM_PROMPT).toContain("Active Ageing Centre");
    expect(SYSTEM_PROMPT).toContain("AAC");
  });

  it("contains AIC context", () => {
    expect(SYSTEM_PROMPT).toContain("AIC");
    expect(SYSTEM_PROMPT).toContain("Agency for Integrated Care");
  });

  it("mentions language and tone guidelines", () => {
    expect(SYSTEM_PROMPT).toContain("Singlish");
    expect(SYSTEM_PROMPT).toContain("friendly");
  });
});
