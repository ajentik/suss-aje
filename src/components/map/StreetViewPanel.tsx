"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { CampusEvent } from "@/types";

interface StreetViewPanelProps {
  location: { lat: number; lng: number };
  onClose: () => void;
  eventInfo?: CampusEvent;
}

function EventInfoOverlay({ event }: { event: CampusEvent }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-10 max-w-sm bg-card/95 backdrop-blur rounded-2xl shadow-xl border border-border overflow-hidden">
      <div className={`p-3 ${isExpanded && event.longDescription ? "max-h-[60vh] overflow-y-auto" : ""}`}>
        <h3 className="text-sm font-bold text-foreground">{event.title}</h3>

        <div className="mt-1">
          <p className="text-xs text-muted-foreground">
            {event.date}{event.endDate ? ` – ${event.endDate}` : ""} • {event.time}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {event.location}
          </p>
          {event.venueAddress && (
            <p className="text-xs text-muted-foreground">
              {event.venueAddress}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          {event.description}
        </p>

        {event.longDescription && (
          <div className="mt-1.5">
            <div className={`text-xs text-muted-foreground whitespace-pre-line ${isExpanded ? "" : "line-clamp-3"}`}>
              {event.longDescription}
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary hover:underline mt-1 font-medium text-[11px]"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground">
            {event.type}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
            {event.category}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
            {event.school}
          </span>
        </div>

        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-primary hover:underline"
          >
            Event Details →
          </a>
        )}
      </div>
    </div>
  );
}

export default function StreetViewPanel({
  location,
  onClose,
  eventInfo,
}: StreetViewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !window.google?.maps) return;

    // source DEFAULT includes indoor collections for multi-story navigation
    new window.google.maps.StreetViewPanorama(containerRef.current, {
      position: location,
      pov: { heading: 0, pitch: 0 },
      zoom: 1,
      motionTracking: false,
      motionTrackingControl: false,
      addressControl: true,
      fullscreenControl: false,
      linksControl: true,
      clickToGo: true,
      scrollwheel: true,
    } as google.maps.StreetViewPanoramaOptions);
  }, [location]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-card/95 backdrop-blur rounded-xl shadow-xl border border-border text-sm font-medium text-card-foreground hover:bg-card transition-colors"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to 3D Map
      </button>

      {eventInfo && (
        <EventInfoOverlay event={eventInfo} />
      )}
    </div>
  );
}
