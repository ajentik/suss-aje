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
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 z-20">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-surface-brand" />
        <p className="font-semibold text-sm">{selectedDestination.name}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{Math.round(routeInfo.distanceMeters)}m</span>
        <span>{routeInfo.duration}</span>
        <span>Walking</span>
      </div>
      {solar && (
        <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs">
          <span>{SUN_ICONS[solar.sunExposure]}</span>
          <span className="text-muted-foreground">{SUN_TIPS[solar.sunExposure]}</span>
        </div>
      )}
    </div>
  );
}
