"use client";

import { useCallback, useState, useMemo } from "react";
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
    [displayPOI]
  );

  const handleClose = useCallback(() => {
    setFadingOutPOI(useAppStore.getState().selectedPOI);
    setSelectedPOI(null);
  }, [setSelectedPOI]);

  const handleTransitionEnd = useCallback(() => {
    if (!useAppStore.getState().selectedPOI) {
      setFadingOutPOI(null);
    }
  }, []);

  const handleNavigate = useCallback(() => {
    if (displayPOI) {
      setSelectedDestination(displayPOI);
      // Open street view at the POI location
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
    [setSelectedPOI, setSelectedEvent, setActivePanel]
  );

  if (!displayPOI) return null;

  return (
    <div
      className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-20 transition-all duration-200 ease-in-out ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-[350px] p-4 relative border border-gray-100">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close popup"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="mb-2">
          <span className="inline-block bg-blue-50 text-surface-brand text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
            {displayPOI.category}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1 pr-6">
          {displayPOI.name}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {displayPOI.description}
        </p>

        <div className="space-y-1.5 mb-4 text-sm text-gray-500">
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
          <div className="mb-3 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={12} aria-hidden="true" />
              Upcoming Events Nearby
            </p>
            <div className="space-y-1.5">
              {nearbyEvents.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => handleEventClick(evt)}
                  className="w-full text-left flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors"
                >
                  <span className="text-amber-600 text-xs font-medium shrink-0">
                    {evt.date}
                  </span>
                  <span className="text-xs text-gray-700 truncate">
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
          className="w-full bg-surface-brand text-surface-brand-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-brand/90 transition-colors flex items-center justify-center gap-2"
        >
          <Navigation size={16} aria-hidden="true" />
          Navigate here
        </button>
      </div>
    </div>
  );
}
