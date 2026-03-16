"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { DooIcon } from "@/lib/icons";
import { useAppStore } from "@/store/app-store";
import { getBuildingInsights, type SolarInsight } from "@/lib/maps/solar-utils";
import { estimateElderlyWalkTime, assessRouteAccessibility } from "@/utils/elderNavigation";
import MobilitySelector from "@/components/navigation/MobilitySelector";
import RestStopMarkers from "@/components/navigation/RestStopMarkers";
import type { RouteStep } from "@/types";

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

const MANEUVER_ICONS: Record<string, string> = {
  STRAIGHT: "\u2191",
  TURN_LEFT: "\u2190",
  TURN_RIGHT: "\u2192",
  TURN_SLIGHT_LEFT: "\u2196",
  TURN_SLIGHT_RIGHT: "\u2197",
  TURN_SHARP_LEFT: "\u2199",
  TURN_SHARP_RIGHT: "\u2198",
  UTURN_LEFT: "\u21BA",
  UTURN_RIGHT: "\u21BB",
  ROUNDABOUT_LEFT: "\u21BA",
  ROUNDABOUT_RIGHT: "\u21BB",
  FERRY: "\u26F4",
  DEFAULT: "\u2022",
};

function getManeuverIcon(maneuver?: string): string {
  if (!maneuver) return MANEUVER_ICONS.DEFAULT;
  return MANEUVER_ICONS[maneuver] ?? MANEUVER_ICONS.DEFAULT;
}

function StepRow({ step }: { step: RouteStep }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span
        className="w-5 h-5 flex items-center justify-center text-sm shrink-0 mt-0.5"
        aria-hidden="true"
      >
        {getManeuverIcon(step.maneuver)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-card-foreground leading-relaxed">
          {step.instruction}
        </p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
        {step.distanceMeters < 1000
          ? `${Math.round(step.distanceMeters)}m`
          : `${(step.distanceMeters / 1000).toFixed(1)}km`}
      </span>
    </div>
  );
}

export default function RouteOverlay() {
  const routeInfo = useAppStore((s) => s.routeInfo);
  const selectedDestination = useAppStore((s) => s.selectedDestination);
  const mobilityLevel = useAppStore((s) => s.mobilityLevel);
  const [solar, setSolar] = useState<SolarInsight | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [swipeY, setSwipeY] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dismissed = dismissedId === selectedDestination?.id;
  const touchStartRef = useRef(0);

  const elderlyMinutes = routeInfo
    ? estimateElderlyWalkTime(routeInfo.distanceMeters, mobilityLevel)
    : 0;
  const displayDuration =
    mobilityLevel === "normal"
      ? routeInfo?.duration ?? ""
      : `~${elderlyMinutes} min walk`;

  const accessibility = routeInfo
    ? assessRouteAccessibility(routeInfo.steps)
    : null;

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
              <DooIcon name="navigation2" size={16} className="text-primary" />
            </div>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-card-foreground truncate">
                {selectedDestination.name}
              </span>
              <span className="text-muted-foreground shrink-0">
                {displayDuration} &middot; {Math.round(routeInfo.distanceMeters)}m
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {routeInfo.steps.length > 0 && (
              <button
                type="button"
                aria-label={expanded ? "Collapse itinerary" : "Expand itinerary"}
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/60 active:scale-90 transition-all duration-200"
              >
                {expanded ? (
                  <DooIcon name="chevron-down" size={16} className="text-muted-foreground" />
                ) : (
                  <DooIcon name="chevron-up" size={16} className="text-muted-foreground" />
                )}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss route"
              onClick={handleDismiss}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/60 active:scale-90 transition-all duration-200"
            >
              <DooIcon name="cross" size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        {solar && (
          <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2 text-xs">
            <span>{SUN_ICONS[solar.sunExposure]}</span>
            <span className="text-muted-foreground">{SUN_TIPS[solar.sunExposure]}</span>
          </div>
        )}
        <div className="mt-2 pt-2 border-t border-border/30">
          <MobilitySelector />
        </div>
        {accessibility && (accessibility.hasStairs || accessibility.hasSteepSlope) && (
          <div className="mt-2 pt-2 border-t border-border/30 flex flex-wrap gap-2 text-xs">
            {accessibility.hasStairs && (
              <span className="text-amber-600">⚠️ Stairs on route</span>
            )}
            {accessibility.hasSteepSlope && (
              <span className="text-amber-600">⚠️ Steep slope</span>
            )}
          </div>
        )}
        <RestStopMarkers />
        <div
          className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ maxHeight: expanded ? "280px" : "0px" }}
        >
          <div className="pt-2 border-t border-border/30 mt-2 overflow-y-auto max-h-[264px] overscroll-contain">
            {routeInfo.steps.map((step, i) => (
              <StepRow key={`${step.instruction}-${step.distanceMeters}-${i}`} step={step} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
