import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("passes through a single class name", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("merges multiple class names", () => {
    const result = cn("text-red-500", "bg-blue-200");
    expect(result).toContain("text-red-500");
    expect(result).toContain("bg-blue-200");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden")).toBe("base");
    expect(cn("base", true && "visible")).toContain("visible");
  });

  it("resolves Tailwind conflicts via twMerge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles undefined, null, and false inputs gracefully", () => {
    expect(cn("base", undefined, null, false, "extra")).toBe("base extra");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});
