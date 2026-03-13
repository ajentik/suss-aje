"use client";

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

  const CategoryIcon = categoryIconMap[venue.category] ?? MapPin;
  const iconColors =
    categoryColorMap[venue.category] ?? "bg-muted text-muted-foreground";

  function handleCardClick() {
    setFlyToTarget({ lat: venue.lat, lng: venue.lng });
    setSelectedPOI(venue);
  }

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
    <button
      type="button"
      onClick={handleCardClick}
      className="group w-full text-left rounded-xl border border-border bg-card p-3.5 transition-all duration-200 hover:shadow-md hover:border-primary/30 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconColors}`}
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
                <span className="text-xs font-medium text-muted-foreground">
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

          {venue.hours && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={11} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{venue.hours}</span>
            </div>
          )}

          {venue.tags && venue.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
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

          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleNavigate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 min-h-[44px] py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:bg-primary/80 active:scale-[0.97]"
            >
              <Navigation size={13} aria-hidden="true" />
              Navigate
            </button>

            {venue.contact && (
              <button
                type="button"
                onClick={handleCall}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 min-h-[44px] py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:bg-muted/80 active:scale-[0.97]"
              >
                <Phone size={13} aria-hidden="true" />
                Call
              </button>
            )}

            {venue.website && (
              <button
                type="button"
                onClick={handleWebsite}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 min-h-[44px] py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:bg-muted/80 active:scale-[0.97]"
              >
                <ExternalLink size={13} aria-hidden="true" />
                Web
              </button>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
