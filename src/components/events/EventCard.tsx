"use client";

import { useRef, useState } from "react";
import type { CampusEvent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { useAppStore } from "@/store/app-store";

interface EventCardProps {
  event: CampusEvent;
  index?: number;
}

const TYPE_COLORS: Record<string, string> = {
  "On-Campus": "bg-event-oncampus-bg text-event-oncampus-fg",
  Online: "bg-event-online-bg text-event-online-fg",
  External: "bg-event-external-bg text-event-external-fg",
};

const TYPE_DOTS: Record<string, string> = {
  "On-Campus": "bg-event-oncampus-fg",
  Online: "bg-event-online-fg",
  External: "bg-event-external-fg",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Information Session": "border-blue-500",
  "Open House": "border-green-500",
  "Public Lecture / Enrichment Talk": "border-purple-500",
  Symposium: "border-teal-500",
  "Competition / Hackathon": "border-orange-500",
  Career: "border-emerald-500",
  Social: "border-amber-500",
};

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setFlyToTarget({ lat: event.lat, lng: event.lng });
    setSelectedEvent(event);
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
      style={{ "--card-index": index } as React.CSSProperties}
      className={`animate-card-slide-in w-full text-left p-4 rounded-xl border border-l-4 ${CATEGORY_COLORS[event.category] || "border-gray-300"} bg-card hover:bg-muted/50 active:bg-muted/70 transition-colors flex flex-col gap-2.5 shadow-sm`}
    >
      {/* Header: logo + title + type dot */}
      <div className="flex items-start gap-3 w-full">
        {event.organizerLogo && (
          <img
            src={event.organizerLogo}
            alt={`${event.title} organizer`}
            width={36}
            height={36}
            className="w-9 h-9 rounded-lg shrink-0 object-cover border border-border/50"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-snug">{event.title}</h3>
            {event.type && (
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${TYPE_DOTS[event.type] || "bg-muted-foreground"}`} title={event.type} />
            )}
          </div>
          {/* Date & time row */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <span>{dateDisplay}</span>
            <span aria-hidden="true">·</span>
            <span>{event.time}</span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
          <title>Location</title>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="truncate">{event.location}</span>
        {event.venueAddress && event.venueAddress !== event.location && (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">{event.venueAddress}</span>
          </>
        )}
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-1.5 flex-wrap w-full">
        {event.type && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[event.type] || "bg-muted text-muted-foreground"}`}>
            {event.type}
          </span>
        )}
        <Badge variant="secondary" className="text-xs">
          {event.category}
        </Badge>
        {event.school && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {event.school}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 w-full">{event.description}</p>

      {/* Expandable long description */}
      {event.longDescription && (
        <div className="w-full text-sm text-muted-foreground">
          <div
            ref={contentRef}
            className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
            style={{
              maxHeight: isExpanded
                ? `${contentRef.current?.scrollHeight ?? 500}px`
                : "2.8em",
            }}
          >
            <div className={isExpanded ? "" : "line-clamp-2"}>
              {event.longDescription}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-primary hover:underline mt-1 font-medium text-xs min-h-[44px] flex items-center"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 w-full mt-1">
        {event.registrationUrl && (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 border border-primary text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/10 active:bg-primary/20 transition-colors min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4" />
            Register
          </a>
        )}
        {event.type !== "Online" ? (
          <button
            type="button"
            onClick={handleNavigate}
            className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <title>Navigate</title>
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            Navigate
          </button>
        ) : event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px]"
          >
            Join Online
          </a>
        ) : null}
      </div>
    </button>
  );
}
