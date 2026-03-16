"use client";

import { useMemo } from "react";
import { MapPin, Phone, Share2, Navigation, CalendarX } from "lucide-react";
import aacEventsData from "@/../public/aac-events.json";
import type { CampusEvent, POI } from "@/types";
import { ACTIVE_AGEING_CENTRES } from "@/lib/maps/active-ageing-centres";
import { ACTIVE_AGEING_CENTRES_NEW } from "@/lib/maps/active-ageing-centres-new";
import { useWalkingRoute } from "@/hooks/useWalkingRoute";

// ── Helpers ─────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning!";
  if (hour < 17) return "Good afternoon!";
  return "Good evening!";
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function validateEvents(data: typeof aacEventsData): CampusEvent[] {
  return data.map((e) => ({
    ...e,
    type: e.type as CampusEvent["type"],
    school: e.school as CampusEvent["school"],
    endDate: e.endDate ?? undefined,
    recurrence: e.recurrence ?? undefined,
  }));
}

const ALL_AAC_POIS: POI[] = [
  ...ACTIVE_AGEING_CENTRES,
  ...ACTIVE_AGEING_CENTRES_NEW,
];

const aacByName = new Map<string, POI>(
  ALL_AAC_POIS.map((p) => [p.name, p]),
);

function getTodaysEvents(): CampusEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  const allEvents = validateEvents(aacEventsData);

  return allEvents
    .filter((e) => {
      const endDate = e.endDate || e.date;
      return e.date <= today && endDate >= today;
    })
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime(),
    );
}

// ── Share helper ────────────────────────────────────────────────

async function shareActivity(event: CampusEvent, aac: POI | undefined) {
  const lines = [
    event.title,
    `📍 ${event.location}`,
    aac?.address ? `📫 ${aac.address}` : null,
    `🕐 ${formatTime(event.time)}`,
  ].filter(Boolean);

  const text = lines.join("\n");

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: event.title, text });
      return;
    } catch {
      /* user cancelled or share failed — fall through to clipboard */
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  }
}

// ── Activity Card ───────────────────────────────────────────────

interface ActivityCardProps {
  event: CampusEvent;
}

function ActivityCard({ event }: ActivityCardProps) {
  const aac = aacByName.get(event.location);
  const { walkTo } = useWalkingRoute();

  const poi: POI | undefined = aac ?? {
    id: event.id,
    name: event.location,
    lat: event.lat,
    lng: event.lng,
    category: "Active Ageing Centre",
    description: event.description,
    address: event.venueAddress,
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <h3 className="text-[22px] font-bold leading-snug text-foreground">
        {event.title}
      </h3>

      <div className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
        <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {event.location}
          {(aac?.address || event.venueAddress) && (
            <>
              {" · "}
              {aac?.address || event.venueAddress}
            </>
          )}
        </span>
      </div>

      <p className="mt-1 text-sm font-medium text-foreground/80">
        🕐 {formatTime(event.time)}
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => walkTo(poi)}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-4 text-primary-foreground min-h-[52px] text-base font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          <Navigation size={20} aria-hidden="true" />
          🚶 Get Directions
        </button>

        {aac?.contact ? (
          <a
            href={`tel:${aac.contact.replace(/\s/g, "")}`}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-primary/80 px-4 text-primary min-h-[52px] text-base font-semibold hover:bg-primary/10 active:bg-primary/20 transition-all"
          >
            <Phone size={20} aria-hidden="true" />
            📞 Call Centre
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-border px-4 text-muted-foreground min-h-[52px] text-base font-semibold opacity-60 cursor-not-allowed"
          >
            <Phone size={20} aria-hidden="true" />
            📞 Call Centre
          </button>
        )}

        <button
          type="button"
          onClick={() => shareActivity(event, aac)}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-primary/80 px-4 text-primary min-h-[52px] text-base font-semibold hover:bg-primary/10 active:bg-primary/20 transition-all"
        >
          <Share2 size={20} aria-hidden="true" />
          📤 Share with Family
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

export default function TodaysActivities() {
  const events = useMemo(() => getTodaysEvents(), []);

  const subtitle =
    events.length === 0
      ? null
      : `${events.length} ${events.length === 1 ? "activity" : "activities"} near you today`;

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {getGreeting()}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
            <CalendarX className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
            No activities scheduled nearby today. Tap below to find your
            nearest AAC.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <ActivityCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
