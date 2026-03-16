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
    <div
      className="absolute left-3 right-3 md:left-4 md:right-auto z-10 max-w-sm bg-card/85 backdrop-blur-xl rounded-2xl shadow-xl border border-border/30 overflow-hidden animate-control-slide-up md:bottom-4"
      style={{
        bottom: `calc(var(--sheet-height, 64px) + 16px)`,
      }}
    >
      <div className={`p-3.5 ${isExpanded && event.longDescription ? "max-h-[60vh] overflow-y-auto" : ""}`}>
        <h3 className="text-sm font-bold text-foreground">{event.title}</h3>

        <div className="mt-1">
          <p className="text-xs text-muted-foreground">
            {event.date}{event.endDate ? ` \u2013 ${event.endDate}` : ""} \u2022 {event.time}
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
              className="text-primary hover:underline mt-1.5 font-medium text-xs min-h-[44px] active:opacity-70 transition-opacity"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground">
            {event.type}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
            {event.category}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
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
            Event Details \u2192
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in after mount
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (!containerRef.current || !window.google?.maps) return;

    const panorama = new window.google.maps.StreetViewPanorama(
      containerRef.current,
      {
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
      } as google.maps.StreetViewPanoramaOptions,
    );

    return () => {
      panorama.setVisible(false);
      window.google?.maps?.event.clearInstanceListeners(panorama);
    };
  }, [location]);

  return (
    <div
      className="w-full h-full relative transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div ref={containerRef} className="w-full h-full" />
      <button
        type="button"
        onClick={onClose}
        className="absolute left-3 z-10 flex items-center gap-2 px-4 min-h-[44px] bg-card/80 backdrop-blur-xl border border-border/30 rounded-xl shadow-lg text-sm font-medium text-card-foreground hover:bg-card/95 active:scale-95 transition-all duration-200 animate-control-fade-in"
        style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))" }}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back to Map
      </button>

      {eventInfo && (
        <EventInfoOverlay event={eventInfo} />
      )}
    </div>
  );
}
