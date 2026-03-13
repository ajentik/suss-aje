import { z } from "zod";
import { tool } from "ai";
import { CAMPUS_POIS, findPOI } from "@/lib/maps/campus-pois";
import campusEvents from "@/../public/campus-events.json";
import type { CampusEvent } from "@/types";

export const navigateTo = tool({
  description:
    "Navigate the 3D campus map to a specific destination and show walking directions. Use this when a student asks where something is or how to get somewhere.",
  inputSchema: z.object({
    destination: z
      .string()
      .describe("The name or type of place to navigate to, e.g. 'library', 'canteen', 'Lecture Hall A'"),
  }),
  execute: async ({ destination }) => {
    const poi = findPOI(destination);
    if (!poi) {
      return {
        success: false as const,
        message: `I couldn't find "${destination}" on campus. Available locations: ${CAMPUS_POIS.map((p) => p.name).join(", ")}`,
      };
    }
    return {
      success: true as const,
      poi,
      message: `Navigating to ${poi.name}. ${poi.description}`,
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
      .describe("Filter events by category, e.g. 'Tech', 'Academic', 'Sports', 'Community', 'Lecture', 'Forum', 'Conference', 'Career', 'Information Session', 'Open House'"),
    school: z
      .string()
      .optional()
      .describe("Filter by school: 'SUSS' or 'SIM'"),
  }),
  execute: async ({ date, category, school }) => {
    let filtered = campusEvents as unknown as CampusEvent[];

    if (date) {
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
      filters: { date, category },
      message:
        filtered.length > 0
          ? `Found ${filtered.length} event${filtered.length > 1 ? "s" : ""}${date ? ` on ${date}` : ""}${category ? ` in ${category}` : ""}.`
          : `No events found${date ? ` on ${date}` : ""}${category ? ` in ${category}` : ""}.`,
    };
  },
});

export const campusInfo = tool({
  description:
    "Answer general questions about SUSS campus facilities, services, and information. Use this for questions that don't require navigation or event lookup.",
  inputSchema: z.object({
    query: z.string().describe("The campus-related question to answer"),
  }),
  execute: async ({ query }) => {
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

    const q = query.toLowerCase();
    const matched = Object.entries(info).find(([key]) => q.includes(key));

    return {
      success: true as const,
      query,
      answer: matched
        ? matched[1]
        : `Here's what I know about SUSS campus: It's located at 463 Clementi Road with facilities including a library, canteen, sports complex, lecture halls, IT helpdesk, bookstore, and admin office. The campus shuttle connects to Clementi MRT. Can you ask a more specific question?`,
    };
  },
});

export const tools = {
  navigate_to: navigateTo,
  show_events: showEvents,
  campus_info: campusInfo,
};
