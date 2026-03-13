"use client";

import { useCallback, useState } from "react";
import { useAppStore } from "@/store/app-store";
import type { CampusEvent } from "@/types";

export default function EventPopup() {
  const selectedEvent = useAppStore((s) => s.selectedEvent);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const [fadingOutEvent, setFadingOutEvent] = useState<CampusEvent | null>(null);

  const displayEvent = selectedEvent ?? fadingOutEvent;
  const isVisible = !!selectedEvent;

  const handleClose = useCallback(() => {
    setFadingOutEvent(useAppStore.getState().selectedEvent);
    setSelectedEvent(null);
  }, [setSelectedEvent]);

  const handleTransitionEnd = useCallback(() => {
    if (!useAppStore.getState().selectedEvent) {
      setFadingOutEvent(null);
    }
  }, []);

  const handleNavigate = useCallback(() => {
    if (displayEvent && displayEvent.type !== "Online") {
      setStreetViewEvent(displayEvent);
    }
    setSelectedEvent(null);
    setFadingOutEvent(null);
  }, [displayEvent, setStreetViewEvent, setSelectedEvent]);

  if (!displayEvent) return null;

  return (
    <div 
      className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-20 transition-all duration-200 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="bg-white rounded-xl shadow-lg max-w-md w-[calc(100vw-2rem)] sm:w-[380px] p-5 relative border border-gray-100">
        <button type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close popup"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Close</title>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="mb-2">
          <span className="inline-block bg-secondary text-secondary-foreground text-sm font-semibold px-3 py-1 rounded-full">
            {displayEvent.category}
          </span>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-1.5 pr-6">
          {displayEvent.title}
        </h3>

        <p className="text-[0.9375rem] text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {displayEvent.description}
        </p>

        <div className="space-y-2 mb-4 text-[0.9375rem] text-muted-foreground">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
              <title>Date</title>
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            <span className="line-clamp-1">
              {displayEvent.date}{displayEvent.endDate ? ` – ${displayEvent.endDate}` : ""}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
              <title>Time</title>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="line-clamp-1">{displayEvent.time}</span>
          </div>

          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
              <title>Location</title>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="line-clamp-1">{displayEvent.location}</span>
          </div>

          {displayEvent.venueAddress && (
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                <title>Venue Address</title>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="line-clamp-1">{displayEvent.venueAddress}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
            {displayEvent.type}
          </span>
          <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-medium">
            {displayEvent.school}
          </span>
        </div>

        {displayEvent.url && displayEvent.type !== "Online" && (
          <div className="mb-2 text-right">
            <a 
              href={displayEvent.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-medium"
            >
              Details →
            </a>
          </div>
        )}

        {displayEvent.type !== "Online" ? (
          <button type="button"
            onClick={handleNavigate}
            className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-[0.9375rem] font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <title>Navigate</title>
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Navigate here
          </button>
        ) : displayEvent.url ? (
          <a
            href={displayEvent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-[0.9375rem] font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Join Online →
          </a>
        ) : null}
      </div>
    </div>
  );
}
