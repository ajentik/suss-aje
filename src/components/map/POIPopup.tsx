"use client";

import { useCallback, useState, useMemo, useRef } from "react";
import { X, MapPin, Clock, Star, Navigation, Calendar } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { POI } from "@/types";
import campusEvents from "@/../public/campus-events.json";
import type { CampusEvent } from "@/types";

function findUpcomingEventsNear(poi: POI): CampusEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  const allEvents = campusEvents as unknown as CampusEvent[];
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
};

export default function POIPopup() {
  const selectedPOI = useAppStore((s) => s.selectedPOI);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const setSelectedDestination = useAppStore((s) => s.setSelectedDestination);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const [fadingOutPOI, setFadingOutPOI] = useState<POI | null>(null);

  const displayPOI = selectedPOI ?? fadingOutPOI;
  const isVisible = !!selectedPOI;

  const nearbyEvents = useMemo(
    () => (displayPOI ? findUpcomingEventsNear(displayPOI) : []),
    [displayPOI],
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
      setStreetViewEvent({
        id: `poi-${displayPOI.id}`,
        title: displayPOI.name,
        date: "",
        time: "",
        location: displayPOI.address || displayPOI.name,
        category: displayPOI.category,
        description: displayPOI.description,
        type: "On-Campus",
        school: "SUSS",
        lat: displayPOI.lat,
        lng: displayPOI.lng,
      } as CampusEvent);
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
      className={`absolute bottom-28 md:bottom-20 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] w-[calc(100vw-1.5rem)] max-w-md sm:w-[380px] ${
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
        {/* Drag handle */}
        <div className="flex justify-center mb-3 md:hidden" aria-hidden="true">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
        </div>

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
              <MapPin
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span className="line-clamp-1">{displayPOI.address}</span>
            </div>
          )}

          {displayPOI.hours && (
            <div className="flex items-start gap-2">
              <Clock
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span className="line-clamp-1">{displayPOI.hours}</span>
            </div>
          )}

          {displayPOI.rating && (
            <div className="flex items-center gap-2">
              <Star
                size={16}
                className="text-yellow-500 fill-yellow-500 shrink-0"
                aria-hidden="true"
              />
              <span>{displayPOI.rating} / 5.0</span>
            </div>
          )}
        </div>

        {nearbyEvents.length > 0 && (
          <div className="mb-3 border-t border-border pt-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={14} aria-hidden="true" />
              Upcoming Events Nearby
            </p>
            <div className="space-y-1.5">
              {nearbyEvents.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => handleEventClick(evt)}
                  className="w-full text-left flex items-center gap-2.5 bg-secondary/50 border border-secondary rounded-lg px-3.5 py-2.5 min-h-[44px] hover:bg-secondary/80 active:bg-secondary transition-colors"
                >
                  <span className="text-primary text-sm font-medium shrink-0">
                    {evt.date}
                  </span>
                  <span className="text-sm text-card-foreground truncate">
                    {evt.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleNavigate}
          className="w-full bg-surface-brand text-surface-brand-foreground rounded-xl px-4 min-h-[48px] text-[0.9375rem] font-semibold hover:bg-surface-brand/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Navigation size={18} aria-hidden="true" />
          Navigate here
        </button>
      </div>
    </div>
  );
}
