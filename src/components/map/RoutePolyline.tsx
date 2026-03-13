"use client";

import { useEffect, useRef } from "react";
import { useMap3D } from "@vis.gl/react-google-maps";
import { useAppStore } from "@/store/app-store";

export default function RoutePolyline() {
  const routeInfo = useAppStore((s) => s.routeInfo);
  const map3d = useMap3D();
  const polylineRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!map3d || !routeInfo || routeInfo.polyline.length === 0) return;

    const polyline = document.createElement("gmp-polyline-3d") as HTMLElement;
    polyline.setAttribute("altitude-mode", "CLAMP_TO_GROUND");
    polyline.setAttribute("stroke-color", "#4285F4");
    polyline.setAttribute("stroke-width", "8");

    const coords = routeInfo.polyline
      .map((p) => `${p.lat},${p.lng},0`)
      .join(" ");
    polyline.setAttribute("coordinates", coords);

    map3d.appendChild(polyline);
    polylineRef.current = polyline;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
    };
  }, [routeInfo, map3d]);

  return null;
}
