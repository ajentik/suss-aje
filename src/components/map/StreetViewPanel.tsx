"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";

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
        <ArrowLeft size={16} aria-hidden="true" />
        Back to 3D Map
      </button>
    </div>
  );
}
