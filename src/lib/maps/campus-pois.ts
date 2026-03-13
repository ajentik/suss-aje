import type { POI } from "@/types";
import { ACTIVE_AGEING_CENTRES } from "./active-ageing-centres";

export const CAMPUS_CENTER = { lat: 1.3299, lng: 103.7764 };

export const CAMPUS_POIS: POI[] = [
  // ── Campus Buildings ────────────────────────────────────────
  {
    id: "block-a",
    name: "Block A – Student Hub & Gym",
    lat: 1.3303,
    lng: 103.7760,
    category: "Building",
    description:
      "Student Lounge (L1), Gym (L1 – A1.11/A1.14/A1.15), FoodClique & Food Gallery (L3), Carpark entrance",
  },
  {
    id: "block-b",
    name: "Block B – Student Services",
    lat: 1.3300,
    lng: 103.7768,
    category: "Building",
    description:
      "Student Hub (L1), Subway & FoodFest (L1, Halal), Study Spaces (L3)",
  },
  {
    id: "block-c",
    name: "Block C – Library & Seminar Rooms",
    lat: 1.3297,
    lng: 103.7762,
    category: "Building",
    description:
      "Starbucks (L1), SUSS Library (L2 – C.2.02, 5 discussion rooms, call pods, smart locker), Seminar Rooms (60-120 pax), Study Spaces (L4), Carpark entrance",
  },
  {
    id: "block-d",
    name: "Block D – Arts & Sports",
    lat: 1.3294,
    lng: 103.7756,
    category: "Building",
    description:
      "Performing Arts Theatre (L1, 400 seats), Dance Studio, Multi-purpose Sports Hall (badminton, basketball, floorball, netball, volleyball – 50 pax), Sports Therapy & First Aid Room",
  },

  // ── On-Campus ──────────────────────────────────────────────
  {
    id: "library",
    name: "SUSS Library",
    lat: 1.3302,
    lng: 103.7758,
    category: "Facility",
    description: "Main campus library with study rooms and digital resources",
  },
  {
    id: "canteen",
    name: "Campus Canteen",
    lat: 1.3295,
    lng: 103.7770,
    category: "Food",
    description: "Main dining hall with multiple food stalls",
  },
  {
    id: "lecture-hall-a",
    name: "Lecture Hall A",
    lat: 1.3305,
    lng: 103.7762,
    category: "Academic",
    description: "Large lecture hall seating 300 students",
  },
  {
    id: "lecture-hall-b",
    name: "Lecture Hall B",
    lat: 1.3303,
    lng: 103.7768,
    category: "Academic",
    description: "Medium lecture hall seating 150 students",
  },
  {
    id: "lecture-hall-c",
    name: "Lecture Hall C",
    lat: 1.3300,
    lng: 103.7755,
    category: "Academic",
    description: "Seminar-style lecture hall seating 80 students",
  },
  {
    id: "admin",
    name: "Admin Office",
    lat: 1.3297,
    lng: 103.7760,
    category: "Services",
    description: "Student administration and enrollment services",
  },
  {
    id: "bus-stop",
    name: "SUSS Bus Stop",
    lat: 1.3290,
    lng: 103.7775,
    category: "Transport",
    description: "Main bus stop serving campus shuttle and public buses",
  },
  {
    id: "gym",
    name: "Sports Complex",
    lat: 1.3292,
    lng: 103.7752,
    category: "Facility",
    description: "Gymnasium, fitness centre, and multipurpose sports hall",
  },
  {
    id: "it-helpdesk",
    name: "IT Helpdesk",
    lat: 1.3298,
    lng: 103.7765,
    category: "Services",
    description: "Technical support for students and staff",
  },
  {
    id: "bookstore",
    name: "Campus Bookstore",
    lat: 1.3301,
    lng: 103.7772,
    category: "Services",
    description: "Textbooks, stationery, and SUSS merchandise",
  },

  // ── Supermarkets ───────────────────────────────────────────
  {
    id: "fairprice-clementi-mall",
    name: "FairPrice Finest – Clementi Mall",
    lat: 1.3148,
    lng: 103.7649,
    category: "Supermarket",
    description: "Large 2-floor Finest in the mall",
    address: "3155 Commonwealth Ave W, B1-12/13/14, The Clementi Mall, S129588",
    hours: "7AM–11PM daily",
  },
  {
    id: "fairprice-blk-451",
    name: "FairPrice Clementi A (Blk 451)",
    lat: 1.3150,
    lng: 103.7654,
    category: "Supermarket",
    description: "Closest 24hr option to SUSS",
    address: "451 Clementi Ave 3, #01-307, S120451",
    hours: "24 hours",
  },
  {
    id: "fairprice-clementi-ave-2",
    name: "FairPrice Clementi Ave 2",
    lat: 1.3134,
    lng: 103.7710,
    category: "Supermarket",
    description: "Small neighbourhood outlet",
    address: "352 Clementi Ave 2, #01 Shopping Centre, S120352",
    hours: "24 hours",
  },
  {
    id: "fairprice-bukit-timah-plaza",
    name: "FairPrice Finest – Bukit Timah Plaza",
    lat: 1.3398,
    lng: 103.7709,
    category: "Supermarket",
    description: "Huge store, ~1.5km north of SUSS",
    address: "1 Jalan Anak Bukit, #B1-01 & #B2-01, Bukit Timah Plaza, S588996",
    hours: "24 hours",
  },
  {
    id: "u-stars",
    name: "U Stars Supermarket",
    lat: 1.3126,
    lng: 103.7647,
    category: "Supermarket",
    description: "Neighbourhood minimart on Clementi Ave 5",
    address: "345 Clementi Ave 5, #01-78, S120345",
    hours: "24 hours",
  },

  // ── Restaurants ────────────────────────────────────────────
  {
    id: "foodclique",
    name: "Foodclique (on campus)",
    lat: 1.3296,
    lng: 103.7768,
    category: "Restaurant",
    description: "Food court right on SUSS campus",
    address: "461 Clementi Rd, #A3.02C, SIM Global Education Block A, S599491",
    hours: "Mon–Fri 7:30AM–8PM, Sat till 2PM",
    cuisine: "Food court",
    rating: 3.5,
  },
  {
    id: "hoho-korean",
    name: "HoHo Korean Restaurant",
    lat: 1.3235,
    lng: 103.7672,
    category: "Restaurant",
    description: "Popular Korean restaurant near Sunset Way",
    address: "106 Clementi Street 12, #01-58/60, S120106",
    hours: "11:30AM–10PM (closed Tue)",
    cuisine: "Korean",
    rating: 4.3,
  },
  {
    id: "mariners-corner",
    name: "Mariners' Corner Restaurant",
    lat: 1.3236,
    lng: 103.7670,
    category: "Restaurant",
    description: "Hainanese Western cuisine near Sunset Way",
    address: "106 Clementi Street 12, #01-40, S120106",
    hours: "11:30AM–10:30PM daily",
    cuisine: "Hainanese Western",
    rating: 4.3,
  },
  {
    id: "sukiya",
    name: "Sukiya Gyudon",
    lat: 1.3150,
    lng: 103.7648,
    category: "Restaurant",
    description: "Japanese beef bowl chain at Clementi Mall",
    address: "3155 Commonwealth Ave W, #B1-34&35, The Clementi Mall",
    hours: "10AM–9:30PM daily",
    cuisine: "Japanese",
    rating: 4.4,
  },

  // ── Malls ──────────────────────────────────────────────────
  {
    id: "clementi-arcade",
    name: "Clementi Arcade (Sunset Way)",
    lat: 1.3250,
    lng: 103.7680,
    category: "Mall",
    description: "Closest mall to SUSS",
    address: "41 Sunset Way, S597071",
    hours: "9AM–10PM",
    rating: 3.8,
  },
  {
    id: "clementi-mall",
    name: "The Clementi Mall",
    lat: 1.3148,
    lng: 103.7649,
    category: "Mall",
    description: "Major mall ~2km from SUSS with supermarket, restaurants, and shops",
    address: "3155 Commonwealth Ave W, S129588",
    hours: "10AM–10PM",
    rating: 4.1,
  },
  {
    id: "clementi-town-centre",
    name: "Clementi Town Centre",
    lat: 1.3146,
    lng: 103.7652,
    category: "Mall",
    description: "Shopping area ~2km from SUSS",
    address: "449 Clementi Ave 3, S120449",
    hours: "Varies",
    rating: 4.3,
  },
  {
    id: "321-clementi",
    name: "321 Clementi",
    lat: 1.3110,
    lng: 103.7641,
    category: "Mall",
    description: "Mall ~2.5km from SUSS",
    address: "321 Clementi Ave 3, S129905",
    hours: "10AM–10PM",
    rating: 4.0,
  },
  {
    id: "west-coast-plaza",
    name: "West Coast Plaza",
    lat: 1.3050,
    lng: 103.7652,
    category: "Mall",
    description: "Mall ~3.5km from SUSS",
    address: "154 West Coast Road, S127371",
    hours: "10AM–10PM",
    rating: 3.9,
  },

  // ── Bars & Clubs ───────────────────────────────────────────
  {
    id: "get-some",
    name: "Get Some @ Clementi",
    lat: 1.3050,
    lng: 103.7580,
    category: "Bar",
    description: "Craft beer bar",
    address: "727 Clementi West Street 2, #01-282, S120727",
    hours: "Tue–Sun 3PM–12AM",
    rating: 4.8,
  },
  {
    id: "berlin-bar",
    name: "Berlin Bar (TradeHub 21)",
    lat: 1.3390,
    lng: 103.7420,
    category: "Bar",
    description: "Chill bar with pool table",
    address: "8 Boon Lay Way, #01-27, 8@TradeHub21, S609964",
    hours: "3PM–12AM daily",
    rating: 4.6,
  },
  {
    id: "obar",
    name: "OBAR @ TradeHub 21",
    lat: 1.3392,
    lng: 103.7418,
    category: "Bar",
    description: "Bar & grill",
    address: "8 Boon Lay Way, #01-32, TradeHub21, S609964",
    hours: "11AM–12AM daily",
    rating: 4.0,
  },
  {
    id: "le-white-bar",
    name: "Le White Bar",
    lat: 1.2960,
    lng: 103.7560,
    category: "Bar",
    description: "Karaoke, nightclub, and live band venue",
    address: "27 West Coast Highway, #01-05, S117867",
    hours: "4PM–1/2AM daily",
    rating: 4.8,
  },

  // ── Food Courts & Hawker Centres ───────────────────────────
  {
    id: "food-park-sunset",
    name: "Food Park (Sunset Way)",
    lat: 1.3238,
    lng: 103.7670,
    category: "Hawker",
    description: "~1km from SUSS",
    address: "107 Clementi St 12, #01-K1, S120107",
    hours: "6AM–10PM daily",
    rating: 3.7,
  },
  {
    id: "chang-cheng",
    name: "Chang Cheng Food Court",
    lat: 1.3237,
    lng: 103.7672,
    category: "Hawker",
    description: "Near Sunset Way, same block as Food Park",
    address: "107 Clementi St 12, Blk 107, S120107",
    hours: "7AM–9:30PM daily",
    rating: 3.3,
  },
  {
    id: "353-food-centre",
    name: "353 Clementi Food Centre",
    lat: 1.3138,
    lng: 103.7712,
    category: "Hawker",
    description: "Closes early afternoon",
    address: "353 Clementi Ave 2, S120353",
    hours: "6:30AM–5:25PM daily",
    rating: 4.0,
  },
  {
    id: "448-market",
    name: "448 Market & Food Centre",
    lat: 1.3142,
    lng: 103.7660,
    category: "Hawker",
    description: "Popular hawker centre with Michelin-rated stalls",
    address: "448 Clementi Ave 3, S120448",
    hours: "7AM–9PM daily",
    rating: 4.1,
  },
  {
    id: "hawkers-street",
    name: "Hawkers' Street (Clementi Mall)",
    lat: 1.3148,
    lng: 103.7649,
    category: "Hawker",
    description: "5 Michelin Bib Gourmand stalls — highly recommended",
    address: "3155 Commonwealth Ave W, #04-20/21/22, S129588",
    hours: "8:30AM–9:30PM daily",
    rating: 4.6,
  },
  {
    id: "ayer-rajah",
    name: "Ayer Rajah Food Centre",
    lat: 1.3065,
    lng: 103.7545,
    category: "Hawker",
    description: "Large hawker centre, open very late, great variety",
    address: "503 West Coast Dr, S120503",
    hours: "6AM–1AM daily",
    rating: 4.2,
  },
  {
    id: "west-coast-market",
    name: "West Coast Market Square",
    lat: 1.3055,
    lng: 103.7575,
    category: "Hawker",
    description: "Wide selection, very affordable",
    address: "726 Clementi West St 2, S120726",
    hours: "5:30AM–10:30PM daily",
    rating: 4.1,
  },

  // ── Active Ageing Centres ──────────────────────────────────
  ...ACTIVE_AGEING_CENTRES,
];

export function findPOI(query: string): POI | undefined {
  const q = query.toLowerCase();
  return CAMPUS_POIS.find(
    (poi) =>
      poi.id === q ||
      poi.name.toLowerCase().includes(q) ||
      poi.category.toLowerCase().includes(q) ||
      (poi.address && poi.address.toLowerCase().includes(q))
  );
}

export function findPOIs(query: string): POI[] {
  const q = query.toLowerCase();
  return CAMPUS_POIS.filter(
    (poi) =>
      poi.id === q ||
      poi.name.toLowerCase().includes(q) ||
      poi.category.toLowerCase().includes(q) ||
      (poi.cuisine && poi.cuisine.toLowerCase().includes(q))
  );
}
