"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { getBuildingInsights, type SolarInsight } from "@/lib/maps/solar-utils";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const SUN_ICONS: Record<SolarInsight["sunExposure"], string> = {
  High: "☀️",
  Moderate: "⛅",
  Low: "🌥️",
};

const SUN_TIPS: Record<SolarInsight["sunExposure"], string> = {
  High: "Very sunny — bring water & sunscreen!",
  Moderate: "Partially shaded route",
  Low: "Mostly shaded — comfortable walk",
};

export default function RouteOverlay() {
  const routeInfo = useAppStore((s) => s.routeInfo);
  const selectedDestination = useAppStore((s) => s.selectedDestination);
  const [solar, setSolar] = useState<SolarInsight | null>(null);

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

  if (!routeInfo || !selectedDestination) return null;

  return (
    <aside aria-label="Walking directions" className="absolute bottom-36 md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:w-72 bg-card/90 backdrop-blur-lg border border-border/50 rounded-xl shadow-lg p-4 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full bg-surface-brand" />
        <p className="font-semibold text-sm text-card-foreground">{selectedDestination.name}</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-card-foreground">{Math.round(routeInfo.distanceMeters)}m</span>
        <span className="font-medium text-card-foreground">{routeInfo.duration}</span>
        <span>Walking</span>
      </div>
      {solar && (
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2 text-xs">
          <span>{SUN_ICONS[solar.sunExposure]}</span>
          <span className="text-muted-foreground">{SUN_TIPS[solar.sunExposure]}</span>
        </div>
      )}
    </aside>
  );
}
