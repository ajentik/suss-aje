import type { POI } from "@/types";

export const CAMPUS_CENTER = { lat: 1.3299, lng: 103.7764 };

export const CAMPUS_POIS: POI[] = [
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
];

export function findPOI(query: string): POI | undefined {
  const q = query.toLowerCase();
  return CAMPUS_POIS.find(
    (poi) =>
      poi.id === q ||
      poi.name.toLowerCase().includes(q) ||
      poi.category.toLowerCase().includes(q)
  );
}
