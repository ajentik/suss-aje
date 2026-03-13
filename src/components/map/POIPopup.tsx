"use client";

import { useCallback, useState } from "react";
import { X, MapPin, Clock, Star, Navigation } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { POI } from "@/types";

export default function POIPopup() {
  const selectedPOI = useAppStore((s) => s.selectedPOI);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const setSelectedDestination = useAppStore((s) => s.setSelectedDestination);
  const [fadingOutPOI, setFadingOutPOI] = useState<POI | null>(null);

  const displayPOI = selectedPOI ?? fadingOutPOI;
  const isVisible = !!selectedPOI;

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
    }
    setSelectedPOI(null);
    setFadingOutPOI(null);
  }, [displayPOI, setSelectedDestination, setSelectedPOI]);

  if (!displayPOI) return null;

  return (
    <div 
      className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-20 transition-all duration-200 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-[350px] p-4 relative border border-gray-100">
        <button type="button"
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

        <button type="button"
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
