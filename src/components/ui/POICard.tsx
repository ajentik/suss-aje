"use client";

import { useCallback, useState, useMemo } from "react";
import {
  MapPin,
  Clock,
  Star,
  Navigation,
  ExternalLink,
  Phone,
  Tag,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { POI } from "@/types";
import { Badge } from "@/components/ui/badge";
import AACEventsSection from "@/components/ui/AACEventsSection";
import { getAACEventsForPOI } from "@/lib/maps/aac-events";

interface POICardProps {
  poi: POI;
}

function priceLevelToLabel(level: number): string {
  return "$".repeat(level);
}

export default function POICard({ poi }: POICardProps) {
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const [isExpanded, setIsExpanded] = useState(false);
  const isAAC = poi.category === "Active Ageing Centre";

  const eventsByKind = useMemo(() => {
    if (!isAAC) return null;
    return getAACEventsForPOI(poi.name);
  }, [isAAC, poi.name]);

  const eventCount = eventsByKind
    ? eventsByKind.regular.length + eventsByKind.special.length
    : 0;

  const handleShowOnMap = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setFlyToTarget({ lat: poi.lat, lng: poi.lng });
      setSelectedPOI(poi);
    },
    [poi, setFlyToTarget, setSelectedPOI],
  );

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className="relative bg-card rounded-2xl shadow-lg border border-border w-full text-left transition-all hover:shadow-xl hover:border-border/80 overflow-hidden">
      {/* Collapsed header — always visible, tappable to expand */}
      <button
        type="button"
        onClick={toggleExpand}
        className="w-full text-left flex items-center gap-3 p-4 min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-expanded={isExpanded}
        aria-label={`${poi.name} — tap to ${isExpanded ? "collapse" : "expand"}`}
      >
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span className="inline-block bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
            {poi.category}
          </span>
          <h3 className="text-sm font-bold text-card-foreground truncate">
            {poi.name}
          </h3>
          {eventCount > 0 && (
            <Badge variant="outline" className="text-[0.6875rem] text-primary shrink-0 gap-0.5">
              <Calendar size={10} aria-hidden="true" />
              {eventCount}
            </Badge>
          )}
          {poi.distanceFromCampus && (
            <Badge variant="outline" className="text-[0.6875rem] text-muted-foreground shrink-0">
              {poi.distanceFromCampus}
            </Badge>
          )}
          {poi.priceLevel && (
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              {priceLevelToLabel(poi.priceLevel)}
            </span>
          )}
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
          <div className="px-5 pb-5">
            <p className="text-[0.9375rem] text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
              {poi.description}
            </p>

            <div className="space-y-2 mb-4 text-[0.9375rem] text-muted-foreground">
              {poi.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{poi.address}</span>
                </div>
              )}

              {poi.hours && (
                <div className="flex items-start gap-2">
                  <Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{poi.hours}</span>
                </div>
              )}

              {poi.rating && (
                <div className="flex items-center gap-2">
                  <Star
                    size={16}
                    className="text-yellow-500 fill-yellow-500 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{poi.rating} / 5.0</span>
                </div>
              )}

              {poi.contact && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0" aria-hidden="true" />
                  <span>{poi.contact}</span>
                </div>
              )}
            </div>

            {poi.tags && poi.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                <Tag
                  size={14}
                  className="text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                {poi.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {isAAC && eventsByKind && (
              <div className="mb-4">
                <AACEventsSection poi={poi} precomputedEvents={eventsByKind} />
              </div>
            )}

            <div className="flex flex-col gap-2 pt-3 border-t border-border">
              {isAAC && poi.contact && (
                <a
                  href={`tel:${poi.contact.replace(/\s/g, "")}`}
                  aria-label={`Call ${poi.name}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2.5 w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-base transition-colors active:scale-[0.98]"
                >
                  <Phone size={22} aria-hidden="true" />
                  📞 Call This Centre
                </a>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShowOnMap}
                  className="flex-1 bg-surface-brand text-surface-brand-foreground rounded-xl px-4 py-3 min-h-[44px] text-[0.9375rem] font-semibold hover:bg-surface-brand/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Navigation size={16} aria-hidden="true" />
                  Show on map
                </button>
                {poi.website && (
                  <a
                    href={poi.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 min-h-[44px] text-[0.9375rem] font-semibold text-card-foreground hover:bg-muted active:scale-[0.98] transition-all"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
