"use client";

import { useState, useCallback } from "react";
import {
  MapPin,
  Clock,
  Star,
  Navigation,
  ExternalLink,
  Phone,
  DollarSign,
  UtensilsCrossed,
  Wine,
  Store,
  ShoppingBag,
  ShoppingCart,
  Footprints,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import type { POI, PriceLevel } from "@/types";

interface VenueCardProps {
  venue: POI;
}

const categoryIconMap: Record<string, LucideIcon> = {
  Restaurant: UtensilsCrossed,
  Bar: Wine,
  Hawker: Store,
  Mall: ShoppingBag,
  Supermarket: ShoppingCart,
};

const categoryColorMap: Record<string, string> = {
  Restaurant:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Bar: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Hawker:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Mall: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Supermarket:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

function renderPriceLevel(level: PriceLevel): string {
  return "$".repeat(level);
}

export default function VenueCard({ venue }: VenueCardProps) {
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const [isExpanded, setIsExpanded] = useState(false);

  const CategoryIcon = categoryIconMap[venue.category] ?? MapPin;
  const iconColors =
    categoryColorMap[venue.category] ?? "bg-muted text-muted-foreground";

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleShowOnMap = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setFlyToTarget({ lat: venue.lat, lng: venue.lng });
      setSelectedPOI(venue);
    },
    [venue, setFlyToTarget, setSelectedPOI],
  );

  function handleNavigate(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}&travelmode=walking`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleCall(e: React.MouseEvent) {
    e.stopPropagation();
    if (venue.contact) {
      window.open(`tel:${venue.contact}`, "_self");
    }
  }

  function handleWebsite(e: React.MouseEvent) {
    e.stopPropagation();
    if (venue.website) {
      window.open(venue.website, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="w-full rounded-xl border border-border bg-card transition-all duration-150 hover:shadow-md hover:border-primary/30 overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={toggleExpand}
        className="group w-full text-left flex items-center gap-3 p-3.5 min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-expanded={isExpanded}
        aria-label={`${venue.name} — tap to ${isExpanded ? "collapse" : "expand"}`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconColors}`}
        >
          <CategoryIcon size={20} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {venue.name}
            </h3>
            <div className="flex shrink-0 items-center gap-2">
              {venue.rating != null && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star
                    size={12}
                    className="fill-yellow-500 text-yellow-500"
                    aria-hidden="true"
                  />
                  {venue.rating.toFixed(1)}
                </span>
              )}
              {venue.priceLevel != null && (
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  <DollarSign
                    size={10}
                    className="inline -mt-px"
                    aria-hidden="true"
                  />
                  {renderPriceLevel(venue.priceLevel).slice(1)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {venue.cuisine && (
              <span className="truncate">{venue.cuisine}</span>
            )}
            {venue.cuisine && venue.distanceFromCampus && (
              <span aria-hidden="true">&middot;</span>
            )}
            {venue.distanceFromCampus && (
              <span className="flex shrink-0 items-center gap-0.5">
                <Footprints size={11} aria-hidden="true" />
                {venue.distanceFromCampus}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground shrink-0">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expandable details */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3.5 pb-3.5 pt-0">
            {venue.description && (
              <p className="text-[0.8125rem] text-muted-foreground mb-2.5 line-clamp-3 leading-relaxed">
                {venue.description}
              </p>
            )}

            {venue.hours && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <Clock size={12} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{venue.hours}</span>
              </div>
            )}

            {venue.address && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <MapPin size={12} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{venue.address}</span>
              </div>
            )}

            {venue.tags && venue.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {venue.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-1.5 py-0 text-[0.625rem] leading-4"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 pt-2.5 border-t border-border">
              <button
                type="button"
                onClick={handleShowOnMap}
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface-brand px-3.5 py-2 min-h-[44px] text-xs font-semibold text-surface-brand-foreground transition-colors hover:bg-surface-brand-hover active:scale-[0.97] flex-1 justify-center"
              >
                <MapPin size={14} aria-hidden="true" />
                Show on map
              </button>

              <button
                type="button"
                onClick={handleNavigate}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 min-h-[44px] text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.97]"
              >
                <Navigation size={12} aria-hidden="true" />
                Navigate
              </button>

              {venue.contact && (
                <button
                  type="button"
                  onClick={handleCall}
                  className="inline-flex items-center justify-center rounded-lg border border-border w-[44px] h-[44px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.97]"
                  aria-label="Call"
                >
                  <Phone size={14} aria-hidden="true" />
                </button>
              )}

              {venue.website && (
                <button
                  type="button"
                  onClick={handleWebsite}
                  className="inline-flex items-center justify-center rounded-lg border border-border w-[44px] h-[44px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.97]"
                  aria-label="Website"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
