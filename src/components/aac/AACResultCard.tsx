"use client";

import type { POI } from "@/types";
import { MapPin, Footprints, Loader2, Star } from "lucide-react";
import { useWalkingRoute } from "@/hooks/useWalkingRoute";
import { useMyAAC } from "@/hooks/useMyAAC";
import { toast } from "sonner";

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
  const { myAAC, setMyAAC } = useMyAAC();
  const isSaved = myAAC?.name === poi.name && myAAC?.lat === poi.lat && myAAC?.lng === poi.lng;

  return (
    <button
      type="button"
      aria-label={`Select ${poi.name}`}
      onClick={() => onSelect(poi)}
      className="w-full text-left px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 active:bg-accent transition-colors cursor-pointer group relative"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-poi-aac/15 flex items-center justify-center">
          <MapPin size={14} className="text-poi-aac" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors truncate pr-16">
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
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <button
          type="button"
          aria-label={isSaved ? `${poi.name} is your saved AAC` : `Set ${poi.name} as My AAC`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isSaved) {
              setMyAAC(poi);
              toast.success(`${poi.name} set as My AAC`);
            }
          }}
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
            isSaved
              ? "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400"
              : "bg-muted/60 hover:bg-yellow-400/15 text-muted-foreground hover:text-yellow-600 dark:hover:text-yellow-400 active:scale-90"
          }`}
        >
          <Star size={14} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Walk to ${poi.name}`}
          disabled={isWalking}
          onClick={(e) => {
            e.stopPropagation();
            walkTo(poi);
          }}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 active:scale-90 transition-all disabled:opacity-60"
        >
          {isWalking ? (
            <Loader2 size={14} className="animate-spin text-primary" aria-hidden="true" />
          ) : (
            <Footprints size={14} className="text-primary" aria-hidden="true" />
          )}
        </button>
      </div>
    </button>
  );
}

export { formatDistance };
