import { z } from "zod";
import { tool } from "ai";
import { CAMPUS_POIS, findPOI, findPOIs } from "@/lib/maps/campus-pois";
import { getDateRange } from "@/lib/date-utils";
import campusEvents from "@/../public/campus-events.json";
import type { CampusEvent } from "@/types";

export const navigateTo = tool({
  description:
    "Navigate the 3D campus map to a specific destination and show walking directions. Use this when a student asks where something is or how to get somewhere. Works for on-campus locations and nearby venues (supermarkets, restaurants, malls, bars, hawker centres).",
  inputSchema: z.object({
    destination: z
      .string()
      .describe("The name or type of place to navigate to, e.g. 'library', 'FairPrice', 'Clementi Mall', 'Sukiya'"),
  }),
  execute: async ({ destination }) => {
    const poi = findPOI(destination);
    if (!poi) {
      const categories = [...new Set(CAMPUS_POIS.map((p) => p.category))];
      return {
        success: false as const,
        message: `I couldn't find "${destination}". Try searching by name or category: ${categories.join(", ")}. Available locations include: ${CAMPUS_POIS.map((p) => p.name).join(", ")}`,
      };
    }
    let msg = `Navigating to ${poi.name}. ${poi.description}`;
    if (poi.address) msg += ` Address: ${poi.address}.`;
    if (poi.hours) msg += ` Hours: ${poi.hours}.`;
    if (poi.rating) msg += ` Rating: ${poi.rating}/5.`;
    return {
      success: true as const,
      poi,
      message: msg,
    };
  },
});

export const showEvents = tool({
  description:
    "Show campus events, optionally filtered by date or category. Use this when a student asks about events, activities, or what's happening on campus.",
  inputSchema: z.object({
    date: z
      .string()
      .optional()
      .describe("Filter events by date in YYYY-MM-DD format. Use 2026-03-13 for today."),
    category: z
      .string()
      .optional()
      .describe("Filter events by category, e.g. 'Information Session', 'Open House', 'Public Lecture', 'Symposium', 'Career Fair', 'Lecture', 'Forum', 'Conference'"),
    school: z
      .string()
      .optional()
      .describe("Filter by school: 'SUSS' or 'SIM'"),
    range: z
      .enum(["1d", "3d", "7d", "all"])
      .optional()
      .describe("Filter by date range preset: '1d' for today, '3d' for next 3 days, '7d' for next 7 days, 'all' for all events. Prefer this over 'date' for common queries."),
  }),
  execute: async ({ date, category, school, range }) => {
    let filtered = campusEvents as unknown as CampusEvent[];

    if (range) {
      const dateRange = getDateRange(range);
      if (dateRange) {
        filtered = filtered.filter((e) => {
          const eventEnd = e.endDate || e.date;
          return eventEnd >= dateRange.start && e.date <= dateRange.end;
        });
      }
    } else if (date) {
      filtered = filtered.filter((e) => e.date === date || (e.endDate && e.date <= date && e.endDate >= date));
    }
    if (category) {
      const cat = category.toLowerCase();
      filtered = filtered.filter((e) => e.category.toLowerCase().includes(cat));
    }
    if (school) {
      const s = school.toUpperCase();
      filtered = filtered.filter((e) => (e as CampusEvent & { school?: string }).school === s);
    }

    return {
      success: true as const,
      events: filtered,
      filters: { date, category, range },
      message:
        filtered.length > 0
          ? `Found ${filtered.length} event${filtered.length > 1 ? "s" : ""}${range ? ` for ${range === "1d" ? "today" : `next ${range}`}` : date ? ` on ${date}` : ""}${category ? ` in ${category}` : ""}.`
          : `No events found${range ? ` for ${range === "1d" ? "today" : `next ${range}`}` : date ? ` on ${date}` : ""}${category ? ` in ${category}` : ""}.`,
    };
  },
});

export const campusInfo = tool({
  description:
    "Answer general questions about SUSS campus facilities, services, nearby venues, food, shopping, and nightlife. Use this for questions that don't require navigation or event lookup.",
  inputSchema: z.object({
    query: z.string().describe("The campus-related question to answer"),
  }),
  execute: async ({ query }) => {
    const q = query.toLowerCase();

    // Check if the query matches a category of nearby venues
    const categoryKeywords: Record<string, string> = {
      supermarket: "Supermarket",
      grocery: "Supermarket",
      fairprice: "Supermarket",
      restaurant: "Restaurant",
      eat: "Restaurant",
      food: "Restaurant",
      dining: "Restaurant",
      mall: "Mall",
      shopping: "Mall",
      bar: "Bar",
      club: "Bar",
      drink: "Bar",
      nightlife: "Bar",
      hawker: "Hawker",
      "food court": "Hawker",
      "food centre": "Hawker",
    };

    const matchedCategory = Object.entries(categoryKeywords).find(([kw]) => q.includes(kw));
    if (matchedCategory) {
      const venues = findPOIs(matchedCategory[1]);
      if (venues.length > 0) {
        const list = venues
          .map((v) => {
            let line = `• ${v.name}`;
            if (v.address) line += ` — ${v.address}`;
            if (v.hours) line += ` (${v.hours})`;
            if (v.rating) line += ` ⭐${v.rating}`;
            return line;
          })
          .join("\n");
        return {
          success: true as const,
          query,
          answer: `Here are nearby ${matchedCategory[1].toLowerCase()}s:\n${list}`,
          venues,
        };
      }
    }

    const info: Record<string, string> = {
      address: "SUSS is located at 463 Clementi Road, Singapore 599494.",
      shuttle:
        "Campus shuttle buses run every 15 minutes between SUSS Bus Stop and Clementi MRT (Exit A). First bus: 7:30 AM, last bus: 10:00 PM.",
      library:
        "The SUSS Library is open Mon-Fri 8:30 AM - 9:00 PM, Sat 8:30 AM - 1:00 PM. Closed on Sundays and public holidays.",
      canteen:
        "The Campus Canteen operates Mon-Sat 7:30 AM - 8:00 PM. Features local cuisine, vegetarian options, and a halal stall.",
      gym: "The Sports Complex includes a gym, badminton courts, and a multipurpose hall. Open daily 7:00 AM - 10:00 PM. Bring your student card.",
      wifi: "Campus WiFi: Connect to 'SUSS-Student' using your student portal credentials. IT Helpdesk can assist with connectivity issues.",
      parking:
        "Student parking is available at Basement 1. Season parking costs $60/month. Apply via the Admin Office.",
      bookstore:
        "The Campus Bookstore is open Mon-Fri 9:00 AM - 6:00 PM. Textbooks, stationery, and SUSS merchandise available.",
    };

    const matched = Object.entries(info).find(([key]) => q.includes(key));

    return {
      success: true as const,
      query,
      answer: matched
        ? matched[1]
        : `Here's what I know about SUSS campus: It's located at 463 Clementi Road with facilities including a library, canteen, sports complex, lecture halls, IT helpdesk, bookstore, and admin office. The campus shuttle connects to Clementi MRT. Nearby you'll find supermarkets (FairPrice), restaurants, malls (Clementi Mall), bars, and hawker centres. Ask me about any of these!`,
    };
  },
});

export const tools = {
  navigate_to: navigateTo,
  show_events: showEvents,
  campus_info: campusInfo,
};
