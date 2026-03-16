import { describe, expect, it } from "vitest";
import {
  CATEGORY_ICON,
  CATEGORY_ICON_BG,
  DEFAULT_EVENT_ICON,
  DEFAULT_ICON_BG,
} from "@/lib/event-icons";

const ALL_CATEGORIES = [
  "Information Session",
  "Open House",
  "Public Lecture / Enrichment Talk",
  "Symposium",
  "Competition / Hackathon",
  "Career",
  "Career Fair",
  "Lecture",
  "Forum / Conference",
  "Forum",
  "Conference",
  "Social",
];

describe("CATEGORY_ICON", () => {
  it("has entries for all expected categories", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(CATEGORY_ICON).toHaveProperty(cat);
    }
  });

  it("maps each category to a defined icon name string", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(CATEGORY_ICON[cat]).toBeDefined();
      expect(typeof CATEGORY_ICON[cat]).toBe("string");
    }
  });

  it("maps known categories to their correct icon names", () => {
    expect(CATEGORY_ICON["Information Session"]).toBe("info");
    expect(CATEGORY_ICON["Open House"]).toBe("shop");
    expect(CATEGORY_ICON["Public Lecture / Enrichment Talk"]).toBe("message2");
    expect(CATEGORY_ICON["Symposium"]).toBe("user");
    expect(CATEGORY_ICON["Competition / Hackathon"]).toBe("star");
    expect(CATEGORY_ICON["Lecture"]).toBe("doc");
    expect(CATEGORY_ICON["Forum / Conference"]).toBe("message");
    expect(CATEGORY_ICON["Conference"]).toBe("globe");
    expect(CATEGORY_ICON["Social"]).toBe("sparkle");
  });

  it("maps Career and Career Fair to the same icon", () => {
    expect(CATEGORY_ICON["Career"]).toBe("wallet");
    expect(CATEGORY_ICON["Career Fair"]).toBe("wallet");
  });
});

describe("DEFAULT_EVENT_ICON", () => {
  it("is defined and matches the calendar icon name", () => {
    expect(DEFAULT_EVENT_ICON).toBeDefined();
    expect(DEFAULT_EVENT_ICON).toBe("calendar");
  });
});

describe("CATEGORY_ICON_BG", () => {
  it("has entries matching all CATEGORY_ICON keys", () => {
    const iconKeys = Object.keys(CATEGORY_ICON);
    const bgKeys = Object.keys(CATEGORY_ICON_BG);
    expect(bgKeys.sort()).toEqual(iconKeys.sort());
  });

  it("has non-empty Tailwind class strings for each category", () => {
    for (const cat of ALL_CATEGORIES) {
      const value = CATEGORY_ICON_BG[cat];
      expect(value).toBeDefined();
      expect(value.length).toBeGreaterThan(0);
      expect(value).toContain("bg-");
      expect(value).toContain("text-");
    }
  });
});

describe("DEFAULT_ICON_BG", () => {
  it("is a non-empty string with Tailwind classes", () => {
    expect(typeof DEFAULT_ICON_BG).toBe("string");
    expect(DEFAULT_ICON_BG.length).toBeGreaterThan(0);
    expect(DEFAULT_ICON_BG).toContain("bg-");
  });
});
