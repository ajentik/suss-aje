"use client";

import type { POI } from "@/types";
import { MapPin } from "lucide-react";

interface AACResultCardProps {
  poi: POI;
  distanceKm: number | null;
  onSelect: (poi: POI) => void;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function AACResultCard({ poi, distanceKm, onSelect }: AACResultCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(poi)}
      className="w-full text-left px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 active:bg-accent transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-poi-aac/15 flex items-center justify-center">
          <MapPin size={14} className="text-poi-aac" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors truncate">
            {poi.name}
          </p>
          {poi.address && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {poi.address}
            </p>
          )}
          {poi.hours && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {poi.hours}
            </p>
          )}
        </div>
        {distanceKm !== null && (
          <span className="flex-shrink-0 text-xs font-medium text-muted-foreground tabular-nums mt-0.5">
            {formatDistance(distanceKm)}
          </span>
        )}
      </div>
    </button>
  );
}

export { formatDistance };
