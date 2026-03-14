import { describe, expect, it, vi } from "vitest";

vi.mock("@/../public/campus-events.json", () => ({
  default: [
    {
      id: "1",
      title: "Test Lecture",
      date: "2025-03-15",
      time: "10:00",
      location: "Block A",
      category: "Lecture",
      description: "A test lecture",
      type: "On-Campus",
      school: "SUSS",
      lat: 1.33,
      lng: 103.77,
    },
    {
      id: "2",
      title: "Career Fair 2025",
      date: "2025-03-16",
      time: "14:00",
      location: "Block B",
      category: "Career Fair",
      description: "A career fair",
      type: "On-Campus",
      school: "SUSS",
      lat: 1.33,
      lng: 103.77,
    },
    {
      id: "3",
      title: "Info Session",
      date: "2025-03-15",
      time: "09:00",
      location: "Online",
      category: "Information Session",
      description: "An info session",
      type: "Online",
      school: "SUSS",
      lat: 1.33,
      lng: 103.77,
    },
  ],
}));

import { GET } from "@/app/api/events/route";

describe("GET /api/events", () => {
  it("returns all events when no filters provided", async () => {
    const req = new Request("http://localhost/api/events");
    const res = await GET(req);
    const data = await res.json();
    expect(data).toHaveLength(3);
  });

  it("filters by date param (exact match)", async () => {
    const req = new Request("http://localhost/api/events?date=2025-03-15");
    const res = await GET(req);
    const data = await res.json();
    expect(data).toHaveLength(2);
    for (const event of data) {
      expect(event.date).toBe("2025-03-15");
    }
  });

  it("filters by category param (case-insensitive includes)", async () => {
    const req = new Request("http://localhost/api/events?category=career");
    const res = await GET(req);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].category).toBe("Career Fair");
  });

  it("returns empty array when date matches nothing", async () => {
    const req = new Request("http://localhost/api/events?date=2099-01-01");
    const res = await GET(req);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns empty array when category matches nothing", async () => {
    const req = new Request("http://localhost/api/events?category=nonexistent");
    const res = await GET(req);
    const data = await res.json();
    expect(data).toEqual([]);
  });
});
