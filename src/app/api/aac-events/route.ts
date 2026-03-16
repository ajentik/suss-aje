import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { CampusEvent } from "@/types";

interface RawAACEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string | null;
  time: string;
  endTime?: string;
  recurrence?: string | null;
  tags?: string[];
  location: string;
  category: string;
  description: string;
  type: string;
  school: string;
  lat: number;
  lng: number;
  url?: string;
  venueAddress?: string;
  longDescription?: string;
  registrationUrl?: string;
  organizerLogo?: string;
}

let cachedEvents: CampusEvent[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function normalise(raw: RawAACEvent): CampusEvent {
  return {
    id: raw.id,
    title: raw.title,
    date: raw.date,
    endDate: raw.endDate ?? undefined,
    time: raw.time,
    endTime: raw.endTime,
    recurrence: raw.recurrence ?? undefined,
    tags: raw.tags,
    location: raw.location,
    category: raw.category,
    description: raw.description,
    type: raw.type as CampusEvent["type"],
    school: raw.school as CampusEvent["school"],
    lat: raw.lat,
    lng: raw.lng,
    url: raw.url,
    venueAddress: raw.venueAddress,
    longDescription: raw.longDescription,
    registrationUrl: raw.registrationUrl,
  };
}

async function loadEvents(): Promise<CampusEvent[]> {
  const now = Date.now();
  if (cachedEvents && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedEvents;
  }

  const filePath = path.join(process.cwd(), "public", "aac-events.json");
  const raw: RawAACEvent[] = JSON.parse(await fs.readFile(filePath, "utf-8"));
  cachedEvents = raw.map(normalise);
  cacheTimestamp = now;
  return cachedEvents;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const operator = searchParams.get("operator");
  const location = searchParams.get("location");
  const date = searchParams.get("date");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const limit = Math.min(
    Math.max(1, Number(limitParam) || DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const offset = Math.max(0, Number(offsetParam) || 0);

  let events: CampusEvent[];
  try {
    events = await loadEvents();
  } catch {
    return NextResponse.json(
      { error: "Failed to load AAC events data" },
      { status: 500 },
    );
  }

  // Filter by location (exact match on the location field, e.g. "Allkin AAC (Yishun)")
  if (location) {
    events = events.filter((e) => e.location === location);
  }

  // Filter by operator (partial match on location, e.g. "Allkin")
  if (operator) {
    const op = operator.toLowerCase();
    events = events.filter((e) => e.location.toLowerCase().includes(op));
  }

  // Filter by date — only events whose active range includes this date
  if (date) {
    events = events.filter((e) => {
      const endDate = e.endDate || e.date;
      return e.date <= date && endDate >= date;
    });
  }

  const total = events.length;
  const page = events.slice(offset, offset + limit);

  return NextResponse.json(
    { data: page, total, limit, offset },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
      },
    },
  );
}
