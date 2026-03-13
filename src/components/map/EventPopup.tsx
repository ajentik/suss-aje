"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { X, Calendar, Clock, MapPin, Navigation, ChevronDown, ChevronUp } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { CampusEvent } from "@/types";

export default function EventPopup() {
  const selectedEvent = useAppStore((s) => s.selectedEvent);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const mobileSheetState = useAppStore((s) => s.mobileSheetState);
  const [fadingOutEvent, setFadingOutEvent] = useState<CampusEvent | null>(null);
  const [cardState, setCardState] = useState<"minimized" | "expanded">("minimized");
  const [isMobile, setIsMobile] = useState(false);

  const displayEvent = selectedEvent ?? fadingOutEvent;
  const isVisible = !!selectedEvent;

  // Detect mobile — use callback ref to avoid setState-in-effect lint
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    // Defer initial read to avoid synchronous setState in effect
    const id = requestAnimationFrame(() => setIsMobile(mql.matches));
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => {
      cancelAnimationFrame(id);
      mql.removeEventListener("change", handler);
    };
  }, []);

  // Reset to minimized when a new event is selected (mobile only)
  useEffect(() => {
    if (selectedEvent) {
      requestAnimationFrame(() => setCardState(isMobile ? "minimized" : "expanded"));
    }
  }, [selectedEvent, isMobile]);

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
          // Allow drag down only
          const offset = Math.max(0, delta);
          innerRef.current.style.transform = `translateY(${offset}px)`;
        } else {
          // Minimized: allow both directions with rubber-band effect
          const offset = delta > 0 ? delta : delta * 0.4;
          innerRef.current.style.transform = `translateY(${offset}px)`;
        }
      }
    },
    [cardState],
  );

  const handleClose = useCallback(() => {
    setFadingOutEvent(useAppStore.getState().selectedEvent);
    setSelectedEvent(null);
  }, [setSelectedEvent]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = touchCurrentY.current - touchStartY.current;

    if (innerRef.current) {
      innerRef.current.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)";
    }

    if (cardState === "expanded") {
      if (deltaY > 80) {
        // Swipe down on expanded → minimize
        if (innerRef.current) innerRef.current.style.transform = "translateY(0)";
        setCardState("minimized");
      } else {
        // Snap back
        if (innerRef.current) innerRef.current.style.transform = "translateY(0)";
      }
    } else {
      // Minimized
      if (deltaY > 60) {
        // Swipe down on minimized → dismiss with slide-out
        if (innerRef.current) innerRef.current.style.transform = "translateY(120px)";
        handleClose();
      } else if (deltaY < -60) {
        // Swipe up on minimized → expand
        if (innerRef.current) innerRef.current.style.transform = "translateY(0)";
        setCardState("expanded");
      } else {
        // Snap back
        if (innerRef.current) innerRef.current.style.transform = "translateY(0)";
      }
    }
  }, [cardState, handleClose]);

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

  const toggleExpand = useCallback(() => {
    setCardState((prev) => (prev === "minimized" ? "expanded" : "minimized"));
  }, []);

  if (!displayEvent) return null;

  // Smart bottom positioning based on sheet state (mobile only)
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
            {displayEvent.category}
          </span>
          <h3 className={`font-bold text-card-foreground truncate flex-1 ${isExpanded ? "text-base" : "text-sm"}`}>
            {displayEvent.title}
          </h3>

          {/* Expand/Collapse indicator — mobile only */}
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

        {/* Expandable content — smooth height animation */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-5 pb-5">
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
                  className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 min-h-[44px] text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Navigation size={18} aria-hidden="true" />
                  Navigate here
                </button>
              ) : displayEvent.url ? (
                <a
                  href={displayEvent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 min-h-[44px] text-[0.9375rem] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Join Online &rarr;
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
