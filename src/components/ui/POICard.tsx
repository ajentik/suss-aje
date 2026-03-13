"use client";

import { useCallback } from "react";
import {
  MapPin,
  Clock,
  Star,
  Navigation,
  ExternalLink,
  Phone,
  Tag,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { POI } from "@/types";
import { Badge } from "@/components/ui/badge";

interface POICardProps {
  poi: POI;
}

function priceLevelToLabel(level: number): string {
  return "$".repeat(level);
}

export default function POICard({ poi }: POICardProps) {
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);

  const handleCardClick = useCallback(() => {
    setFlyToTarget({ lat: poi.lat, lng: poi.lng });
    setSelectedPOI(poi);
  }, [poi, setFlyToTarget, setSelectedPOI]);

  const handleNavigate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setFlyToTarget({ lat: poi.lat, lng: poi.lng });
      setSelectedPOI(poi);
    },
    [poi, setFlyToTarget, setSelectedPOI],
  );

  return (
    <div className="relative bg-card rounded-2xl shadow-lg border border-border/60 ring-1 ring-border/40 w-full text-left p-5 transition-all hover:shadow-xl hover:border-border">
      <button
        type="button"
        onClick={handleCardClick}
        className="absolute inset-0 z-10 rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Select ${poi.name} and fly to location`}
      />

      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span className="inline-block bg-secondary text-secondary-foreground text-sm font-semibold px-3 py-1 rounded-full">
          {poi.category}
        </span>
        {poi.distanceFromCampus && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {poi.distanceFromCampus}
          </Badge>
        )}
        {poi.priceLevel && (
          <span className="text-sm font-medium text-muted-foreground">
            {priceLevelToLabel(poi.priceLevel)}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-card-foreground mb-1.5">
        {poi.name}
      </h3>

      <p className="text-[0.9375rem] text-muted-foreground mb-3.5 line-clamp-2 leading-relaxed">
        {poi.description}
      </p>

      <div className="space-y-2.5 mb-4 text-[0.9375rem] text-muted-foreground">
        {poi.address && (
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <span className="line-clamp-1">{poi.address}</span>
          </div>
        )}

        {poi.hours && (
          <div className="flex items-start gap-2.5">
            <Clock size={16} className="mt-0.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <span className="line-clamp-1">{poi.hours}</span>
          </div>
        )}

        {poi.rating && (
          <div className="flex items-center gap-2.5">
            <Star
              size={16}
              className="text-yellow-500 fill-yellow-500 shrink-0"
              aria-hidden="true"
            />
            <span>{poi.rating} / 5.0</span>
          </div>
        )}

        {poi.contact && (
          <div className="flex items-center gap-2.5">
            <Phone size={16} className="shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <span>{poi.contact}</span>
          </div>
        )}
      </div>

      {poi.tags && poi.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <Tag
            size={14}
            className="text-muted-foreground/60 shrink-0"
            aria-hidden="true"
          />
          {poi.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block bg-muted text-muted-foreground text-xs px-2.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-20 flex items-center gap-2 pt-3.5 border-t border-border/60">
        <button
          type="button"
          onClick={handleNavigate}
          className="flex-1 bg-primary text-primary-foreground rounded-xl px-4 min-h-[48px] py-3 text-[0.9375rem] font-semibold hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Navigation size={16} aria-hidden="true" />
          Navigate here
        </button>
        {poi.website && (
          <a
            href={poi.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="relative z-20 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 min-h-[48px] py-3 text-[0.9375rem] font-semibold text-card-foreground hover:bg-muted active:bg-muted/80 transition-all"
          >
            <ExternalLink size={16} aria-hidden="true" />
            Website
          </a>
        )}
      </div>
    </div>
  );
}
