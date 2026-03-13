"use client";

import { useCallback, useState, useRef } from "react";
import { X, Calendar, Clock, MapPin, Navigation } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { CampusEvent } from "@/types";

export default function EventPopup() {
  const selectedEvent = useAppStore((s) => s.selectedEvent);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const [fadingOutEvent, setFadingOutEvent] = useState<CampusEvent | null>(
    null,
  );

  const displayEvent = selectedEvent ?? fadingOutEvent;
  const isVisible = !!selectedEvent;

  // Swipe-to-dismiss
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleClose = useCallback(() => {
    setFadingOutEvent(useAppStore.getState().selectedEvent);
    setSelectedEvent(null);
  }, [setSelectedEvent]);

  const handleTouchEnd = useCallback(() => {
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 60) {
      handleClose();
    }
  }, [handleClose]);

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
      className={`absolute bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-95 pointer-events-none"
      }`}
      onTransitionEnd={handleTransitionEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-card rounded-2xl shadow-xl max-w-md w-[calc(100vw-1.5rem)] sm:w-[380px] p-5 relative border border-border">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close popup"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="mb-2">
          <span className="inline-block bg-secondary text-secondary-foreground text-sm font-semibold px-3 py-1 rounded-full">
            {displayEvent.category}
          </span>
        </div>

        <h3 className="text-xl font-bold text-card-foreground mb-1.5 pr-10">
          {displayEvent.title}
        </h3>

        <p className="text-[0.9375rem] text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {displayEvent.description}
        </p>

        <div className="space-y-2 mb-4 text-[0.9375rem] text-muted-foreground">
          <div className="flex items-start gap-2">
            <Calendar
              size={16}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span className="line-clamp-1">
              {displayEvent.date}
              {displayEvent.endDate ? ` – ${displayEvent.endDate}` : ""}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <Clock
              size={16}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span className="line-clamp-1">{displayEvent.time}</span>
          </div>

          <div className="flex items-start gap-2">
            <MapPin
              size={16}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span className="line-clamp-1">{displayEvent.location}</span>
          </div>

          {displayEvent.venueAddress && (
            <div className="flex items-start gap-2">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span className="line-clamp-1">
                {displayEvent.venueAddress}
              </span>
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
              Details &rarr;
            </a>
          </div>
        )}

        {displayEvent.type !== "Online" ? (
          <button
            type="button"
            onClick={handleNavigate}
            className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Navigation size={18} aria-hidden="true" />
            Navigate here
          </button>
        ) : displayEvent.url ? (
          <a
            href={displayEvent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Join Online &rarr;
          </a>
        ) : null}
      </div>
    </div>
  );
}
