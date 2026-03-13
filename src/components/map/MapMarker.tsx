"use client";

import type { POI } from "@/types";
import { useAppStore } from "@/store/app-store";

interface MapMarkerProps {
  poi: POI;
}

export default function MapMarker({ poi }: MapMarkerProps) {
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setSelectedDestination = useAppStore((s) => s.setSelectedDestination);

  const handleClick = () => {
    setSelectedDestination(poi);
    setFlyToTarget({ lat: poi.lat, lng: poi.lng });
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 px-2 py-1 bg-white rounded-full shadow-md text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
    >
      <span>{poi.name}</span>
    </button>
  );
}
