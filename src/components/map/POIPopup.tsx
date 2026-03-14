"use client";

import { useCallback, useState, useMemo, useRef } from "react";
import {
  X,
  MapPin,
  Clock,
  Star,
  Navigation,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Footprints,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useWalkingRoute } from "@/hooks/useWalkingRoute";
import type { POI, CampusEvent } from "@/types";
import campusEventsData from "@/../public/campus-events.json";
import AACEventsSection from "@/components/ui/AACEventsSection";
import EventRow from "@/components/ui/EventRow";

function validateCampusEvents(data: typeof campusEventsData): CampusEvent[] {
  return data.map((e) => ({
    ...e,
    type: e.type as CampusEvent["type"],
    school: e.school as CampusEvent["school"],
  }));
}

const campusEvents = validateCampusEvents(campusEventsData);

function createStreetViewEventFromPOI(poi: POI): CampusEvent {
  return {
    id: `poi-${poi.id}`,
    title: poi.name,
    date: "",
    time: "",
    location: poi.address || poi.name,
    category: poi.category,
    description: poi.description,
    type: "On-Campus",
    school: "SUSS",
    lat: poi.lat,
    lng: poi.lng,
  };
}

function findUpcomingEventsNear(poi: POI): CampusEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  const allEvents = campusEvents;
  return allEvents
    .filter((e) => {
      const endDate = e.endDate || e.date;
      if (endDate < today) return false;
      const dist = Math.abs(e.lat - poi.lat) + Math.abs(e.lng - poi.lng);
      return dist < 0.002;
    })
    .slice(0, 2);
}

const POI_CATEGORY_DOT: Record<string, string> = {
  Building: "bg-poi-building",
  Academic: "bg-poi-academic",
  Facility: "bg-poi-facility",
  Food: "bg-poi-food",
  Restaurant: "bg-poi-restaurant",
  Hawker: "bg-poi-hawker",
  Services: "bg-poi-services",
  Transport: "bg-poi-transport",
  Mall: "bg-poi-mall",
  Supermarket: "bg-poi-supermarket",
  Bar: "bg-poi-bar",
  "Active Ageing Centre": "bg-poi-aac",
};

/** Standalone detail card — rendered inside the bottom sheet on mobile */
export function POIDetailCard({
  poi,
  onClose,
  onNavigate,
  compact = false,
}: {
  poi: POI;
  onClose: () => void;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const { walkTo, isLoading: isWalking } = useWalkingRoute();
  const isAAC = poi.category === "Active Ageing Centre";
  const nearbyEvents = useMemo(
    () => (isAAC ? [] : findUpcomingEventsNear(poi)),
    [poi, isAAC],
  );
  const dotClass = POI_CATEGORY_DOT[poi.category] ?? "bg-muted-foreground";

  const handleEventClick = useCallback(
    (event: CampusEvent) => {
      setSelectedEvent(event);
    },
    [setSelectedEvent],
  );

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
              className={`w-2 h-2 rounded-full ${dotClass}`}
              aria-hidden="true"
            />
            {poi.category}
          </span>
        </div>

        <h3 className="text-lg font-bold text-card-foreground mb-1.5 leading-snug">
          {poi.name}
        </h3>

        {/* Peek: key metadata inline */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-3">
          {poi.hours && (
            <span className="inline-flex items-center gap-1">
              <Clock size={14} aria-hidden="true" />
              <span className="truncate max-w-[140px]">{poi.hours}</span>
            </span>
          )}
          {poi.rating && (
            <span className="inline-flex items-center gap-1">
              <Star
                size={14}
                className="text-yellow-500 fill-yellow-500"
                aria-hidden="true"
              />
              {poi.rating}
            </span>
          )}
          {poi.address && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} aria-hidden="true" />
              <span className="truncate max-w-[160px]">{poi.address}</span>
            </span>
          )}
        </div>

        {/* Action buttons — always visible in peek */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={onNavigate}
            className="flex-1 bg-surface-brand text-surface-brand-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-surface-brand/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Navigation size={16} aria-hidden="true" />
            Navigate
          </button>
          <button
            type="button"
            onClick={() => walkTo(poi)}
            disabled={isWalking}
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isWalking ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Footprints size={16} aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Walk here</span>
            <span className="sm:hidden">Walk</span>
          </button>
          {poi.website && (
            <a
              href={poi.website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary text-secondary-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-secondary/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Website
            </a>
          )}
        </div>

        {/* Expanded content — visible when sheet is swiped up */}
        {!compact && (
          <>
            <p className="text-[0.9375rem] text-muted-foreground mb-4 leading-relaxed">
              {poi.description}
            </p>

            {poi.address && (
              <div className="flex items-start gap-2 mb-2 text-sm text-muted-foreground">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{poi.address}</span>
              </div>
            )}

            {poi.hours && (
              <div className="flex items-start gap-2 mb-2 text-sm text-muted-foreground">
                <Clock
                  size={15}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{poi.hours}</span>
              </div>
            )}

            {poi.rating && (
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Star
                  size={15}
                  className="text-yellow-500 fill-yellow-500 shrink-0"
                  aria-hidden="true"
                />
                <span>{poi.rating} / 5.0</span>
              </div>
            )}

            {poi.cuisine && (
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <span className="font-medium">Cuisine:</span>
                <span>{poi.cuisine}</span>
              </div>
            )}

            {poi.priceLevel && (
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <span className="font-medium">Price:</span>
                <span>{"$".repeat(poi.priceLevel)}</span>
              </div>
            )}

            {isAAC && (
              <div className="mt-4">
                <AACEventsSection poi={poi} />
              </div>
            )}

            {!isAAC && nearbyEvents.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar size={14} aria-hidden="true" />
                  Upcoming Events Nearby
                </p>
                <div className="space-y-1.5">
                  {nearbyEvents.map((evt) => (
                    <EventRow
                      key={evt.id}
                      event={evt}
                      onEventClick={handleEventClick}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Desktop floating popup — hidden on mobile */
export default function POIPopup() {
  const selectedPOI = useAppStore((s) => s.selectedPOI);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const setSelectedDestination = useAppStore((s) => s.setSelectedDestination);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const { walkTo, isLoading: isWalking } = useWalkingRoute();
  const [fadingOutPOI, setFadingOutPOI] = useState<POI | null>(null);

  const displayPOI = selectedPOI ?? fadingOutPOI;
  const isVisible = !!selectedPOI;
  const isAAC = displayPOI?.category === "Active Ageing Centre";

  const nearbyEvents = useMemo(
    () => (displayPOI && !isAAC ? findUpcomingEventsNear(displayPOI) : []),
    [displayPOI, isAAC],
  );

  // Swipe-to-dismiss with interactive drag
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
    setFadingOutPOI(useAppStore.getState().selectedPOI);
    setSelectedPOI(null);
  }, [setSelectedPOI]);

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
    if (!useAppStore.getState().selectedPOI) {
      setFadingOutPOI(null);
    }
  }, []);

  const handleNavigate = useCallback(() => {
    if (displayPOI) {
      setSelectedDestination(displayPOI);
      setStreetViewEvent(createStreetViewEventFromPOI(displayPOI));
    }
    setSelectedPOI(null);
    setFadingOutPOI(null);
  }, [displayPOI, setSelectedDestination, setSelectedPOI, setStreetViewEvent]);

  const handleEventClick = useCallback(
    (event: CampusEvent) => {
      setSelectedPOI(null);
      setFadingOutPOI(null);
      setSelectedEvent(event);
      setActivePanel("events");
    },
    [setSelectedPOI, setSelectedEvent, setActivePanel],
  );

  if (!displayPOI) return null;

  const dotClass = POI_CATEGORY_DOT[displayPOI.category] ?? "bg-muted-foreground";

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
            <span className={`w-2 h-2 rounded-full ${dotClass}`} aria-hidden="true" />
            {displayPOI.category}
          </span>
        </div>

        <h3 className="text-xl font-bold text-card-foreground mb-1.5 pr-12">
          {displayPOI.name}
        </h3>

        <p className="text-[0.9375rem] text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {displayPOI.description}
        </p>

        <div className="space-y-2 mb-4 text-[0.9375rem] text-muted-foreground">
          {displayPOI.address && (
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">{displayPOI.address}</span>
            </div>
          )}
          {displayPOI.hours && (
            <div className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">{displayPOI.hours}</span>
            </div>
          )}
          {displayPOI.rating && (
            <div className="flex items-center gap-2">
              <Star size={16} className="text-yellow-500 fill-yellow-500 shrink-0" aria-hidden="true" />
              <span>{displayPOI.rating} / 5.0</span>
            </div>
          )}
        </div>

        {isAAC && displayPOI && (
          <div className="mb-3">
            <AACEventsSection poi={displayPOI} />
          </div>
        )}

        {!isAAC && nearbyEvents.length > 0 && (
          <div className="mb-3 border-t border-border pt-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={14} aria-hidden="true" />
              Upcoming Events Nearby
            </p>
            <div className="space-y-1.5">
              {nearbyEvents.map((evt) => (
                <EventRow
                  key={evt.id}
                  event={evt}
                  onEventClick={handleEventClick}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleNavigate}
            className="flex-1 bg-surface-brand text-surface-brand-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-surface-brand/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Navigation size={18} aria-hidden="true" />
            Navigate here
          </button>
          {displayPOI && (
            <button
              type="button"
              onClick={() => walkTo(displayPOI)}
              disabled={isWalking}
              className="flex-1 bg-primary text-primary-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isWalking ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <Footprints size={18} aria-hidden="true" />
              )}
              Walk here
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
