import { describe, expect, it } from "vitest";
import {
  CATEGORY_ICON,
  CATEGORY_ICON_BG,
  DEFAULT_EVENT_ICON,
  DEFAULT_ICON_BG,
} from "@/lib/event-icons";
import {
  Info,
  DoorOpen,
  Presentation,
  Users,
  Briefcase,
  BookOpen,
  MessageSquare,
  Landmark,
  PartyPopper,
  Trophy,
  Calendar,
} from "lucide-react";

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

  it("maps each category to a defined icon component", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(CATEGORY_ICON[cat]).toBeDefined();
    }
  });

  it("maps known categories to their correct icons", () => {
    expect(CATEGORY_ICON["Information Session"]).toBe(Info);
    expect(CATEGORY_ICON["Open House"]).toBe(DoorOpen);
    expect(CATEGORY_ICON["Public Lecture / Enrichment Talk"]).toBe(Presentation);
    expect(CATEGORY_ICON["Symposium"]).toBe(Users);
    expect(CATEGORY_ICON["Competition / Hackathon"]).toBe(Trophy);
    expect(CATEGORY_ICON["Lecture"]).toBe(BookOpen);
    expect(CATEGORY_ICON["Forum / Conference"]).toBe(MessageSquare);
    expect(CATEGORY_ICON["Conference"]).toBe(Landmark);
    expect(CATEGORY_ICON["Social"]).toBe(PartyPopper);
  });

  it("maps Career and Career Fair to the same icon (Briefcase)", () => {
    expect(CATEGORY_ICON["Career"]).toBe(Briefcase);
    expect(CATEGORY_ICON["Career Fair"]).toBe(Briefcase);
  });
});

describe("DEFAULT_EVENT_ICON", () => {
  it("is defined and matches the Calendar icon", () => {
    expect(DEFAULT_EVENT_ICON).toBeDefined();
    expect(DEFAULT_EVENT_ICON).toBe(Calendar);
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
