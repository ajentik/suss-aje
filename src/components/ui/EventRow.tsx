"use client";

import { MapPin, ExternalLink } from "lucide-react";
import type { CampusEvent } from "@/types";
import { isOffSiteEvent } from "@/lib/maps/aac-events";
import { formatEventDate, formatEventDateRange } from "@/lib/date-utils";

interface EventRowProps {
  event: CampusEvent;
  poiLat?: number;
  poiLng?: number;
  onEventClick: (event: CampusEvent) => void;
  compact?: boolean;
}

export default function EventRow({
  event,
  poiLat,
  poiLng,
  onEventClick,
  compact = false,
}: EventRowProps) {
  const offSite =
    poiLat !== undefined &&
    poiLng !== undefined &&
    isOffSiteEvent(event, poiLat, poiLng);

  const dateLabel = compact
    ? formatEventDate(event.date)
    : formatEventDateRange(event.date, event.endDate);

  return (
    <div className="flex items-start gap-2.5 min-h-[44px]">
      <button
        type="button"
        onClick={() => onEventClick(event)}
        className="flex-1 min-w-0 text-left flex items-start gap-2.5 bg-secondary/50 border border-secondary rounded-lg px-3.5 py-2.5 hover:bg-secondary/80 active:bg-secondary transition-colors"
      >
        {!compact && event.organizerLogo && (
          <img
            src={event.organizerLogo}
            alt=""
            width={24}
            height={24}
            className="w-6 h-6 rounded-md shrink-0 object-cover border border-border/40 mt-0.5"
          />
        )}
        <span className="text-primary text-xs font-medium shrink-0 mt-0.5 min-w-[52px]">
          {dateLabel}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-card-foreground line-clamp-1">
            {event.title}
          </span>
          {!compact && (
            <>
              <span className="text-xs text-muted-foreground/70 block mt-0.5">
                {event.time}
              </span>
              {event.description && (
                <span className="text-xs text-muted-foreground/50 block mt-0.5 line-clamp-1">
                  {event.description}
                </span>
              )}
              {offSite && event.venueAddress && (
                <span className="inline-flex items-center gap-1 text-[0.6875rem] text-amber-600 dark:text-amber-400 mt-1">
                  <MapPin size={10} aria-hidden="true" />
                  {event.venueAddress}
                </span>
              )}
            </>
          )}
        </div>
      </button>
      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 mt-2.5 flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label={`Open ${event.title} details`}
        >
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
