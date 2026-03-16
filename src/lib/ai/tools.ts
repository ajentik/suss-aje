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
      .describe("Filter events by date in YYYY-MM-DD format. Use dynamic date detection for 'today'."),
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
      building: "Building",
      block: "Building",
      aic: "AIC Office",
      "aic office": "AIC Office",
      "aic link": "AIC Office",
      sgo: "AIC Office",
      "silver generation": "AIC Office",
      caregiver: "AIC Office",
      eldercare: "AIC Office",
      "elderfund": "AIC Office",
      "nursing home": "AIC Office",
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
        "The SUSS Library is in Block C, Level 2 (room C.2.02). Open Mon–Fri 8:30AM–9:00PM, Sat 8:30AM–1:00PM. Closed Sun & public holidays. Features 5 discussion rooms (up to 5 persons), 2 call pods, A3 scanner, power outlets & wireless chargers, and 24/7 smart locker pickup.",
      canteen:
        "The Campus Canteen (FoodClique & Food Gallery) is in Block A, Level 3. Open Mon–Fri 7:30AM–8PM, Sat till 2PM. Features local cuisine, vegetarian options, and a halal stall. Block B Level 1 also has Subway & FoodFest (Halal-certified).",
      gym: "The Gym is in Block A, Level 1 (rooms A1.11, A1.14, A1.15). Max 1.5hr sessions per day. Block D has the Multi-purpose Sports Hall (badminton, basketball, floorball, netball, volleyball, 50 pax) and Sports Therapy/First Aid Room.",
      wifi: "Campus WiFi: Connect to 'SUSS-Student' using your student portal credentials. IT Helpdesk can assist with connectivity issues.",
      parking:
        "Parking available at Block A and Block C carpark entrances. $1.28/hour for cars, free for motorcycles. 6:00AM–12:00AM daily. Season parking $60/month via Admin Office.",
      bookstore:
        "The Campus Bookstore is open Mon–Fri 9:00AM–6:00PM. Textbooks, stationery, and SUSS merchandise available.",
      "block a":
        "Block A: Student Lounge (L1), Gym (L1 – rooms A1.11/A1.14/A1.15), FoodClique & Food Gallery (L3), Carpark entrance.",
      "block b":
        "Block B: Student Hub (L1), Subway & FoodFest (L1, Halal-certified), Study Spaces (L3).",
      "block c":
        "Block C: Starbucks (L1), SUSS Library (L2 – C.2.02, 5 discussion rooms, call pods, smart locker), Seminar Rooms (60-120 pax), Study Spaces (L4), Carpark entrance.",
      "block d":
        "Block D: Performing Arts Theatre (L1, 400 seats), Dance Studio, Multi-purpose Sports Hall (badminton, basketball, floorball, netball, volleyball – 50 pax), Sports Therapy & First Aid Room.",
      sim: "SIM (Singapore Institute of Management) shares the campus at 461 Clementi Road. SIM Global Education offers degree programmes with overseas partner universities. SIM manages venue allocation for shared facilities. SIM Open House is held bi-annually (March & September). The DREAMS Career Fair features ~60 companies.",
      "ngee ann":
        "Ngee Ann Polytechnic (NP) is at 535 Clementi Road — adjacent to SUSS/SIM campus and within walking distance. SUSS counselling services (C-three) have been relocated to NP Block 23, Level 5.",
      counselling:
        "SUSS counselling services (C-three) have been relocated to Ngee Ann Polytechnic, Block 23, Level 5 (535 Clementi Road, Singapore 599489).",
      mrt: "Nearest MRT: King Albert Park (Downtown Line DT6, Exit A). Campus shuttle runs every 15 min to Clementi MRT.",
      bus: "Bus routes 74, 151, 154 stop at 'Clementi Rd – Opp SIM HQ'. Campus shuttle to Clementi MRT every 15 min (7:30AM–10:00PM).",
      hours: "Campus hours: 6:00AM–11:59PM daily, including weekends and public holidays.",
      theatre:
        "The Performing Arts Theatre is in Block D, Level 1. It seats 400 and hosts performances, conferences, and events.",
      starbucks: "Starbucks is in Block C, Level 1.",
      "study room":
        "Study spaces are available at Block B Level 3, Block C Level 4, and the SUSS Library (Block C Level 2) with 5 discussion rooms.",
      aic: "AIC (Agency for Integrated Care) provides community care services for seniors and caregivers in Singapore. AIC Hotline: 1800-650-6060 (Mon–Fri 8:30AM–8:30PM, Sat 8:30AM–4PM). AIC Link centres are located at major hospitals (SGH, TTSH, CGH, KTPH, NUH, SKH, NTFGH, Alexandra Hospital). Silver Generation Office (SGO) has 17 satellite offices across Singapore for senior outreach. HQ: 5 Maxwell Road, #10-00 Tower Block, MND Complex, S069110. Email: enquiries@aic.sg",
      "aic link":
        "AIC Link centres provide walk-in advice on care services and schemes including: ElderFund, CHAS, Home Caregiving Grant (HCG), Seniors' Mobility and Enabling Fund (SMF), Caregivers Training Grant (CTG), nursing home and day care placement, dementia support, and respite care. Located at major hospitals: SGH, TTSH, CGH, KTPH, NUH, SKH, NTFGH, and Alexandra Hospital. Hours: Mon–Fri 8:30AM–5:30PM.",
      "silver generation":
        "The Silver Generation Office (SGO) is part of AIC. SGO volunteers conduct door-to-door outreach to seniors, connecting them to care services, health screenings (functional screening), and community programmes. 17 satellite offices across Singapore covering Ang Mo Kio, Bishan-Toa Payoh, Jalan Besar, Tanjong Pagar, Marine Parade, East Coast, Aljunied, Tampines, Pasir Ris-Punggol, Sengkang, Holland-Bukit Timah, West Coast, Jurong, Choa Chu Kang, Marsiling-Yew Tee, Nee Soon, and Sembawang.",
      caregiver:
        "AIC supports caregivers with: Caregivers Training Grant (CTG) for subsidised training, respite care to give caregivers a break, Home Caregiving Grant (HCG) for monthly cash payouts, and caregiver support resources. Call AIC Hotline 1800-650-6060 or visit any AIC Link centre at major hospitals.",
      eldercare:
        "AIC eldercare services include: home care, day care, dementia day care, day rehabilitation, nursing home placement, ElderFund, Seniors' Mobility and Enabling Fund (SMF), Home Caregiving Grant (HCG), and Pioneer Generation Disability Assistance Scheme. Call AIC Hotline 1800-650-6060.",
      "nursing home":
        "For nursing home placement assistance, visit any AIC Link centre at major hospitals or call AIC Hotline 1800-650-6060. AIC Care Consultants can help assess care needs and find suitable facilities. Financial assistance (ElderFund, Medifund) may be available.",
    };

    const matched = Object.entries(info).find(([key]) => q.includes(key));

    return {
      success: true as const,
      query,
      answer: matched
        ? matched[1]
        : `Here's what I know about SUSS campus at 463 Clementi Road: 4 main blocks (A–D) with library, canteen, gym, sports hall, theatre, Starbucks, study spaces, and more. The campus is shared with SIM. Ngee Ann Polytechnic is adjacent. Campus shuttle connects to Clementi MRT. Nearby: supermarkets (FairPrice), restaurants, malls (Clementi Mall), bars, and hawker centres. Ask me about any of these!`,
    };
  },
});

export const tools = {
  navigate_to: navigateTo,
  show_events: showEvents,
  campus_info: campusInfo,
};
