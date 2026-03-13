"use client";

import { useState } from "react";
import type { CampusEvent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";

interface EventCardProps {
  event: CampusEvent;
}

const TYPE_COLORS: Record<string, string> = {
  "On-Campus": "bg-event-oncampus-bg text-event-oncampus-fg",
  Online: "bg-event-online-bg text-event-online-fg",
  External: "bg-event-external-bg text-event-external-fg",
};

export default function EventCard({ event }: EventCardProps) {
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setFlyToTarget({ lat: event.lat, lng: event.lng });
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStreetViewEvent(event);
  };

  const dateDisplay = event.endDate
    ? `${event.date} – ${event.endDate}`
    : event.date;

  return (
    <button
      type="button"
      aria-label={`View ${event.title} on map`}
      onClick={handleClick}
      className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2 w-full">
        <h3 className="font-medium text-sm leading-tight">{event.title}</h3>
        <Badge variant="secondary" className="text-[10px] shrink-0">
          {event.category}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap w-full">
        <span>{dateDisplay}</span>
        <span>·</span>
        <span>{event.time}</span>
        <span>·</span>
        <span className="truncate max-w-[150px]">{event.location}</span>
      </div>

      <div className="flex items-center gap-2 w-full">
        {event.type && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[event.type] || "bg-muted text-muted-foreground"}`}>
            {event.type}
          </span>
        )}
        {event.school && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {event.school}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 w-full">{event.description}</p>

      {event.longDescription && (
        <div className="w-full text-xs text-muted-foreground mt-1">
          <div className={isExpanded ? "" : "line-clamp-2"}>
            {event.longDescription}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-primary hover:underline mt-1 font-medium text-[11px]"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        </div>
      )}

      {event.venueAddress && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1 w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 shrink-0 mt-0.5"
          >
            <title>Venue Address</title>
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="leading-tight">{event.venueAddress}</span>
        </div>
      )}

      <div className="flex items-center justify-end w-full mt-1">
        {event.type !== "Online" ? (
          <button
            type="button"
            onClick={handleNavigate}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
            >
              <title>Navigate</title>
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            Navigate here
          </button>
        ) : event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-primary hover:underline ml-auto"
          >
            Join Online →
          </a>
        ) : null}
      </div>
    </button>
  );
}
