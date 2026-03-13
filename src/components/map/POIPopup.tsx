"use client";

import { useCallback, useState } from "react";
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
          <span className="inline-block bg-blue-50 text-[#003B5C] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                <title>Address</title>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="line-clamp-1">{displayPOI.address}</span>
            </div>
          )}
          
          {displayPOI.hours && (
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                <title>Hours</title>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="line-clamp-1">{displayPOI.hours}</span>
            </div>
          )}

          {displayPOI.rating && (
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 fill-yellow-500 shrink-0" aria-hidden="true">
                <title>Rating</title>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>{displayPOI.rating} / 5.0</span>
            </div>
          )}
        </div>

        <button type="button"
          onClick={handleNavigate}
          className="w-full bg-[#003B5C] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#002a42] transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <title>Navigate</title>
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Navigate here
        </button>
      </div>
    </div>
  );
}
