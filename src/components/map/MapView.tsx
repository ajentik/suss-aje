"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { CAMPUS_CENTER, CAMPUS_POIS } from "@/lib/maps/campus-pois";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

let mapsReady: Promise<void> | null = null;

function loadMapsAPI(): Promise<void> {
  if (mapsReady) return mapsReady;

  mapsReady = (async () => {
    // Inject the script tag if not already present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).google?.maps) {
      const existing = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );
      if (!existing) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&v=alpha&libraries=maps3d,streetView`;
        script.async = true;
        document.head.appendChild(script);
      }

      // Poll until the core API object is available
      const deadline = Date.now() + 15000;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      while (!(window as any).google?.maps?.importLibrary) {
        if (Date.now() > deadline) {
          throw new Error("Google Maps API failed to initialize (timeout)");
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    // Explicitly load the maps3d library so web components are registered
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (window as any).google.maps.importLibrary("maps3d");
  })();

  mapsReady.catch(() => {
    mapsReady = null; // allow retry on failure
  });

  return mapsReady;
}

export default function MapView() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!MAPS_API_KEY) {
      setError("Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable 3D map");
      return;
    }

    loadMapsAPI()
      .then(() => setLoaded(true))
      .catch((err) => setError(err.message));
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
  const streetViewRef = useRef<HTMLDivElement | null>(null);
  const flyToTarget = useAppStore((s) => s.flyToTarget);
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const routeInfo = useAppStore((s) => s.routeInfo);
  const polylineRef = useRef<HTMLElement | null>(null);
  const [inStreetView, setInStreetView] = useState(false);
  const [streetViewLocation, setStreetViewLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = document.createElement("gmp-map-3d") as HTMLElement;
      map.setAttribute("center", `${CAMPUS_CENTER.lat},${CAMPUS_CENTER.lng},300`);
      map.setAttribute("tilt", "55");
      map.setAttribute("heading", "0");
      map.setAttribute("range", "800");
      map.style.width = "100%";
      map.style.height = "100%";

      containerRef.current.appendChild(map);
      mapRef.current = map;

      // Double-click to enter Street View
      map.addEventListener("dblclick", (e: Event) => {
        const customEvent = e as CustomEvent;
        const detail = customEvent.detail;
        if (detail?.position) {
          const { lat, lng } = detail.position;
          setStreetViewLocation({ lat, lng });
          setInStreetView(true);
        } else {
          const center = map.getAttribute("center");
          if (center) {
            const [lat, lng] = center.split(",").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              setStreetViewLocation({ lat, lng });
              setInStreetView(true);
            }
          }
        }
      });

      // Add markers for all POIs
      for (const poi of CAMPUS_POIS) {
        const marker = document.createElement("gmp-marker-3d") as HTMLElement;
        marker.setAttribute("position", `${poi.lat},${poi.lng},20`);
        marker.setAttribute("altitude-mode", "RELATIVE_TO_GROUND");
        marker.setAttribute("label", poi.name);
        marker.setAttribute("title", poi.name);
        map.appendChild(marker);
      }
    } catch (err) {
      setMapError(err instanceof Error ? err.message : "Failed to initialize 3D map");
    }
  }, []);

  useEffect(() => {
    initMap();
  }, [initMap]);

  // Initialize Street View when entering
  useEffect(() => {
    if (!inStreetView || !streetViewLocation || !streetViewRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.maps) return;

    new google.maps.StreetViewPanorama(streetViewRef.current, {
      position: streetViewLocation,
      pov: { heading: 0, pitch: 0 },
      zoom: 1,
      motionTracking: false,
      motionTrackingControl: false,
      addressControl: true,
      fullscreenControl: false,
    });
  }, [inStreetView, streetViewLocation]);

  // Fly to target
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

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/80">
        <p className="text-muted-foreground text-sm text-center px-4">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* 3D Map */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ display: inStreetView ? "none" : "block" }}
      />

      {/* Street View */}
      {inStreetView && (
        <div className="w-full h-full relative">
          <div ref={streetViewRef} className="w-full h-full" />
          <button
            onClick={() => setInStreetView(false)}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur rounded-lg shadow-lg text-sm font-medium hover:bg-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to 3D Map
          </button>
        </div>
      )}

      {/* Street View hint */}
      {!inStreetView && !mapError && (
        <div className="absolute bottom-3 right-3 z-10 text-[10px] text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded pointer-events-none">
          Double-click to enter Street View
        </div>
      )}
    </div>
  );
}
