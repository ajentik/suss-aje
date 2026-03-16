"use client";

import type { POI } from "@/types";
import { DooIcon } from "@/lib/icons";
import { useWalkingRoute } from "@/hooks/useWalkingRoute";

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
  const { walkTo, isLoading: isWalking } = useWalkingRoute();

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        aria-label={`Select ${poi.name}`}
        onClick={() => onSelect(poi)}
        className="w-full text-left px-3 py-2.5 hover:bg-accent/50 active:bg-accent transition-colors cursor-pointer group relative"
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-poi-aac/15 flex items-center justify-center">
            <DooIcon name="location-pin" size={14} className="text-poi-aac" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors truncate pr-8">
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
        <button
          type="button"
          aria-label={`Walk to ${poi.name}`}
          disabled={isWalking}
          onClick={(e) => {
            e.stopPropagation();
            walkTo(poi);
          }}
          className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 active:scale-90 transition-all disabled:opacity-60"
        >
          {isWalking ? (
            <DooIcon name="loader" size={14} className="animate-spin text-primary" />
          ) : (
            <DooIcon name="navigation2" size={14} className="text-primary" />
          )}
        </button>
      </button>
      {poi.contact && (
        <a
          href={`tel:${poi.contact.replace(/\s/g, "")}`}
          aria-label={`Call ${poi.name}`}
          className="flex items-center justify-center gap-2.5 w-full h-14 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-base transition-colors"
        >
          <DooIcon name="phone" size={22} />
          📞 Call This Centre
        </a>
      )}
    </div>
  );
}

export { formatDistance };
