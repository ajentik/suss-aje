"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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

const CATEGORY_ACCENT: Record<string, string> = {
  "Information Session": "border-l-blue-500",
  "Open House": "border-l-emerald-500",
  "Public Lecture / Enrichment Talk": "border-l-violet-500",
  Symposium: "border-l-teal-500",
  "Competition / Hackathon": "border-l-orange-500",
  Career: "border-l-sky-500",
  Social: "border-l-amber-500",
};

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded]);
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
      className={`animate-card-slide-in w-full text-left rounded-2xl border border-border/60 border-l-4 ${CATEGORY_ACCENT[event.category] || "border-l-gray-300"} bg-card hover:bg-muted/30 active:bg-muted/50 active:scale-[0.985] transition-all duration-200 ease-out flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5`}
    >
      {/* Header: logo + title + type indicator */}
      <div className="flex items-start gap-3.5 w-full">
        {event.organizerLogo ? (
          <img
            src={event.organizerLogo}
            alt={`${event.title} organizer`}
            width={40}
            height={40}
            className="w-10 h-10 rounded-xl shrink-0 object-cover border border-border/40 shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl shrink-0 bg-muted flex items-center justify-center border border-border/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground/60">
              <title>Event</title>
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[0.938rem] leading-snug tracking-[-0.01em] text-foreground">{event.title}</h3>
            {event.type && (
              <span className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${TYPE_DOTS[event.type] || "bg-muted-foreground"}`} />
                <span className="text-[0.6875rem] text-muted-foreground font-medium hidden min-[400px]:inline">{event.type}</span>
              </span>
            )}
          </div>
          {/* Date & time — prominent */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0 text-primary/70">
              <title>Date</title>
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <span className="text-[0.8125rem] font-semibold text-foreground/80">{dateDisplay}</span>
            <span aria-hidden="true" className="text-muted-foreground/40">·</span>
            <span className="text-[0.8125rem] font-medium text-foreground/70">{event.time}</span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70">
          <title>Location</title>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="truncate">{event.location}</span>
        {event.venueAddress && event.venueAddress !== event.location && (
          <>
            <span aria-hidden="true" className="text-muted-foreground/30">·</span>
            <span className="truncate text-muted-foreground/70">{event.venueAddress}</span>
          </>
        )}
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-1.5 flex-wrap w-full">
        {event.type && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[event.type] || "bg-muted text-muted-foreground"}`}>
            {event.type}
          </span>
        )}
        <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full">
          {event.category}
        </Badge>
        {event.school && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
            {event.school}
          </span>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-2 w-full">{event.description}</p>
      )}

      {/* Expandable long description */}
      {event.longDescription && (
        <div className="w-full text-sm text-muted-foreground/90 leading-relaxed">
          <div
            ref={contentRef}
            className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
            style={{
              maxHeight: isExpanded
                ? `${contentHeight || 500}px`
                : "0px",
            }}
          >
            <div className="pt-1">
              {event.longDescription}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-primary hover:text-primary/80 mt-1.5 font-medium text-xs min-h-[44px] flex items-center gap-1 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            >
              <title>{isExpanded ? "Collapse" : "Expand"}</title>
              <path d="m6 9 6 6 6-6" />
            </svg>
            {isExpanded ? "Show less" : "Read more"}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2.5 w-full mt-0.5">
        {event.registrationUrl && (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 border-2 border-primary/80 text-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/10 active:bg-primary/20 transition-all min-h-[44px] min-w-[44px]"
          >
            <ExternalLink className="w-4 h-4" />
            Register
          </a>
        )}
        {event.type !== "Online" ? (
          <button
            type="button"
            onClick={handleNavigate}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 active:opacity-80 active:scale-95 transition-all min-h-[44px] min-w-[44px] shadow-sm"
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
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 active:opacity-80 active:scale-95 transition-all min-h-[44px] min-w-[44px] shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Join Online
          </a>
        ) : null}
      </div>
    </button>
  );
}
