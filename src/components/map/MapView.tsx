"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { CAMPUS_CENTER, CAMPUS_POIS } from "@/lib/maps/campus-pois";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function MapView() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!MAPS_API_KEY) {
      setError("Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable 3D map");
      return;
    }

    // Load the Maps JS API with maps3d library
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&v=alpha&libraries=maps3d`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Failed to load Google Maps API");
    document.head.appendChild(script);

    return () => {
      // Don't remove — Google Maps doesn't support re-loading
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/80">
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/80">
        <p className="text-muted-foreground text-sm">Loading 3D map...</p>
      </div>
    );
  }

  return <Map3DInner />;
}

function Map3DInner() {
  const mapRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const flyToTarget = useAppStore((s) => s.flyToTarget);
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const routeInfo = useAppStore((s) => s.routeInfo);
  const polylineRef = useRef<HTMLElement | null>(null);

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;

    // Wait for the web component to be registered
    await customElements.whenDefined("gmp-map-3d");

    const map = document.createElement("gmp-map-3d") as HTMLElement;
    map.setAttribute("center", `${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng},300`);
    map.setAttribute("tilt", "55");
    map.setAttribute("heading", "0");
    map.setAttribute("range", "800");
    map.style.width = "100%";
    map.style.height = "100%";

    containerRef.current.appendChild(map);
    mapRef.current = map;

    // Add markers for all POIs
    for (const poi of CAMPUS_POIS) {
      const marker = document.createElement("gmp-marker-3d") as HTMLElement;
      marker.setAttribute("position", `${poi.lat},${poi.lng},20`);
      marker.setAttribute("altitude-mode", "RELATIVE_TO_GROUND");
      marker.setAttribute("label", poi.name);
      marker.setAttribute("title", poi.name);
      map.appendChild(marker);
    }
  }, []);

  useEffect(() => {
    initMap();
  }, [initMap]);

  // Fly to target when it changes
  useEffect(() => {
    if (!flyToTarget || !mapRef.current) return;

    const map = mapRef.current;
    map.setAttribute(
      "center",
      `${flyToTarget.lat},${flyToTarget.lng},${flyToTarget.altitude || 200}`
    );
    map.setAttribute("range", "400");
    map.setAttribute("tilt", "60");

    setFlyToTarget(null);
  }, [flyToTarget, setFlyToTarget]);

  // Draw route polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!routeInfo || routeInfo.polyline.length === 0) return;

    const polyline = document.createElement("gmp-polyline-3d") as HTMLElement;
    polyline.setAttribute("altitude-mode", "CLAMP_TO_GROUND");
    polyline.setAttribute("stroke-color", "#4285F4");
    polyline.setAttribute("stroke-width", "8");

    const coords = routeInfo.polyline
      .map((p) => `${p.lat},${p.lng},0`)
      .join(" ");
    polyline.setAttribute("coordinates", coords);

    mapRef.current.appendChild(polyline);
    polylineRef.current = polyline;
  }, [routeInfo]);

  return <div ref={containerRef} className="w-full h-full relative" />;
}
