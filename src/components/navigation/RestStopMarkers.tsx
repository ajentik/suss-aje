"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { findRestStops } from "@/utils/elderNavigation";

export default function RestStopMarkers() {
  const routeInfo = useAppStore((s) => s.routeInfo);
  const mobilityLevel = useAppStore((s) => s.mobilityLevel);
  const userLocation = useAppStore((s) => s.userLocation);

  const stops = useMemo(() => {
    if (!routeInfo) return [];
    return findRestStops(routeInfo.steps, mobilityLevel);
  }, [routeInfo, mobilityLevel]);

  if (stops.length === 0) return null;

  const originLabel = userLocation
    ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
    : "start";

  return (
    <ul
      className="flex flex-col gap-1 mt-2 pt-2 border-t border-border/30"
      aria-label="Suggested rest stops"
    >
      {stops.map((stop) => (
        <li
          key={stop.stepIndex}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span aria-hidden="true">{"\uD83E\uDE91"}</span>
          <span>Rest here</span>
          <span className="ml-auto tabular-nums">
            {Math.round(stop.cumulativeDistance)} m from {originLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}
