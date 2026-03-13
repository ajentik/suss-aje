"use client";

import { useCallback, useState, useRef } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { CampusEvent } from "@/types";

const EVENT_TYPE_DOT_COLOR: Record<string, string> = {
  "On-Campus": "bg-event-oncampus-fg",
  Online: "bg-event-online-fg",
  External: "bg-event-external-fg",
};

/** Standalone detail card — rendered inside the bottom sheet on mobile */
export function EventDetailCard({
  event,
  onClose,
  onNavigate,
  compact = false,
}: {
  event: CampusEvent;
  onClose: () => void;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const typeDotClass =
    EVENT_TYPE_DOT_COLOR[event.type] ?? "bg-muted-foreground";

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 active:scale-[0.97] transition-all min-h-[44px] px-2"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to chat
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-sm font-semibold px-3 py-1 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${typeDotClass}`}
              aria-hidden="true"
            />
            {event.category}
          </span>
        </div>

        <h3 className="text-lg font-bold text-card-foreground mb-1.5 leading-snug">
          {event.title}
        </h3>

        {/* Peek: key metadata inline */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1">
            <Calendar size={14} aria-hidden="true" />
            {event.date}
            {event.endDate ? ` – ${event.endDate}` : ""}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} aria-hidden="true" />
            {event.time}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} aria-hidden="true" />
            <span className="truncate max-w-[160px]">{event.location}</span>
          </span>
        </div>

        {/* Action buttons — always visible in peek */}
        <div className="flex gap-2 mb-4">
          {event.type !== "Online" ? (
            <button
              type="button"
              onClick={onNavigate}
              className="flex-1 bg-primary text-primary-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Navigation size={16} aria-hidden="true" />
              Navigate
            </button>
          ) : event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-primary text-primary-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Join Online
            </a>
          ) : null}
          {event.url && event.type !== "Online" && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary text-secondary-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-secondary/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Details
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
        </div>

        {/* Expanded content — visible when sheet is swiped up */}
        {!compact && (
          <>
            <p className="text-[0.9375rem] text-muted-foreground mb-4 leading-relaxed">
              {event.longDescription || event.description}
            </p>

            {event.venueAddress && (
              <div className="flex items-start gap-2 mb-2 text-sm text-muted-foreground">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{event.venueAddress}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full font-medium">
                {event.type}
              </span>
              <span className="bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full font-medium">
                {event.school}
              </span>
            </div>

            {event.registrationUrl && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-secondary text-secondary-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-secondary/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} aria-hidden="true" />
                Register
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Desktop floating popup — hidden on mobile */
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
  const popupRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 0 && popupRef.current) {
      popupRef.current.style.transform = `translateX(-50%) translateY(${deltaY}px)`;
      popupRef.current.style.opacity = `${Math.max(0.4, 1 - deltaY / 200)}`;
    }
  }, []);

  const handleClose = useCallback(() => {
    setFadingOutEvent(useAppStore.getState().selectedEvent);
    setSelectedEvent(null);
  }, [setSelectedEvent]);

  const handleTouchEnd = useCallback(() => {
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (popupRef.current) {
      popupRef.current.style.transform = "";
      popupRef.current.style.opacity = "";
    }
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

  const typeDotClass = EVENT_TYPE_DOT_COLOR[displayEvent.type] ?? "bg-muted-foreground";

  return (
    <div
      ref={popupRef}
      className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] max-w-md w-[380px] hidden md:block ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-95 pointer-events-none"
      }`}
      onTransitionEnd={handleTransitionEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-card rounded-2xl shadow-lg shadow-black/10 max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain p-5 relative border border-border">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 flex items-center justify-center w-11 h-11 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close popup"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-sm font-semibold px-3 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${typeDotClass}`} aria-hidden="true" />
            {displayEvent.category}
          </span>
        </div>

        <h3 className="text-xl font-bold text-card-foreground mb-1.5 pr-12">
          {displayEvent.title}
        </h3>

        <p className="text-[0.9375rem] text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {displayEvent.description}
        </p>

        <div className="space-y-2 mb-4 text-[0.9375rem] text-muted-foreground">
          <div className="flex items-start gap-2">
            <Calendar size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">
              {displayEvent.date}
              {displayEvent.endDate ? ` – ${displayEvent.endDate}` : ""}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{displayEvent.time}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{displayEvent.location}</span>
          </div>
          {displayEvent.venueAddress && (
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
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
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
            >
              Details
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        )}

        {displayEvent.type !== "Online" ? (
          <button
            type="button"
            onClick={handleNavigate}
            className="w-full bg-primary text-primary-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Navigation size={18} aria-hidden="true" />
            Navigate here
          </button>
        ) : displayEvent.url ? (
          <a
            href={displayEvent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-primary text-primary-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} aria-hidden="true" />
            Join Online
          </a>
        ) : null}
      </div>
    </div>
  );
}
