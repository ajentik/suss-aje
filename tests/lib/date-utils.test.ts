import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatEventDate, formatEventDateRange } from "@/lib/date-utils";

describe("date-utils event formatting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats a single event date without year in current year", () => {
    expect(formatEventDateRange("2026-03-16")).toBe("Mar 16");
  });

  it("formats same-day range as a single date", () => {
    expect(formatEventDateRange("2026-03-16", "2026-03-16")).toBe("Mar 16");
  });

  it("formats a same-month range", () => {
    expect(formatEventDateRange("2026-03-16", "2026-03-30")).toBe(
      "Mar 16 – 30",
    );
  });

  it("formats a cross-month range", () => {
    expect(formatEventDateRange("2026-03-16", "2026-06-30")).toBe(
      "Mar 16 – Jun 30",
    );
  });

  it("formats a cross-year range with year on both dates", () => {
    expect(formatEventDateRange("2026-12-31", "2027-01-02")).toBe(
      "Dec 31, 2026 – Jan 2, 2027",
    );
  });

  it("includes year for non-current-year single date", () => {
    expect(formatEventDate("2027-12-31")).toBe("Dec 31, 2027");
  });
});
