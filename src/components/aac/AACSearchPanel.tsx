"use client";

import { useState, useMemo, useEffect } from "react";
import { DooIcon } from "@/lib/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppStore } from "@/store/app-store";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineDistance } from "@/lib/maps/geo-utils";
import { ACTIVE_AGEING_CENTRES } from "@/lib/maps/active-ageing-centres";
import AACResultCard from "./AACResultCard";
import type { POI } from "@/types";

const INITIAL_DISPLAY_COUNT = 10;
const SHOW_MORE_INCREMENT = 20;

interface AACWithDistance {
  poi: POI;
  distanceKm: number | null;
}

export default function AACSearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const { lat, lng, status, error, requestLocation } = useGeolocation();

  const hasLocation = status === "success" && lat !== null && lng !== null;

  useEffect(() => {
    if (status === "success" && lat !== null && lng !== null) {
      setFlyToTarget({ lat, lng, altitude: 3000 });
    }
  }, [status, lat, lng, setFlyToTarget]);

  const results: AACWithDistance[] = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const mapped = ACTIVE_AGEING_CENTRES.map((poi) => ({
      poi,
      distanceKm: hasLocation ? haversineDistance(lat, lng, poi.lat, poi.lng) : null,
    }));

    const filtered = query
      ? mapped.filter(
          (r) =>
            r.poi.name.toLowerCase().includes(query) ||
            (r.poi.address?.toLowerCase().includes(query) ?? false),
        )
      : mapped;

    if (hasLocation) {
      return filtered.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }
    return filtered.sort((a, b) => a.poi.name.localeCompare(b.poi.name));
  }, [searchQuery, lat, lng, hasLocation]);

  const displayedResults = results.slice(0, displayCount);
  const hasMore = displayCount < results.length;

  const handleSelect = (poi: POI) => {
    setSelectedPOI(poi);
    setFlyToTarget({ lat: poi.lat, lng: poi.lng });
  };

  const handleShowMore = () => {
    setDisplayCount((prev) => prev + SHOW_MORE_INCREMENT);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 space-y-2 shrink-0">
        <div className="relative">
          <DooIcon
            name="search"
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayCount(INITIAL_DISPLAY_COUNT);
            }}
            placeholder="Search by name or area…"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/40 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={requestLocation}
          disabled={status === "loading"}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border border-border bg-card hover:bg-accent/50 active:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <DooIcon name="loader" size={15} className="animate-spin" />
          ) : (
            <DooIcon name="navigation" size={15} />
          )}
          {status === "loading" ? "Getting location…" : "Use My Location"}
        </button>

        {status === "denied" && error && (
          <p className="text-xs text-destructive px-1">{error}</p>
        )}
        {status === "unavailable" && error && (
          <p className="text-xs text-muted-foreground px-1">{error}</p>
        )}
        {status === "error" && error && (
          <p className="text-xs text-destructive px-1">{error}</p>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 pb-3">
        {results.length === 0 ? (
          <EmptyState
            icon={
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                <DooIcon name="location-pin" size={32} className="text-muted-foreground/50" />
              </div>
            }
            title="No centres found"
            description="Try a different search term or browse all centres."
            action={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-sm text-primary hover:text-primary/80 font-semibold min-h-[44px] flex items-center gap-1.5 transition-colors px-4 py-2 rounded-full border border-primary/20 hover:bg-primary/5"
                >
                  Clear search
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 pt-1 pb-0.5">
              <p className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
                <span className="tabular-nums">{results.length}</span>
                {" "}centre{results.length !== 1 ? "s" : ""}
                {hasLocation && " · nearest first"}
              </p>
            </div>
            {displayedResults.map((r) => (
              <AACResultCard
                key={r.poi.id}
                poi={r.poi}
                distanceKm={r.distanceKm}
                onSelect={handleSelect}
              />
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={handleShowMore}
                className="w-full py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-lg hover:bg-primary/5"
              >
                Show more ({results.length - displayCount} remaining)
              </button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
