"use client";

import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { X, MapPin, Clock, Star, Navigation, Calendar, ChevronDown, ChevronUp } from "lucide-react";
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

export default function POIPopup() {
  const selectedPOI = useAppStore((s) => s.selectedPOI);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const setSelectedDestination = useAppStore((s) => s.setSelectedDestination);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const mobileSheetState = useAppStore((s) => s.mobileSheetState);
  const [fadingOutPOI, setFadingOutPOI] = useState<POI | null>(null);
  const [cardState, setCardState] = useState<"minimized" | "expanded">("minimized");
  const [isMobile, setIsMobile] = useState(false);

  const displayPOI = selectedPOI ?? fadingOutPOI;
  const isVisible = !!selectedPOI;

  const nearbyEvents = useMemo(
    () => (displayPOI ? findUpcomingEventsNear(displayPOI) : []),
    [displayPOI],
  );

  // Detect mobile
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Reset to minimized when a new POI is selected (mobile only)
  useEffect(() => {
    if (selectedPOI) {
      setCardState(isMobile ? "minimized" : "expanded");
    }
  }, [selectedPOI, isMobile]);

  // Swipe gesture refs
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const innerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isDragging.current = true;
    if (innerRef.current) {
      innerRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;
      touchCurrentY.current = e.touches[0].clientY;
      const delta = touchCurrentY.current - touchStartY.current;
      if (innerRef.current) {
        if (cardState === "expanded") {
          const offset = Math.max(0, delta);
          innerRef.current.style.transform = `translateY(${offset}px)`;
        } else {
          const offset = delta > 0 ? delta : delta * 0.4;
          innerRef.current.style.transform = `translateY(${offset}px)`;
        }
      }
    },
    [cardState],
  );

  const handleClose = useCallback(() => {
    setFadingOutPOI(useAppStore.getState().selectedPOI);
    setSelectedPOI(null);
  }, [setSelectedPOI]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = touchCurrentY.current - touchStartY.current;

    if (innerRef.current) {
      innerRef.current.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)";
    }

    if (cardState === "expanded") {
      if (deltaY > 80) {
        if (innerRef.current) innerRef.current.style.transform = "translateY(0)";
        setCardState("minimized");
      } else {
        if (innerRef.current) innerRef.current.style.transform = "translateY(0)";
      }
    } else {
      if (deltaY > 60) {
        // Dismiss with slide-out animation
        if (innerRef.current) innerRef.current.style.transform = "translateY(120px)";
        handleClose();
      } else if (deltaY < -60) {
        if (innerRef.current) innerRef.current.style.transform = "translateY(0)";
        setCardState("expanded");
      } else {
        if (innerRef.current) innerRef.current.style.transform = "translateY(0)";
      }
    }
  }, [cardState, handleClose]);

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

  const toggleExpand = useCallback(() => {
    setCardState((prev) => (prev === "minimized" ? "expanded" : "minimized"));
  }, []);

  if (!displayPOI) return null;

  const mobileBottomMap = { collapsed: 72, peek: 148, expanded: 148 };
  const bottomPx = isMobile ? mobileBottomMap[mobileSheetState] : 80;
  const isExpanded = cardState === "expanded" || !isMobile;

  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-95 pointer-events-none"
      }`}
      style={{ bottom: `${bottomPx}px` }}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        ref={innerRef}
        className="bg-card rounded-2xl shadow-xl max-w-md w-[calc(100vw-1.5rem)] sm:w-[380px] relative border border-border overflow-hidden"
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle — mobile only */}
        <div
          className="md:hidden flex flex-col items-center justify-center min-h-[28px] pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
          role="button"
          tabIndex={0}
          aria-label={isExpanded ? "Swipe down to minimize" : "Swipe up to expand"}
          onClick={toggleExpand}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleExpand();
          }}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Minimized pill header — always visible */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 min-h-[48px]">
          <span className="inline-block bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
            {displayPOI.category}
          </span>
          <h3 className={`font-bold text-card-foreground truncate flex-1 ${isExpanded ? "text-base" : "text-sm"}`}>
            {displayPOI.name}
          </h3>

          {isMobile && (
            <button
              type="button"
              onClick={toggleExpand}
              className="md:hidden flex items-center justify-center w-11 h-11 -mr-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="flex items-center justify-center w-11 h-11 -mr-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Close popup"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Expandable content */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-5 pb-5">
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
                className="w-full bg-surface-brand text-surface-brand-foreground rounded-xl px-4 py-3 min-h-[44px] text-[0.9375rem] font-semibold hover:bg-surface-brand/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Navigation size={18} aria-hidden="true" />
                Navigate here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
