"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Footprints, X } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { getBuildingInsights, type SolarInsight } from "@/lib/maps/solar-utils";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const SUN_ICONS: Record<SolarInsight["sunExposure"], string> = {
  High: "\u2600\uFE0F",
  Moderate: "\u26C5",
  Low: "\uD83C\uDF25\uFE0F",
};

const SUN_TIPS: Record<SolarInsight["sunExposure"], string> = {
  High: "Very sunny \u2014 bring water & sunscreen!",
  Moderate: "Partially shaded route",
  Low: "Mostly shaded \u2014 comfortable walk",
};

const SWIPE_THRESHOLD = 80;

export default function RouteOverlay() {
  const routeInfo = useAppStore((s) => s.routeInfo);
  const selectedDestination = useAppStore((s) => s.selectedDestination);
  const [solar, setSolar] = useState<SolarInsight | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [swipeY, setSwipeY] = useState(0);
  const dismissed = dismissedId === selectedDestination?.id;
  const touchStartRef = useRef(0);

  useEffect(() => {
    if (!selectedDestination || !MAPS_API_KEY) {
      return;
    }

    let cancelled = false;

    getBuildingInsights(
      selectedDestination.lat,
      selectedDestination.lng,
      MAPS_API_KEY
    )
      .then((result) => {
        if (!cancelled) setSolar(result);
      })
      .catch(() => {
        if (!cancelled) toast.error("Sun exposure data unavailable.");
      });

    return () => {
      cancelled = true;
      setSolar(null);
    };
  }, [selectedDestination]);

  const handleDismiss = useCallback(() => setDismissedId(selectedDestination?.id ?? null), [selectedDestination?.id]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartRef.current;
    if (delta > 0) setSwipeY(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeY > SWIPE_THRESHOLD) {
      setDismissedId(selectedDestination?.id ?? null);
    }
    setSwipeY(0);
  }, [swipeY, selectedDestination?.id]);

  if (!routeInfo || !selectedDestination || dismissed) return null;

  return (
    <aside
      aria-label="Walking directions"
      className="absolute left-3 right-3 md:left-auto md:right-4 md:w-72 z-20 animate-control-slide-up md:bottom-4"
      style={{
        bottom: `calc(var(--sheet-height, 64px) + 16px)`,
        transform: swipeY > 0 ? `translateY(${swipeY}px)` : undefined,
        opacity: swipeY > 0 ? Math.max(0, 1 - swipeY / (SWIPE_THRESHOLD * 1.5)) : undefined,
        transition: swipeY > 0 ? "none" : "bottom 300ms cubic-bezier(0.32, 0.72, 0, 1), transform 200ms ease, opacity 200ms ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-card/85 backdrop-blur-xl border border-border/30 rounded-2xl shadow-lg px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
              <Footprints size={16} className="text-primary" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-card-foreground truncate">
                {selectedDestination.name}
              </span>
              <span className="text-muted-foreground shrink-0">
                {routeInfo.duration} &middot; {Math.round(routeInfo.distanceMeters)}m
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss route"
            onClick={handleDismiss}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/60 active:scale-90 transition-all duration-200 shrink-0"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        {solar && (
          <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2 text-xs">
            <span>{SUN_ICONS[solar.sunExposure]}</span>
            <span className="text-muted-foreground">{SUN_TIPS[solar.sunExposure]}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
