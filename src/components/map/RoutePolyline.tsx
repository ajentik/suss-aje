"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useAppStore } from "@/store/app-store";

export default function RoutePolyline() {
  const routeInfo = useAppStore((s) => s.routeInfo);
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!map || !routeInfo || routeInfo.polyline.length === 0) return;

    const polyline = new google.maps.Polyline({
      path: routeInfo.polyline.map((p) => ({ lat: p.lat, lng: p.lng })),
      strokeColor: "#4285F4",
      strokeOpacity: 1,
      strokeWeight: 6,
      map,
    });

    polylineRef.current = polyline;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [routeInfo, map]);

  return routeInfo && routeInfo.polyline.length > 0 ? (
    <output aria-label="Walking route displayed on map" className="sr-only" />
  ) : null;
}
