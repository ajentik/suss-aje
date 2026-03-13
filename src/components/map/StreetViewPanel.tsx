"use client";

import { useEffect, useRef } from "react";

interface StreetViewPanelProps {
  location: { lat: number; lng: number };
  onClose: () => void;
}

export default function StreetViewPanel({
  location,
  onClose,
}: StreetViewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !window.google?.maps) return;

    new window.google.maps.StreetViewPanorama(containerRef.current, {
      position: location,
      pov: { heading: 0, pitch: 0 },
      zoom: 1,
      motionTracking: false,
      motionTrackingControl: false,
      addressControl: true,
      fullscreenControl: false,
    });
  }, [location]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur rounded-lg shadow-lg text-sm font-medium hover:bg-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to 3D Map
      </button>
    </div>
  );
}
