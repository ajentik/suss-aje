import type { CampusEvent } from "@/types";

const SPECIAL_KEYWORDS = [
  "workshop",
  "outing",
  "trip",
  "excursion",
  "festival",
  "celebration",
  "screening",
  "talk",
  "seminar",
  "cooking",
  "baking",
  "community kitchen",
  "makan",
] as const;

export type AACEventKind = "regular" | "special";

export function classifyAACEvent(event: CampusEvent): AACEventKind {
  const text = `${event.title} ${event.description}`.toLowerCase();
  return SPECIAL_KEYWORDS.some((kw) => text.includes(kw))
    ? "special"
    : "regular";
}

export interface AACEventsByKind {
  regular: CampusEvent[];
  special: CampusEvent[];
}

export interface AACEventsFilters {
  location?: string;
  operator?: string;
  date?: string;
  limit?: number;
  offset?: number;
}

interface AACEventsResponse {
  data: CampusEvent[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchAACEvents(
  filters: AACEventsFilters = {},
): Promise<AACEventsResponse> {
  const params = new URLSearchParams();
  if (filters.location) params.set("location", filters.location);
  if (filters.operator) params.set("operator", filters.operator);
  if (filters.date) params.set("date", filters.date);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined)
    params.set("offset", String(filters.offset));

  const qs = params.toString();
  const url = `/api/aac-events${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch AAC events: ${res.status}`);
  }
  return res.json();
}

/**
 * Finds all AAC events that belong to a given POI by matching the AAC name
 * in the event's `location` field. Returns events split by kind.
 */
export async function getAACEventsForPOI(
  poiName: string,
): Promise<AACEventsByKind> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: events } = await fetchAACEvents({
    location: poiName,
    date: today,
    limit: 200,
  });

  const result: AACEventsByKind = { regular: [], special: [] };
  for (const event of events) {
    result[classifyAACEvent(event)].push(event);
  }

  const byDate = (a: CampusEvent, b: CampusEvent) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
  result.regular.sort(byDate);
  result.special.sort(byDate);

  return result;
}

export function isOffSiteEvent(
  event: CampusEvent,
  poiLat: number,
  poiLng: number,
): boolean {
  const dlat = Math.abs(event.lat - poiLat);
  const dlng = Math.abs(event.lng - poiLng);
  return dlat + dlng > 0.002;
}
