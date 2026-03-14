import type { CampusEvent } from "@/types";
import aacEventsData from "@/../public/aac-events.json";

function validateAACEvents(data: typeof aacEventsData): CampusEvent[] {
  return data.map((e) => ({
    ...e,
    type: e.type as CampusEvent["type"],
    school: e.school as CampusEvent["school"],
    endDate: e.endDate ?? undefined,
    recurrence: e.recurrence ?? undefined,
  }));
}

const allAacEvents = validateAACEvents(aacEventsData);

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

/**
 * Finds all AAC events that belong to a given POI by matching the AAC name
 * in the event's `location` field.
 */
export function getAACEventsForPOI(poiName: string): AACEventsByKind {
  const today = new Date().toISOString().slice(0, 10);
  const matching = allAacEvents.filter((e) => {
    const endDate = e.endDate || e.date;
    return e.location === poiName && endDate >= today;
  });

  const result: AACEventsByKind = { regular: [], special: [] };
  for (const event of matching) {
    result[classifyAACEvent(event)].push(event);
  }

  const byDate = (a: CampusEvent, b: CampusEvent) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
  result.regular.sort(byDate);
  result.special.sort(byDate);

  return result;
}

/**
 * Checks whether an event's venue differs from the parent AAC centre's location.
 * Returns true when the event lat/lng is more than ~200m away from the POI.
 */
export function isOffSiteEvent(
  event: CampusEvent,
  poiLat: number,
  poiLng: number,
): boolean {
  const dlat = Math.abs(event.lat - poiLat);
  const dlng = Math.abs(event.lng - poiLng);
  return dlat + dlng > 0.002;
}
